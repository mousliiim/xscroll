export function readSetting(key, fallback) {
  try { return localStorage.getItem(`xscroll:${key}`) ?? localStorage.getItem(`video-drift-x:${key}`) ?? fallback; } catch { return fallback; }
}

export function saveSetting(key, value) {
  try { localStorage.setItem(`xscroll:${key}`, value); } catch { /* Storage can be blocked by the browser. */ }
}
