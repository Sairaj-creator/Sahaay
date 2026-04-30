import { groqVision } from './groq'
import { saveResponse, getCachedResponse } from './cache'

const GEMINI_KEY   = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.0-flash-lite'

if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') {
  console.warn('[Sahaay] VITE_GEMINI_API_KEY not set in .env')
}

const PRESCRIPTED = {
  scene:    'Scene analysis is temporarily unavailable. Please check your connection and try again.',
  ocr:      'Text reading is temporarily unavailable. Please try again when connected.',
  currency: 'Currency recognition is unavailable. Hold the note flat under good light and try again.',
  face:     'Person recognition is temporarily unavailable. Please try again shortly.',
  auto:     'The AI assistant is temporarily unavailable. Please check your connection and try again.',
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options)
    if (res.status === 429 && attempt < retries) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '10', 10)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      continue
    }
    return res
  }
}

async function callGemini(base64Image, prompt) {
  if (!GEMINI_KEY) throw new Error('VITE_GEMINI_API_KEY not configured')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: prompt },
        { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
      ]}],
      generationConfig: { maxOutputTokens: 300, temperature: 0.2 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const error = new Error(err?.error?.message || `Gemini error ${res.status}`)
    error.status = res.status
    throw error
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

// Full fallback chain: Gemini Flash Lite → Groq LLaVA → cached → pre-scripted
export async function gpt4oVision(base64Image, prompt, mode = 'scene') {
  // Primary: Gemini Flash Lite
  try {
    const text = await callGemini(base64Image, prompt)
    if (text) saveResponse(mode, text)
    return text
  } catch (err) {
    const isRateLimit = err.status === 429
    const isOffline   = !navigator.onLine || err.message?.includes('Failed to fetch')
    if (!isRateLimit && !isOffline) throw err
    console.warn('[Sahaay] Gemini unavailable, trying Groq:', err.message)
  }

  // Fallback: Groq LLaVA / Llama
  try {
    const text = await groqVision(base64Image, prompt)
    if (text) saveResponse(mode, text)
    return text
  } catch (err) {
    console.warn('[Sahaay] Groq also unavailable, using emergency:', err.message)
  }

  // Emergency: last cached response for this mode → pre-scripted
  return getCachedResponse(mode) ?? PRESCRIPTED[mode] ?? PRESCRIPTED.scene
}
