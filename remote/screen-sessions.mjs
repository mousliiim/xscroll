import { randomBytes, randomInt } from 'node:crypto';

const PAIR_FOR = 3 * 60 * 1000;
const WATCH_FOR = 4 * 60 * 60 * 1000;
const ACTIVE_FOR = 15000;

export function createScreenSessions(now = Date.now) {
  const pending = new Map();
  let active;

  function current() {
    if (active && (active.expires <= now() || now() - active.seen > ACTIVE_FOR)) active = undefined;
    return active;
  }

  function request(token) {
    for (const [key, entry] of pending) {
      if (entry.expires <= now()) pending.delete(key);
    }
    const prior = pending.get(token);
    if (prior) return { token, code: prior.code };
    let code;
    do { code = String(randomInt(100000, 1000000)); }
    while ([...pending.values()].some(entry => entry.code === code));
    const key = randomBytes(24).toString('hex');
    pending.set(key, { code, expires: now() + PAIR_FOR });
    if (pending.size > 24) pending.delete(pending.keys().next().value);
    return { token: key, code };
  }

  function approve(code) {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return false;
    for (const [token, entry] of pending) {
      if (entry.code !== code || entry.expires <= now()) continue;
      pending.delete(token);
      active = { token, expires: now() + WATCH_FOR, seen: now(), audio: false };
      return true;
    }
    return false;
  }

  function status(token, touch = true) {
    const session = current();
    if (session && session.token === token) {
      if (touch) session.seen = now();
      return { phase: 'connected' };
    }
    const entry = pending.get(token);
    return entry?.expires > now() ? { phase: 'pending', code: entry.code } : { phase: 'expired' };
  }

  function setAudio(token, enabled) {
    const session = current();
    if (!session || session.token !== token) return false;
    session.audio = Boolean(enabled);
    return true;
  }

  return {
    request, approve, status, setAudio,
    connected: () => Boolean(current()),
    audio: () => current()?.audio === true,
    disconnect() { active = undefined; },
    reset() { active = undefined; pending.clear(); },
  };
}
