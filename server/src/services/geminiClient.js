import { getGeminiClient, GEMINI_MODEL } from '../config/gemini.js'

// Shared by every Gemini structured-JSON call in the app (analysis, improve,
// import) — same retry/backoff, same thinking-budget probe (see below), same
// finishReason/empty-text guard, so the three call sites can't drift out of
// sync with each other the way they briefly did.

const MAX_ATTEMPTS = 3
const RETRYABLE_STATUS = new Set([429, 500, 503])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err) {
  const status = err?.status ?? err?.response?.status ?? err?.cause?.status
  if (RETRYABLE_STATUS.has(status)) return true
  const message = String(err?.message || '').toLowerCase()
  return message.includes('overloaded') || message.includes('rate limit') || message.includes('unavailable')
}

// Whether this Gemini deployment accepts `thinkingConfig` at all — learned at
// runtime instead of assumed. `thinkingBudget: 0` is meant to disable Gemini
// 2.5 Flash's default "thinking" (which otherwise shares the same output-
// token budget as the real answer and can truncate a large JSON response
// before it finishes). But confirmed live against `gemini-flash-latest`:
// some models/aliases reject the field outright with a plain 400 "Request
// contains an invalid argument" instead of just ignoring it. So this is
// probed once — the first call tries it, and if that specific call 400s, it
// retries immediately without thinkingConfig and remembers not to send it
// again for the rest of this server process, rather than either hardcoding
// an assumption or failing forever.
let thinkingBudgetSupported = true

async function generateOnce(prompt, schema, maxOutputTokens) {
  const ai = getGeminiClient()
  const baseConfig = {
    responseMimeType: 'application/json',
    responseSchema: schema,
    maxOutputTokens,
  }

  if (thinkingBudgetSupported) {
    try {
      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { ...baseConfig, thinkingConfig: { thinkingBudget: 0 } },
      })
    } catch (err) {
      if (err?.status !== 400) throw err
      thinkingBudgetSupported = false
      // Fall through to the plain call below — same attempt, no extra wait.
    }
  }

  return ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: baseConfig })
}

// Returns the raw JSON text on success, or throws the last error after
// exhausting retries. Retries only transient failures (rate limits,
// momentary server hiccups) with exponential backoff — a bad prompt, a
// missing key, or a genuinely-too-long response fails immediately instead of
// retrying something that will never succeed.
export async function callGeminiJSON({ prompt, schema, maxOutputTokens }) {
  let lastErr

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await generateOnce(prompt, schema, maxOutputTokens)
      const finishReason = response.candidates?.[0]?.finishReason
      if (finishReason === 'MAX_TOKENS') {
        throw new Error('Gemini response was cut off (hit the output token limit) before finishing the JSON')
      }
      if (!response.text) {
        throw new Error(`Gemini returned no text (finishReason: ${finishReason || 'unknown'})`)
      }
      return response.text
    } catch (err) {
      lastErr = err
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break
      await sleep(500 * 2 ** (attempt - 1))
    }
  }

  throw lastErr
}
