import { GoogleGenAI } from '@google/genai'

let client = null

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set — add your Gemini API key to server/.env')
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return client
}

// Fallback chain — tried in order until one works
// Override first model via GEMINI_MODEL in .env
export const MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,        // .env override goes first if set
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.0-flash',
].filter(Boolean) // remove undefined if GEMINI_MODEL not set

// Keep this for any code that imports GEMINI_MODEL directly
export const GEMINI_MODEL = MODEL_FALLBACKS[0]