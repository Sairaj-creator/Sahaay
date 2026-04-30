import { useState, useRef, useCallback, useEffect } from 'react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useMic() {
  const [isRecording,    setIsRecording]    = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript,     setTranscript]     = useState('')
  const [error,          setError]          = useState(null)

  const recognitionRef = useRef(null)
  const resolveRef     = useRef(null)
  const rejectRef      = useRef(null)

  useEffect(() => {
    if (!SpeechRecognition) console.warn('[useMic] Use Chrome or Edge.')
  }, [])

  // Returns Promise<string> — resolves with transcript when speech ends
  const startRecording = useCallback((lang = 'en-IN') => {
    return new Promise((resolve, reject) => {
      if (!SpeechRecognition) {
        const msg = 'Voice input not supported. Please open Sahaay in Chrome or Edge.'
        setError(msg)
        reject(new Error(msg))
        return
      }

      if (recognitionRef.current) recognitionRef.current.abort()

      setError(null)
      setTranscript('')
      resolveRef.current = resolve
      rejectRef.current  = reject

      const recognition = new SpeechRecognition()
      recognition.lang            = lang    // en-IN | hi-IN | kn-IN
      recognition.continuous      = false
      recognition.interimResults  = false
      recognition.maxAlternatives = 1

      recognition.onstart     = () => { setIsRecording(true);  setIsTranscribing(false) }
      recognition.onspeechend = () => { setIsRecording(false); setIsTranscribing(true)  }

      recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript?.trim() || ''
        setTranscript(text)
        setIsTranscribing(false)
        resolveRef.current?.(text)
        resolveRef.current = null
        rejectRef.current  = null
      }

      recognition.onerror = (event) => {
        setIsRecording(false)
        setIsTranscribing(false)
        if (event.error === 'aborted') {
          resolveRef.current?.('')
          resolveRef.current = null
          rejectRef.current  = null
          return
        }
        const errorMap = {
          'not-allowed':   'Microphone permission denied. Please allow mic access.',
          'no-speech':     'No speech detected. Please try again.',
          'network':       'Network error. Check your connection and try again.',
          'audio-capture': 'No microphone found. Please connect a microphone.',
        }
        const msg = errorMap[event.error] || `Speech error: ${event.error}`
        setError(msg)
        rejectRef.current?.(new Error(msg))
        resolveRef.current = null
        rejectRef.current  = null
      }

      recognition.onend = () => {
        setIsRecording(false)
        setIsTranscribing(false)
        if (resolveRef.current) {
          resolveRef.current('')
          resolveRef.current = null
          rejectRef.current  = null
        }
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch (err) {
        const msg = 'Could not start microphone: ' + err.message
        setError(msg)
        reject(new Error(msg))
      }
    })
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    supported: !!SpeechRecognition,
  }
}
