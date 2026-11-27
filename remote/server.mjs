import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import { isIPv4 } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REMOTE_PORT, remoteCommand, remoteStatus } from './protocol.mjs';
import { configureWslLan, wslLan } from './wsl-lan.mjs';
import { normalizeLanguage, translate } from './language.mjs';
import { createScreenSessions } from './screen-sessions.mjs';

const COOKIE = 'xscroll-remote';
const SCREEN_COOKIE = 'xscroll-screen';
const MAX_SESSION = 4 * 60 * 60 * 1000;
const activeFor = 9000;
const icon = new URL('../icons/icon128.png', import.meta.url);
const assets = new Map([
  ['/icon.png', [existsSync(icon) ? icon : '../extension/icons/icon128.png', 'image/png']],
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/remote.css', ['remote.css', 'text/css; charset=utf-8']],
  ['/remote.js', ['remote.js', 'text/javascript; charset=utf-8']],
  ['/screen', ['screen.html', 'text/html; charset=utf-8']],
  ['/screen/', ['screen.html', 'text/html; charset=utf-8']],
  ['/screen.css', ['screen.css', 'text/css; charset=utf-8']],
  ['/screen.js', ['screen.js', 'text/javascript; charset=utf-8']],
  ['/language.mjs', ['language.mjs', 'text/javascript; charset=utf-8']],
  ['/screen-clock.mjs', ['screen-clock.mjs', 'text/javascript; charset=utf-8']],
].map(([key, [name, type]]) => [key, { data: readFileSync(new URL(name, import.meta.url)), type }]));

const loopbackAddresses = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function localIPv4(address = '') {
  const ip = address.replace(/^::ffff:/, '');
  if (!isIPv4(ip)) return false;
  const [first, second] = ip.split('.').map(Number);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) || (first === 169 && second === 254);
}

function hostAddresses() {
  return [...new Set(Object.values(os.networkInterfaces()).flat()
    .filter(entry => entry?.family === 'IPv4' && !entry.internal && localIPv4(entry.address)).map(entry => entry.address))];
}

function reply(response, status, data, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    ...headers,
  });
  response.end(JSON.stringify(data));
}

function cookie(request, name) {
  return request.headers.cookie?.match(new RegExp(`(?:^|;\\s*)${name}=([a-f0-9]{48})(?:;|$)`))?.[1];
}

function readJSON(request, limit = 3000) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') return Promise.resolve(null);
  return new Promise(resolve => {
    let data = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      if (data.length > limit) return;
      data += chunk;
      if (data.length > limit) resolve(null);
    });
    request.on('end', () => {
      if (data.length > limit) return;
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
    request.on('error', () => resolve(null));
  });
}

export function createRemoteServer({ lan = false, fixedCode, allowedAddresses = hostAddresses } = {}) {
  let code = fixedCode || String(randomInt(100000, 1000000));
  let lastPoll = 0, state = remoteStatus(), waiting, commands = [];
  const sessions = new Map();
  const failures = new Map();
  const screen = createScreenSessions();
  let displayStream;

  function screenSnapshot(token, now = Date.now(), touch = true) {
    const result = screen.status(token, touch);
    if (result.phase !== 'connected' || !state.ready || now - lastPoll >= activeFor) return result;
    const { paused, muted, rate, media, volume } = state;
    return { ...result, playback: { paused, muted, rate, media, volume, age: Math.max(0, now - lastPoll) } };
  }

  function publishScreen() {
    if (!displayStream) return;
    const { token, response } = displayStream;
    const snapshot = screenSnapshot(token, Date.now(), false);
    if (response.writableLength >= 8192) {
      response.destroy();
      return;
    }
    response.write(`data: ${JSON.stringify(snapshot)}\n\n`);
    if (snapshot.phase !== 'connected') response.end();
  }

  function openScreenStream(token, response) {
    if (screen.status(token).phase !== 'connected') return reply(response, 403, { error: 'Écran non associé.' });
    displayStream?.response.end();
    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    });
    const stream = { token, response };
    displayStream = stream;
    const heartbeat = setInterval(publishScreen, 4000);
    heartbeat.unref();
    response.on('close', () => {
      clearInterval(heartbeat);
      if (displayStream === stream) displayStream = undefined;
    });
    publishScreen();
  }

  function phoneState() {
    const { media, ...controls } = state;
    return { ...controls, screenConnected: screen.connected() };
  }

  function urls(port) {
    const list = lan ? allowedAddresses() : [];
    return list.map(address => `http://${address}:${port}/`);
  }

  function sendCommands() {
    if (!waiting) return;
    const { response, timer } = waiting;
    waiting = undefined;
    clearTimeout(timer);
    reply(response, 200, {
      screenConnected: screen.connected(), screenAudio: screen.audio(),
      commands: commands.splice(0).filter(item => Date.now() - item.at < 2500).map(item => item.command),
    });
  }

  function disconnect(rotate = false) {
    lastPoll = 0;
    state = remoteStatus();
    commands = [];
    if (rotate) {
      sessions.clear();
      screen.reset();
      code = String(randomInt(100000, 1000000));
    }
    sendCommands();
    publishScreen();
  }

  const server = http.createServer(async (request, response) => {
    const port = server.address().port;
    const host = request.headers.host?.split(':')[0];
    const expected = new Set(['localhost', '127.0.0.1', ...(lan ? allowedAddresses() : [])]);
    if (!host || !expected.has(host)) return reply(response, 403, { error: 'Adresse locale invalide.' });
    const peer = request.socket.remoteAddress;
    if (!loopbackAddresses.has(peer) && (!lan || !localIPv4(peer))) return reply(response, 403, { error: 'Réseau local uniquement.' });
    const pathname = new URL(request.url, `http://${host}`).pathname;
    const now = Date.now();
    const active = now - lastPoll < activeFor && state.ready;

    if (pathname.startsWith('/api/desktop/')) {
      const loopback = loopbackAddresses.has(peer);
      const origin = request.headers.origin;
      if (!loopback || !['localhost', '127.0.0.1'].includes(host) || request.headers['x-xscroll-desktop'] !== '1' || (origin && !/^chrome-extension:\/\/[a-p]{32}$/.test(origin))) {
        return reply(response, 403, { error: 'Accès bureau uniquement.' });
      }
      if (pathname === '/api/desktop/info' && request.method === 'GET') return reply(response, 200, { code, urls: urls(port), active });
      if (request.method !== 'POST') return reply(response, 405, { error: 'Méthode invalide.' });
      const body = await readJSON(request, 5500);
      if (!body) return reply(response, 400, { error: 'Requête invalide.' });
      if (pathname === '/api/desktop/poll') {
        state = remoteStatus(body.state);
        lastPoll = Date.now();
        publishScreen();
        sendCommands();
        waiting = { response, timer: setTimeout(sendCommands, screen.connected() ? 620 : 2400) };
        response.on('close', () => {
          if (waiting?.response !== response) return;
          clearTimeout(waiting.timer);
          waiting = undefined;
        });
        if (commands.length) sendCommands();
        return;
      }
      if (pathname === '/api/desktop/wake') {
        if (screen.connected()) sendCommands();
        return reply(response, 200, {});
      }
      if (pathname === '/api/desktop/stop' || pathname === '/api/desktop/disconnect') {
        disconnect(pathname.endsWith('/disconnect'));
        return reply(response, 200, {});
      }
      return reply(response, 404, { error: 'Page introuvable.' });
    }

    if (request.method === 'GET' && assets.has(pathname)) {
      const { type, data } = assets.get(pathname);
      const display = pathname === '/screen' || pathname === '/screen/';
      response.writeHead(200, {
        'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': `default-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; media-src ${display ? 'https://video.twimg.com' : "'none'"}; img-src 'self'${display ? ' https://pbs.twimg.com' : ''}`,
        'Referrer-Policy': 'no-referrer',
      });
      return response.end(data);
    }

    if (request.method === 'POST' && request.headers.origin && request.headers.origin !== `http://${request.headers.host}`) {
      return reply(response, 403, { error: 'Origine invalide.' });
    }

    const token = cookie(request, COOKIE);
    const paired = token && (sessions.get(token) || 0) > now;
    const screenToken = cookie(request, SCREEN_COOKIE);
    if (pathname === '/api/screen/request' && request.method === 'POST') {
      if (!await readJSON(request)) return reply(response, 400, { error: 'Requête invalide.' });
      const { token: key, code } = screen.request(screenToken);
      return reply(response, 200, { phase: 'pending', code }, {
        'Set-Cookie': `${SCREEN_COOKIE}=${key}; Path=/api/screen; HttpOnly; SameSite=Strict; Max-Age=${MAX_SESSION / 1000}`,
      });
    }
    if (pathname === '/api/screen/status' && request.method === 'GET') {
      return reply(response, 200, screenSnapshot(screenToken, now));
    }
    if (pathname === '/api/screen/events' && request.method === 'GET') {
      const origin = request.headers.origin;
      if (origin && origin !== `http://${request.headers.host}`) return reply(response, 403, { error: 'Origine invalide.' });
      return openScreenStream(screenToken, response);
    }
    if (pathname === '/api/screen/audio' && request.method === 'POST') {
      const body = await readJSON(request);
      if (typeof body?.enabled !== 'boolean' || !screen.setAudio(screenToken, body.enabled)) {
        return reply(response, 403, { error: 'Écran non associé.' });
      }
      sendCommands();
      return reply(response, 200, {});
    }
    if ((pathname === '/api/screen/approve' || pathname === '/api/screen/disconnect') && request.method === 'POST') {
      if (!paired) return reply(response, 401, { error: 'Appaire ton téléphone.' });
      const body = await readJSON(request);
      if (!body) return reply(response, 400, { error: 'Requête invalide.' });
      if (pathname.endsWith('/disconnect')) screen.disconnect();
      else if (!screen.approve(body.code)) return reply(response, 404, { error: 'Code écran incorrect ou expiré.' });
      publishScreen();
      sendCommands();
      return reply(response, 200, { connected: screen.connected() });
    }
    if (pathname === '/api/status' && request.method === 'GET') {
      return reply(response, 200, { paired: Boolean(paired), active, ...(paired && { state: phoneState() }) });
    }
    if (pathname === '/api/pair' && request.method === 'POST') {
      const ip = request.socket.remoteAddress;
      const recent = (failures.get(ip) || []).filter(time => now - time < 60000);
      if (recent.length >= 5) return reply(response, 429, { error: 'Trop de tentatives. Réessaie dans une minute.' });
      const body = await readJSON(request);
      const entered = String(body?.code || '');
      if (!/^\d{6}$/.test(entered) || !timingSafeEqual(Buffer.from(entered), Buffer.from(code))) {
        failures.delete(ip);
        failures.set(ip, [...recent, now]);
        if (failures.size > 128) failures.delete(failures.keys().next().value);
        return reply(response, 401, { error: 'Code incorrect.' });
      }
      failures.delete(ip);
      const session = randomBytes(24).toString('hex');
      sessions.set(session, now + MAX_SESSION);
      if (sessions.size > 32) sessions.delete(sessions.keys().next().value);
      return reply(response, 200, { paired: true, active, state: phoneState() }, {
        'Set-Cookie': `${COOKIE}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_SESSION / 1000}`,
      });
    }
    if (pathname === '/api/command' && request.method === 'POST') {
      if (!paired) return reply(response, 401, { error: 'Appaire ton téléphone.' });
      if (!active) return reply(response, 409, { error: 'Ouvre le lecteur XScroll sur ton ordinateur.' });
      const body = await readJSON(request);
      const command = typeof body?.command === 'string' && (remoteCommand(body.command) ||
        remoteCommand({ ...body, id: randomBytes(8).toString('hex') }));
      if (!command) return reply(response, 400, { error: 'Commande ou sujet invalide.' });
      const discovery = command.command === 'search' || command.command === 'shuffle';
      const postAction = command.command === 'post-action';
      if (!discovery && !state.playable) return reply(response, 409, { error: 'Aucune vidéo en cours.' });
      if (postAction && command.postId !== state.post?.id) {
        return reply(response, 409, { error: 'La vidéo a changé. Réessaie sur le post affiché.' });
      }
      if (discovery) commands = commands.filter(item => item.command.command !== 'search' && item.command.command !== 'shuffle');
      if (command.command === 'speed' || command.command === 'speed-preview') {
        commands = commands.filter(item => item.command.command !== command.command);
      }
      if (commands.length >= 12) return reply(response, 429, { error: 'Le lecteur traite encore tes commandes.' });
      commands.push({ command, at: now });
      sendCommands();
      return reply(response, 200, { received: true, ...(command.id && { id: command.id }) });
    }
    return reply(response, 404, { error: 'Page introuvable.' });
  });
  server.requestTimeout = 8000;
  server.headersTimeout = 8000;
  server.on('close', () => disconnect(false));
  return { server, info: () => ({ code, urls: urls(server.address().port) }) };
}

const langFlag = process.argv.indexOf('--lang');
const cliLanguage = normalizeLanguage((langFlag >= 0 && process.argv[langFlag + 1]) || Intl.DateTimeFormat().resolvedOptions().locale);
const cli = message => translate(message, undefined, cliLanguage);

function start() {
  const lan = process.argv.includes('--lan');
  const route = lan ? wslLan(localIPv4) : null;
  if (process.argv.includes('--configure-lan')) {
    if (!route) throw new Error('--configure-lan est réservé à WSL en mode NAT avec --lan.');
    configureWslLan(route, REMOTE_PORT);
  }
  const remote = createRemoteServer({
    lan,
    allowedAddresses: route ? () => route.windows ? [route.windows] : [] : hostAddresses,
  });
  remote.server.on('error', error => { console.error(`XScroll Remote · ${error.message}`); process.exitCode = 1; });
  remote.server.listen(REMOTE_PORT, lan ? '0.0.0.0' : '127.0.0.1', () => {
    const { urls, code } = remote.info();
    console.log('XScroll Remote');
    for (const url of urls) {
      console.log(`${cli('Phone')}  ${url}`);
      console.log(`${cli('Screen')}  ${url}screen`);
    }
    console.log(`${cli('Computer')}  http://127.0.0.1:${REMOTE_PORT}/`);
    console.log(`Code  ${code}`);
    if (!lan) console.log(cli('Add --lan to allow phones on your local network.'));
    if (route?.windows && !process.argv.includes('--configure-lan')) {
      console.log(cli('WSL (NAT) · If the phone cannot connect, restart with --lan --configure-lan.'));
    }
    if (route && !route.windows) console.log(cli('WSL (NAT) · No Windows Ethernet or Wi-Fi address found.'));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { start(); }
  catch (error) { console.error(`XScroll Remote · ${cli(error.message)}`); process.exitCode = 1; }
}
