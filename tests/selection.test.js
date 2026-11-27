import assert from 'node:assert/strict';
import test from 'node:test';
import { screenVideoSources } from '../src/player/selection.js';

test('screen playback prefers the highest variant at or below 480p', () => {
  const sources = screenVideoSources({
    variants: [
      { url: '1080p', label: '1080p' },
      { url: '720p', label: '720p' },
      { url: '480p', label: '480p' },
      { url: '360p', label: '360p' },
      { url: '270p', label: '270p' },
    ],
  });

  assert.equal(sources.url, '480p');
  assert.deepEqual(sources.fallbacks, ['360p', '270p', '720p']);
});

test('screen playback uses the smallest known variant when none is at or below 480p', () => {
  const sources = screenVideoSources({
    variants: [
      { url: '1080p', label: '1080p' },
      { url: '720p', label: '720p' },
    ],
  });

  assert.equal(sources.url, '720p');
  assert.deepEqual(sources.fallbacks, []);
});
