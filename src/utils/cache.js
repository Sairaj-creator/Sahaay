const CACHE_KEY   = 'sahaay_responses'
const MAX_ENTRIES = 5

// Save the most recent AI response for a given mode (keeps last 5 across modes)
export function saveResponse(mode, text) {
  try {
    const updated = [
      { mode, text, ts: Date.now() },
      ...readCache().filter(e => e.mode !== mode),
    ].slice(0, MAX_ENTRIES)
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated))
  } catch {}
}

export function getCachedResponse(mode) {
  try { return readCache().find(e => e.mode === mode)?.text ?? null }
  catch { return null }
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') }
  catch { return [] }
}
