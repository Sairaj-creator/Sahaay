import { useState, useRef, useCallback } from 'react'
import { gpt4oVision } from '../utils/openai'
import { getPrompt } from '../utils/prompts'

// ─── useVision ────────────────────────────────────────────────────────────────
// Manages webcam stream + grabs frames → sends to GPT-4o Vision
//
// Usage:
//   const { videoRef, startCamera, stopCamera, analyzeFrame, response, error } = useVision()
//   <video ref={videoRef} autoPlay playsInline muted />

export function useVision() {
  const [response, setResponse]     = useState('')
  const [error, setError]           = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const canvasRef  = useRef(document.createElement('canvas'))

  // Start webcam stream and attach to videoRef
  const startCamera = useCallback(async () => {
    // Stop any existing stream first to avoid leaks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
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
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.')
      } else {
        setError(err.message || 'Could not access camera')
      }
      console.error('[useVision] camera error:', err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }, [])

  // Grab current video frame → resize to 512×512 → base64 → GPT-4o
  const analyzeFrame = useCallback(async (mode = 'scene') => {
    if (!videoRef.current || !cameraReady) {
      setError('Camera not ready')
      return null
    }

    setError(null)
    setIsAnalyzing(true)
    setResponse('')

    try {
      const video  = videoRef.current
      const canvas = canvasRef.current

      // Resize to 512×512 — reduces base64 payload ~10x vs full HD
      canvas.width  = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')

      // Center-crop to square
      const size = Math.min(video.videoWidth, video.videoHeight)
      const sx   = (video.videoWidth  - size) / 2
      const sy   = (video.videoHeight - size) / 2
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512)

      // JPEG at 0.8 quality — good balance of quality vs size
      const dataURL   = canvas.toDataURL('image/jpeg', 0.8)
      const base64    = dataURL.split(',')[1]

      const prompt = getPrompt(mode)
      const text   = await gpt4oVision(base64, prompt)
      setResponse(text)
      return text
    } catch (err) {
      console.error('[useVision] analyze error:', err)
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
    startCamera,
    stopCamera,
    analyzeFrame,
  }
}
