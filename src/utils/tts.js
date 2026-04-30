// ─── Text-to-Speech utility (Web Speech API — free, zero latency) ─────────────

let currentUtterance = null

export function speak(text, { lang = 'en-IN', rate = 1, onEnd } = {}) {
  // Cancel anything currently speaking
  window.speechSynthesis.cancel()

  if (!text) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang        // en-IN, hi-IN, kn-IN
  utterance.rate = rate        // 0.8 = slower for clarity, 1.2 = faster
  utterance.pitch = 1
  utterance.volume = 1

  if (onEnd) utterance.onend = onEnd
  utterance.onerror = (e) => console.error('[Sahaay TTS error]', e)

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  window.speechSynthesis.cancel()
  currentUtterance = null
}

export function isSpeaking() {
  return window.speechSynthesis.speaking
}

// Language codes for the toggle Samruddhi will build
export const LANG_CODES = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
}
