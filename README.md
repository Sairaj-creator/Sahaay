# Sahaay AI — Sapthagiri Hackathon 2026

Voice-first AI companion for visually impaired users in India.

## Quick start

```bash
# 1. Clone repo and install
npm install

# 2. Add your OpenAI key
cp .env.example .env
# Edit .env → set VITE_OPENAI_API_KEY=sk-...

# 3. Run dev server
npm run dev
# Opens at http://localhost:5173
```

## Team ownership

| File/Folder | Owner |
|---|---|
| `src/hooks/useAI.js` | You (team lead) |
| `src/hooks/useMic.js` | You |
| `src/hooks/useVision.js` | You |
| `src/utils/openai.js` | You |
| `src/utils/prompts.js` | You |
| `src/utils/tts.js` | You |
| `src/screens/OrbScreen.jsx` | Sanjana |
| `src/screens/OnboardingScreen.jsx` | Sanjana |
| `src/screens/CaregiverScreen.jsx` | Samruddhi |
| `src/screens/QuickActionsScreen.jsx` | Samruddhi |
| `server/` (to be created) | Apoorva |

## Branch strategy

```
main          ← stable, demo-ready
your-name/ai  ← your branch
sanjana/ui    ← Sanjana's branch
samruddhi/caregiver ← Samruddhi's branch
apoorva/backend ← Apoorva's branch
```

## useAI hook contract

```js
const {
  status,       // 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
  response,     // string — last AI response (also auto-spoken)
  error,        // string | null
  mode,         // 'scene' | 'ocr' | 'currency' | 'face'
  trigger,      // () => void — call on button press
  switchMode,   // (mode) => void
  videoRef,     // attach to <video> for camera feed
  startCamera,  // () => void — call on mount
  cameraReady,  // boolean
} = useAI()
```
