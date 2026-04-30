import { useEffect } from 'react'
import { useAI } from './hooks/useAI'

const STATUS_COLORS = {
  idle:      'bg-slate-800 text-slate-300',
  listening: 'bg-red-500/20 text-red-400 border-red-500/50',
  thinking:  'bg-amber-500/20 text-amber-400 border-amber-500/50',
  speaking:  'bg-green-500/20 text-green-400 border-green-500/50',
  error:     'bg-red-900/40 text-red-300 border-red-800',
}

const MODES = ['auto', 'scene', 'ocr', 'currency', 'face']
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

export default function App() {
  const {
    status, response, error, mode, lang,
    trigger, switchMode, switchLanguage,
    videoRef, startCamera, stopCamera, cameraReady,
    isRecording, isTranscribing, isAnalyzing, detectedMode,
  } = useAI()

  useEffect(() => { 
    startCamera() 
    return () => stopCamera()
  }, [startCamera, stopCamera])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6 font-sans">
      {/* Header & Status */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-blue-400">Sahaay AI</h1>
        <span className={`text-xs font-semibold px-4 py-1 rounded-full border transition-all duration-300 uppercase tracking-widest ${STATUS_COLORS[status] || STATUS_COLORS.idle}`}>
          {status}
          {isRecording && ' · recording'}
          {isTranscribing && ' · transcribing'}
          {isAnalyzing && ' · analyzing'}
        </span>
      </div>

      {/* Camera Preview */}
      <div className="relative w-72 h-72 rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl group">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale-[0.3] contrast-125" />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500 text-sm animate-pulse">
            Initializing Vision...
          </div>
        )}
        <div className="absolute inset-0 border-[12px] border-black/10 pointer-events-none"></div>
      </div>

      {/* Mode Selectors */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {MODES.map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all
                ${mode === m ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/40 text-white scale-105' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
              {m}
            </button>
          ))}
        </div>
        {mode === 'auto' && detectedMode && (
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">
            detected: {detectedMode}
          </span>
        )}
      </div>

      {/* Language Selectors */}
      <div className="flex gap-2">
        {LANGUAGES.map((l) => (
          <button key={l.code} onClick={() => switchLanguage(l.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${lang === l.code ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Main Interaction Button */}
      <div className="relative">
        {status === 'listening' && (
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150"></div>
        )}
        <button onClick={trigger}
          disabled={status === 'thinking'}
          className={`relative w-28 h-28 rounded-full font-black text-xs uppercase tracking-tighter shadow-2xl transition-all duration-300 transform
            ${status === 'listening' ? 'bg-red-600 scale-110 shadow-red-900/50' :
              status === 'thinking'  ? 'bg-slate-700 opacity-50 cursor-not-allowed' :
              status === 'speaking'  ? 'bg-green-600 shadow-green-900/50 scale-105' :
              'bg-blue-600 hover:bg-blue-500 active:scale-90 shadow-blue-900/50'}`}>
          {status === 'idle' && 'TAP TO START'}
          {status === 'listening' && 'STOP NOW'}
          {status === 'thinking' && 'Thinking'}
          {status === 'speaking' && 'STOP TALKING'}
          {status === 'error' && 'RETRY'}
        </button>
      </div>

      {/* AI Response Display */}
      {(response || error) && (
        <div className={`max-w-xs w-full text-center text-sm leading-relaxed rounded-2xl p-5 border shadow-xl animate-in fade-in slide-in-from-bottom-4
          ${error ? 'bg-red-950/30 border-red-800/50 text-red-200' : 'bg-slate-900/50 border-slate-800 text-blue-100'}`}>
          {error || response}
        </div>
      )}

      <p className="text-[10px] text-slate-700 text-center max-w-[200px] leading-tight">
        Gemini → Groq → cached fallback chain active.
        <br/>Web Speech → Whisper fallback active.
        <br/>MobileNet auto-mode · Haptics · Multi-language.
      </p>
    </div>
  )
}
