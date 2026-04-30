import { useState, useRef, useCallback, useEffect } from 'react'
import { transcribeWithWhisper } from '../utils/whisper'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useMic() {
  const [isRecording,    setIsRecording]    = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript,     setTranscript]     = useState('')
  const [error,          setError]          = useState(null)

  const recognitionRef   = useRef(null)
  const resolveRef       = useRef(null)
  const rejectRef        = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])

  useEffect(() => {
    if (!SpeechRecognition) console.warn('[useMic] Web Speech unavailable — Whisper will be used.')
  }, [])

  // ── Whisper fallback (MediaRecorder → OpenAI Whisper API) ─────────────────
  const startWhisperRecording = useCallback((lang = 'en-IN') => {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioChunksRef.current = []

        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
          .find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm'

        const recorder = new MediaRecorder(stream, { mimeType })
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }

        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop())
          setIsRecording(false)
          setIsTranscribing(true)
          try {
            const blob = new Blob(audioChunksRef.current, { type: mimeType })
            const text = await transcribeWithWhisper(blob, lang)
            setTranscript(text)
            resolve(text)
          } catch (err) {
            reject(err)
          } finally {
            setIsTranscribing(false)
          }
        }

        recorder.start()
        setIsRecording(true)
      } catch (err) {
        reject(err)
      }
    })
  }, [])

  // ── Web Speech primary path ────────────────────────────────────────────────
  const startRecording = useCallback((lang = 'en-IN') => {
    if (!SpeechRecognition) return startWhisperRecording(lang)

    return new Promise((resolve, reject) => {
      if (recognitionRef.current) recognitionRef.current.abort()

      setError(null)
      setTranscript('')
      resolveRef.current = resolve
      rejectRef.current  = reject

      const recognition = new SpeechRecognition()
      recognition.lang            = lang
      recognition.continuous      = false
      recognition.interimResults  = false
      recognition.maxAlternatives = 1

      recognition.onstart     = () => { setIsRecording(true);  setIsTranscribing(false) }
      recognition.onspeechend = () => { setIsRecording(false); setIsTranscribing(true)  }

      recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript?.trim() || ''
        setTranscript(text)
        setIsTranscribing(false)
        resolve(text)
        resolveRef.current = null
        rejectRef.current  = null
      }

      recognition.onerror = async (event) => {
        setIsRecording(false)
        setIsTranscribing(false)

        if (event.error === 'aborted') {
          resolve('')
          resolveRef.current = null
          rejectRef.current  = null
          return
        }

        // Network error → transparent Whisper fallback
        if (event.error === 'network') {
          console.warn('[useMic] Web Speech network error → Whisper fallback')
          recognitionRef.current = null
          resolveRef.current = null
          rejectRef.current  = null
          try { resolve(await startWhisperRecording(lang)) }
          catch { resolve('') }
          return
        }

        const errorMap = {
          'not-allowed':   'Microphone permission denied. Please allow mic access.',
          'no-speech':     'No speech detected. Please try again.',
          'audio-capture': 'No microphone found. Please connect a microphone.',
        }
        const msg = errorMap[event.error] || `Speech error: ${event.error}`
        setError(msg)
        reject(new Error(msg))
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
        reject(new Error('Could not start microphone: ' + err.message))
      }
    })
  }, [startWhisperRecording])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    supported: true, // always true — Web Speech + Whisper covers all browsers
  }
}
