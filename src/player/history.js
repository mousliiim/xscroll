import { readSetting, saveSetting } from './settings.js';

const RETENTION = 14 * 24 * 60 * 60 * 1000;
const LIMIT = 1600;

export function clipIdentities(clip) {
  if (typeof clip?.key !== 'string' || clip.key.length > 500) return [];
  const identities = [clip.key];
  if (typeof clip.url !== 'string') return identities;
  try {
    const url = new URL(clip.url);
    if (url.origin !== 'https://video.twimg.com') return identities;
    const media = url.pathname.match(/^\/(ext_tw_video|amplify_video|tweet_video)\/([\w-]+)/);
    if (media) identities.push(`media:${media[1]}:${media[2].replace(/\.mp4$/i, '')}`);
    else identities.push(`media:${url.pathname.replace(/\/\d+x\d+\//, '/')}`);
  } catch { /* A media key still works for videos without a canonical URL. */ }
  return identities.filter(key => key.length <= 500);
}

export function createWatchHistory({
  load = key => readSetting(key, '[]'), save = saveSetting, now = Date.now,
  storage = globalThis.chrome?.storage,
} = {}) {
  const memory = new Map();
  const saved = new Map();
  const namespace = key => `history:${key}`;
  let activeKey;

  function storageKey() {
    const account = typeof document === 'undefined' ? '' : document.cookie.match(/(?:^|;\s*)twid=u(?:%3D|=)(\d+)/i)?.[1];
    return account ? `watched:${account}` : 'watched';
  }

  function validEntries(values) {
    const cutoff = now() - RETENTION;
    return Array.isArray(values) ? values.filter(value => Array.isArray(value) &&
      typeof value[0] === 'string' && value[0].length <= 500 && Number.isFinite(value[1]) && value[1] >= cutoff).slice(-LIMIT) : [];
  }

  function useKey(key) {
    if (activeKey === key) return;
    activeKey = key;
    storage?.local?.get(namespace(key)).then(result => {
      saved.set(key, validEntries(result[namespace(key)]));
    }).catch(() => {});
  }

  storage?.onChanged?.addListener((changes, area) => {
    const key = activeKey && namespace(activeKey);
    if (area === 'local' && key && changes[key]) saved.set(activeKey, validEntries(changes[key].newValue));
  });
  useKey(storageKey());

  function storedEntries(key) {
    try { return validEntries(JSON.parse(load(key))); }
    catch { return []; }
  }

  function recent(key) {
    const cutoff = now() - RETENTION;
    const merged = new Map();
    for (const [alias, time] of [...storedEntries(key), ...(saved.get(key) || []), ...(memory.get(key) || [])]) {
      if (time >= cutoff && time > (merged.get(alias) || 0)) {
        merged.delete(alias);
        merged.set(alias, time);
      }
    }
    return merged;
  }

  return {
    snapshot() {
      const key = storageKey();
      useKey(key);
      return new Set(recent(key).keys());
    },
    mark(clip) {
      const aliases = clipIdentities(clip);
      if (!aliases.length) return;
      const key = storageKey();
      useKey(key);
      const watched = recent(key);
      for (const alias of aliases) {
        watched.delete(alias);
        watched.set(alias, now());
      }
      const entries = [...watched].slice(-LIMIT);
      memory.set(key, entries);
      storage?.local?.set({ [namespace(key)]: entries }).catch(() => {});
      try { save(key, JSON.stringify(entries)); } catch { /* Keep the in-tab copy. */ }
    },
  };
}
