import { useState, useRef, useCallback } from 'react'
import { gpt4oVision } from '../utils/openai'
import { getPrompt, AUTO_PROMPT } from '../utils/prompts'
import { classifyMode } from '../utils/mobilenet'

export function useVision() {
  const [response,      setResponse]      = useState('')
  const [error,         setError]         = useState(null)
  const [isAnalyzing,   setIsAnalyzing]   = useState(false)
  const [cameraReady,   setCameraReady]   = useState(false)
  const [detectedMode,  setDetectedMode]  = useState(null)

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setCameraReady(true)
      }
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : err.message || 'Could not access camera'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
  }, [])

  const analyzeFrame = useCallback(async (mode = 'scene') => {
    if (!videoRef.current || !cameraReady) {
      setError('Camera not ready')
      return null
    }

    setError(null)
    setIsAnalyzing(true)
    setResponse('')
    setDetectedMode(null)

    try {
      // Capture frame — center-crop to 512×512, JPEG 0.8
      const video  = videoRef.current
      const canvas = canvasRef.current
      canvas.width  = 512
      canvas.height = 512
      const ctx  = canvas.getContext('2d')
      const size = Math.min(video.videoWidth, video.videoHeight)
      const sx   = (video.videoWidth  - size) / 2
      const sy   = (video.videoHeight - size) / 2
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512)
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

      let effectiveMode = mode
      let prompt        = getPrompt(mode)

      // Auto mode: MobileNet classifier → detected mode → prompt
      // If MobileNet fails, Gemini uses AUTO_PROMPT (detects + describes in one call)
      if (mode === 'auto') {
        try {
          effectiveMode = await classifyMode(video)
          setDetectedMode(effectiveMode)
          prompt = getPrompt(effectiveMode)
        } catch {
          effectiveMode = 'auto'
          prompt = AUTO_PROMPT
        }
      }

      // Camera path: Gemini → Groq → cached → pre-scripted (all in gpt4oVision)
      const text = await gpt4oVision(base64, prompt, effectiveMode)
      setResponse(text)
      return text
    } catch (err) {
      console.error('[useVision]', err)
      setError(err.message || 'Analysis failed')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [cameraReady])

  return {
    videoRef,
    cameraReady,
    isAnalyzing,
    response,
    error,
    detectedMode,
    startCamera,
    stopCamera,
    analyzeFrame,
  }
}
