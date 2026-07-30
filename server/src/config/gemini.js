import { GoogleGenAI } from '@google/genai'

let client = null

// Lazily constructed, same pattern as ImageKit's client — the app can still
// boot without a Gemini key configured, it just errors when analysis is
// actually attempted, with a message pointing at what to fix.
export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set — add your Gemini API key to server/.env')
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return client
}

// Uses Google's "latest" alias instead of pinning a specific version like
// "gemini-2.5-flash" — Gemini model versions get retired on a schedule
// (sometimes early — 2.5-flash was pulled ahead of its own posted deadline),
// and gemini-flash-latest is hot-swapped by Google to always point at their
// current Flash model, so this doesn't silently break every few months.
// Override via GEMINI_MODEL in .env if you ever want to pin a specific version.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
