import { language } from '../../remote/language.mjs';
import { mediaURL } from '../x/model.js';

const timestamp = '(?:(\\d+):)?(\\d{2}):(\\d{2}\\.\\d{3})';
const cueTiming = new RegExp('^' + timestamp + '\\s+-->\\s+' + timestamp);
const time = (hours, minutes, seconds) => (Number(hours) || 0) * 3600 + Number(minutes) * 60 + Number(seconds);
const timedTrack = track => ['captions', 'subtitles'].includes(track.kind);

function mediaFile(value, base, extension) {
  try {
    const url = new URL(value, base);
    return url.pathname.endsWith(extension) ? mediaURL(url.href, 'video.twimg.com') : '';
  } catch { return ''; }
}

async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5500), redirect: 'error' });
  if (!response.ok) throw new Error('Caption request failed');
  return (await response.text()).slice(0, 600000);
}

export async function captionFile(clip, doc) {
  for (const video of doc.querySelectorAll('video')) {
    if (!clip.variants.some(variant => [video.currentSrc, video.src].includes(variant.url)) && (!clip.poster || video.poster !== clip.poster)) continue;
    const track = [...video.querySelectorAll('track')].find(item => timedTrack(item) && mediaFile(item.src, undefined, '.vtt'));
    if (track) return track.src;
  }
  const master = mediaFile(clip.captionPlaylist, undefined, '.m3u8');
  if (!master) return '';
  const entries = (await read(master)).split(/\r?\n/).filter(line => /^#EXT-X-MEDIA:TYPE=SUBTITLES(?:,|$)/.test(line))
    .map(line => ({ url: line.match(/\bURI="([^"]+)"/)?.[1], locale: line.match(/\bLANGUAGE="([^"]+)"/)?.[1], default: /\bDEFAULT=YES\b/.test(line) }))
    .filter(entry => entry.url);
  const selected = entries.find(entry => entry.locale?.toLowerCase().split('-')[0] === language()) ||
    entries.find(entry => entry.default) || entries[0];
  return selected ? mediaFile(selected.url, master, '.m3u8') || mediaFile(selected.url, master, '.vtt') : '';
}

export function captionCues(source, offset = 0) {
  if (!/^\uFEFF?WEBVTT\b/.test(source)) return [];
  const cues = [];
  const local = source.match(new RegExp('X-TIMESTAMP-MAP=[^\\r\\n]*LOCAL:' + timestamp));
  for (const block of source.split(/\r?\n\s*\r?\n/).slice(0, 1500)) {
    const lines = block.split(/\r?\n/);
    const index = lines.findIndex(line => cueTiming.test(line));
    if (index < 0) continue;
    const [, h, m, s, endH, endM, endS] = lines[index].match(cueTiming);
    const start = time(h, m, s);
    const end = time(endH, endM, endS);
    const adjustment = local ? Math.max(0, offset - time(...local.slice(1))) : start < offset - .5 ? offset : 0;
    const text = lines.slice(index + 1).join('\n').trimEnd().slice(0, 800);
    if (end > start && text) cues.push([start + adjustment, end + adjustment, text]);
  }
  return cues;
}

export async function loadCaptionTrack(video, url) {
  let cues;
  if (new URL(url).pathname.endsWith('.vtt')) cues = captionCues(await read(url));
  else {
    let offset = 0, duration = 0;
    const segments = [];
    for (const line of (await read(url)).split(/\r?\n/)) {
      if (line.startsWith('#EXTINF:')) duration = Number.parseFloat(line.slice(8)) || 0;
      if (!line || line.startsWith('#')) continue;
      const segment = mediaFile(line, url, '.vtt');
      if (segment) segments.push({ segment, offset });
      offset += duration;
      if (segments.length >= 160) break;
    }
    cues = [];
    for (let index = 0; index < segments.length; index += 8) {
      cues.push(...(await Promise.all(segments.slice(index, index + 8)
        .map(async ({ segment, offset }) => captionCues(await read(segment), offset).catch(() => [])))).flat());
    }
  }
  if (!cues.length) return;
  const track = video.addTextTrack('subtitles', 'X', language());
  const unique = new Set();
  for (const cue of cues) {
    const key = cue.join('\u0000');
    if (unique.has(key)) continue;
    unique.add(key);
    track.addCue(new video.ownerDocument.defaultView.VTTCue(...cue));
  }
  return track;
}

export const embeddedCaptions = video => [...video.textTracks].find(timedTrack);
