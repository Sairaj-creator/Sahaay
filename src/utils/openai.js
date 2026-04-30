const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') {
  console.warn('[Sahaay] VITE_GEMINI_API_KEY not set in .env')
}

const GEMINI_MODEL = 'gemini-2.0-flash-lite'

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options)
    if (res.status === 429 && attempt < retries) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '10', 10)
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
      continue
    }
    return res
  }
}

// ─── Gemini Vision ────────────────────────────────────────────────────────────
// Takes base64 image string + a prompt → returns AI text response
// Note: base64 string must NOT include the "data:image/jpeg;base64," prefix.
export async function gpt4oVision(base64Image, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
        ]
      }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.2 }
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}
