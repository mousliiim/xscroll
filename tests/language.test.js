import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeLanguage, setLanguage, translate } from '../remote/language.mjs';

test('chooses French for French locales and defaults other languages to English', () => {
  assert.equal(normalizeLanguage('fr-CA'), 'fr');
  assert.equal(normalizeLanguage('en-GB'), 'en');
  assert.equal(normalizeLanguage('ja'), 'en');
  setLanguage('fr');
  assert.equal(translate('Playback speed'), 'Vitesse de lecture');
  assert.equal(translate('Show {count} replies', { count: 3 }), 'Afficher 3 réponses');
});

test('translates remote messages to English while preserving search input verbatim', () => {
  setLanguage('en');
  assert.equal(translate('Code incorrect.'), 'Incorrect code.');
  assert.equal(translate('Recherche « {topic} » sur X…', { topic: 'Mode sombre' }), 'Searching X for “Mode sombre”…');
  assert.equal(translate('Aucune nouvelle vidéo pour « {topic} ».', { topic: '${example}' }), 'No new videos for “${example}”.');
});
