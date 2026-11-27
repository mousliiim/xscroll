import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { screenMediaURL } from './protocol.mjs';

export function relayScreenMedia(value) {
  if (value?.unavailable) return value;
  const url = screenMediaURL(value?.url);
  if (!url) return { unavailable: true };
  const localURL = source => {
    const safe = screenMediaURL(source);
    return safe ? `/api/screen/media?url=${encodeURIComponent(safe)}` : '';
  };
  const fallbacks = (Array.isArray(value.fallbacks) ? value.fallbacks : []).map(localURL).filter(Boolean);
  const fallback = localURL(value.fallback);
  return {
    ...value,
    url: localURL(url),
    fallback,
    fallbacks: [...new Set([fallback, ...fallbacks])].filter(source => source && source !== localURL(url)),
  };
}

function respond(response, status, message) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify({ error: message }));
}

export async function serveScreenMedia(request, response, { authorized, fetchMedia = fetch }) {
  if (!authorized) return respond(response, 403, 'Screen is not paired.');
  if (request.method !== 'GET' && request.method !== 'HEAD') return respond(response, 405, 'Method not allowed.');
  const source = screenMediaURL(new URL(request.url, 'http://localhost').searchParams.get('url'));
  if (!source) return respond(response, 400, 'Invalid video URL.');
  const range = request.headers.range;
  if (range && (range.length > 100 || !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))) {
    return respond(response, 416, 'Invalid byte range.');
  }

  const controller = new AbortController();
  response.once('close', () => {
    if (!response.writableEnded) controller.abort();
  });

  let upstream;
  try {
    upstream = await fetchMedia(source, {
      method: request.method,
      headers: range ? { range } : {},
      redirect: 'error',
      signal: controller.signal,
    });
  } catch {
    if (!response.destroyed) respond(response, 502, 'Video source could not be reached.');
    return;
  }

  if (![200, 206, 416].includes(upstream.status)) {
    upstream.body?.cancel();
    return respond(response, 502, 'Video source is unavailable.');
  }
  const contentType = upstream.headers.get('content-type');
  if (upstream.status !== 416 && contentType &&
      !/^video\/mp4(?:\s*;|$)|^application\/octet-stream(?:\s*;|$)/i.test(contentType)) {
    upstream.body?.cancel();
    return respond(response, 502, 'Video source returned an unsupported format.');
  }
  const headers = {
    'Content-Type': 'video/mp4',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };
  const length = upstream.headers.get('content-length');
  if (length && /^\d+$/.test(length)) headers['content-length'] = length;
  const contentRange = upstream.headers.get('content-range');
  if (contentRange && /^(?:bytes \d+-\d+\/(?:\d+|\*)|bytes \*\/\d+)$/.test(contentRange)) {
    headers['content-range'] = contentRange;
  }
  response.writeHead(upstream.status, headers);
  if (request.method === 'HEAD' || !upstream.body) {
    upstream.body?.cancel();
    response.end();
    return;
  }
  try {
    await pipeline(Readable.fromWeb(upstream.body), response);
  } catch {
    if (!response.destroyed) response.destroy();
  }
}
