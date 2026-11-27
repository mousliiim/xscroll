import { LANGUAGE_KEY, language, normalizeLanguage, setLanguage } from '../../remote/language.mjs';

export async function extensionLanguage(onChange) {
  const system = chrome.i18n.getUILanguage();
  const change = value => {
    setLanguage(value || system);
    onChange(language());
  };
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[LANGUAGE_KEY]) change(changes[LANGUAGE_KEY].newValue);
  });
  const saved = await chrome.storage.local.get(LANGUAGE_KEY).catch(() => ({}));
  change(saved[LANGUAGE_KEY]);
}

export function saveLanguage(value) {
  return chrome.storage.local.set({ [LANGUAGE_KEY]: normalizeLanguage(value) });
}
