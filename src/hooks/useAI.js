import { useState, useCallback, useRef, useEffect } from 'react'
import { useMic } from './useMic'
import { useVision } from './useVision'
import { speak, stopSpeaking, LANG_CODES } from '../utils/tts'
import { UI_STRINGS } from '../utils/prompts'
import { vibrate, VIBRATIONS } from '../utils/haptics'

// ─── useAI ────────────────────────────────────────────────────────────────────
// The master hook for Sahaay AI. Composes Vision, Mic (STT), and TTS.
// Contract: trigger() starts/stops the interaction cycle.

export function useAI() {
  const [status, setStatus]     = useState('idle')
  const [response, setResponse] = useState('')
  const [mode, setMode]         = useState('scene')
  const [lang, setLang]         = useState('en')
  const [aiError, setAiError]   = useState(null)

  const mic    = useMic()
  const vision = useVision()
  
  const isProcessingRef = useRef(false)
  const micPromiseRef   = useRef(null)
  const timerRef        = useRef(null)

  const str = UI_STRINGS[lang] || UI_STRINGS.en

  // ── Processing Logic ──────────────────────────────────────────────────────
  const finishListening = useCallback(async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    if (timerRef.current) clearTimeout(timerRef.current)
    
    vibrate(VIBRATIONS.stop)
    setStatus('thinking')
    
    try {
      // 1. If mic is still recording, stop it and wait for the final transcript
      mic.stopRecording()
      
      // 2. We await both the mic result (from the promise startRecording returned)
      // and the vision analysis in parallel.
      const [userText, aiText] = await Promise.all([
        micPromiseRef.current || Promise.resolve(''),
        vision.analyzeFrame(mode)
      ])

      const result = aiText || userText || str.noUnderstand
      setResponse(result)

      setStatus('speaking')
      speak(result, {
        lang: LANG_CODES[lang],
        onEnd: () => setStatus('idle'),
      })
    } catch (err) {
      console.error('[useAI] Error:', err)
      setAiError(err.message || 'Something went wrong')
      setStatus('error')
      vibrate(VIBRATIONS.error)
      speak(str.error, { lang: LANG_CODES[lang] })
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      isProcessingRef.current = false
      micPromiseRef.current = null
    }
  }, [mode, vision, mic, lang, str])

  // ── Auto-proceed when mic naturally ends (Silence detection) ──────────────
  useEffect(() => {
    if (status === 'listening' && !mic.isRecording && !isProcessingRef.current) {
      finishListening()
    }
  }, [mic.isRecording, status, finishListening])

  const trigger = useCallback(async () => {
    if (status === 'speaking') {
      stopSpeaking()
      vibrate(VIBRATIONS.tap)
      setStatus('idle')
      return
    }

    if (status === 'listening') {
      finishListening()
      return
    }

    if (status === 'thinking') return

    // Start New Cycle
    setAiError(null)
    setResponse('')
    setStatus('listening')
    vibrate(VIBRATIONS.start)
    speak(str.listening, { lang: LANG_CODES[lang], rate: 1.1 })
    
    // Store the promise so we can await it later
    micPromiseRef.current = mic.startRecording(LANG_CODES[lang])

    // Safety timeout
    timerRef.current = setTimeout(() => {
      setStatus(curr => {
        if (curr === 'listening') finishListening()
        return curr
      })
    }, 8000)
  }, [status, mic, finishListening, lang, str])

  const switchMode = useCallback((newMode) => {
    if (status !== 'idle' && status !== 'error' && status !== 'speaking') return
    setMode(newMode)
    setResponse('')
    setAiError(null)
    vibrate(VIBRATIONS.tap)
    speak(str.modes[newMode] || newMode, { lang: LANG_CODES[lang] })
  }, [status, lang, str])

  const switchLanguage = useCallback((newLang) => {
    if (status !== 'idle' && status !== 'error' && status !== 'speaking') return
    setLang(newLang)
    vibrate(VIBRATIONS.tap)
    const announcements = { en: 'English', hi: 'हिंदी', kn: 'ಕನ್ನಡ' }
    speak(announcements[newLang], { lang: LANG_CODES[newLang] })
  }, [status])

  return {
    status,
    response,
    error: aiError || mic.error || vision.error,
    mode,
    lang,
    trigger,
    switchMode,
    switchLanguage,
    videoRef: vision.videoRef,
    startCamera: vision.startCamera,
    stopCamera: vision.stopCamera,
    cameraReady: vision.cameraReady,
    isRecording: mic.isRecording,
    isTranscribing: mic.isTranscribing,
    isAnalyzing: vision.isAnalyzing,
    micSupported: mic.supported,
    supported: mic.supported,
  }
}
