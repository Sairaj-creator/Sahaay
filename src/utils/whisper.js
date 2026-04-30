const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY

if (!OPENAI_KEY) console.warn('[Sahaay] VITE_OPENAI_API_KEY not set — Whisper fallback disabled')

export async function transcribeWithWhisper(audioBlob, lang = 'en-IN') {
  if (!OPENAI_KEY) throw new Error('VITE_OPENAI_API_KEY not configured')

  const langCode = lang.split('-')[0] // 'en', 'hi', 'kn'
  const ext      = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'

  const formData = new FormData()
  formData.append('file', audioBlob, `recording.${ext}`)
  formData.append('model', 'whisper-1')
  formData.append('language', langCode)

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Whisper error ${res.status}`)
  }

  const data = await res.json()
  return data.text?.trim() || ''
}
