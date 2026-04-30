// ─── GPT-4o Vision Prompts for Sahaay AI ─────────────────────────────────────
// These are tuned for Indian context. Test in OpenAI Playground before changing.

export const PROMPTS = {
  scene: `You are Sahaay, an AI assistant for visually impaired users in India.
Describe what you see in 2 to 3 short sentences.
Focus on: people, objects, visible text, hazards, and the overall setting.
Be specific and direct. Do not start with "I see" or "The image shows".
Use simple conversational language.`,

  ocr: `You are Sahaay, an AI assistant for visually impaired users in India.
Read all the text visible in this image out loud.
If this is a medicine label or strip, say the drug name, dosage, and how to take it first.
If this is a signboard or document, read the text in natural reading order.
If there is Hindi or Kannada text, read it and translate it to English.
Keep it short and clear.`,

  currency: `You are Sahaay, an AI assistant for visually impaired users in India.
Look at this image and identify the Indian rupee note.
Reply with exactly one sentence in this format: "This is a [denomination] rupee note."
Valid denominations are: 10, 20, 50, 100, 200, 500.
If you cannot clearly identify a rupee note, say exactly:
"I could not identify the note. Please hold it flat under good light and try again."`,

  face: `You are Sahaay, an AI assistant for visually impaired users in India.
Describe the person or people in this image briefly.
Include: approximate age, gender if apparent, what they are wearing, and their expression.
Keep it to 1 to 2 sentences. Do not guess names.`,
}

// ─── UI Strings for Localization ──────────────────────────────────────────
export const UI_STRINGS = {
  en: {
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
    error: 'Sorry, something went wrong. Please try again.',
    noUnderstand: 'Sorry, I could not understand that.',
    modes: {
      auto: 'Auto mode',
      scene: 'Scene mode',
      ocr: 'Read mode',
      currency: 'Currency mode',
      face: 'Person mode',
    },
  },
  hi: {
    listening: 'सुन रहा हूँ...',
    thinking: 'सोच रहा हूँ...',
    speaking: 'बोल रहा हूँ...',
    error: 'क्षमा करें, कुछ गलत हो गया। फिर से प्रयास करें।',
    noUnderstand: 'क्षमा करें, मुझे समझ नहीं आया।',
    modes: {
      auto: 'ऑटो मोड',
      scene: 'दृश्य मोड',
      ocr: 'पढ़ने वाला मोड',
      currency: 'मुद्रा मोड',
      face: 'चेहरा मोड',
    },
  },
  kn: {
    listening: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...',
    thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
    speaking: 'ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...',
    error: 'ಕ್ಷಮಿಸಿ, ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    noUnderstand: 'ಕ್ಷಮಿಸಿ, ಅದು ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ.',
    modes: {
      auto: 'ಆಟೋ ಮೋಡ್',
      scene: 'ದೃಶ್ಯ ಮೋಡ್',
      ocr: 'ಓದುವ ಮೋಡ್',
      currency: 'ಹಣದ ಮೋಡ್',
      face: 'ಮುಖದ ಮೋಡ್',
    },
  },
}

// Gemini fallback prompt for the mode router when MobileNet fails
// Handles detection + description in a single call
export const AUTO_PROMPT = `You are Sahaay, an AI assistant for visually impaired users in India.
Look at this image and give the most helpful response for a visually impaired person:
- If you see an Indian rupee note, say the denomination clearly.
- If you see a person, briefly describe them in 1-2 sentences.
- If you see readable text (signs, labels, medicine, documents), read the most important text.
- Otherwise, describe the scene in 2-3 sentences.
Be direct and concise. Do not explain what you are doing.`

// Helper: pick the right prompt for a given mode
export function getPrompt(mode) {
  return PROMPTS[mode] || PROMPTS.scene
}
