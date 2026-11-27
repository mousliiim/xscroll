import { findPost, isPostId, postURL } from './model.js';
import { BOOKMARK_OPERATIONS, bookmarkConfirmed, bookmarkDirection, MUTATION_OPERATIONS, QUERY_OPERATIONS, SITE } from './protocol.js';

const BUNDLE = /\/(?:main|runtime|entry-client-[\w-]+|bundle\.(?:ImmersiveMediaViewer|Conversation|TweetDetail|Bookmarks|TweetAction|Search(?:Timeline)?))\.[\w.-]+\.js$/;
const CHUNK = /(\d+):"(bundle\.(?:ImmersiveMediaViewer|Conversation|TweetDetail|Bookmarks|TweetAction|Search(?:Timeline)?))"/g;
const METADATA = /queryId\s*:\s*"([\w-]+)"\s*,\s*operationName\s*:\s*"(\w+)"\s*,\s*operationType\s*:\s*"(query|mutation)"(?:\s*,\s*metadata\s*:\s*\{\s*featureSwitches\s*:\s*(\[[^\]]*\])\s*,\s*fieldToggles\s*:\s*(\[[^\]]*\]))?/g;
const RELAY_OPERATION = /params:\{id:\s*["'`]([\w-]+)["'`],\s*metadata:\{[^}]*\},\s*name:\s*["'`](BookmarkAdd|BookmarkDelete|TweetDetail)["'`],\s*operationKind:\s*["'`](mutation|query)["'`]/g;
const MODULE_ASSET = /^\/x-web\/(?:x-web\/)?(?:entry-client-[\w-]+|assets\/[\w-]+)\.js$/;
const STATIC_IMPORT = /\b(?:from|import)\s*["'](\.\/(?:assets\/)?[\w-]+\.js)["']/g;
const detailProviders = values => Object.fromEntries(Object.entries(values || {}).filter(([key, value]) =>
  /^__relay_internal__pv__[a-z0-9_]{1,140}$/i.test(key) && typeof value === 'boolean').slice(0, 100));

function safeBundle(url) {
  try {
    const parsed = new URL(url);
    return (parsed.origin === SITE || parsed.origin === 'https://abs.twimg.com') &&
      (BUNDLE.test(parsed.pathname) || MODULE_ASSET.test(parsed.pathname));
  } catch {
    return false;
  }
}

function boolKeys(serialized, initial) {
  try {
    return JSON.stringify(Object.fromEntries(JSON.parse(serialized).filter(key => typeof key === 'string').map(key => [key, initial])));
  } catch {
    return '{}';
  }
}

export function parseOperations(sources) {
  const operations = new Map();
  let bearer;
  for (const source of sources) {
    bearer ||= source.match(/["'`](Bearer [A-Za-z0-9%._-]+)["'`]/)?.[1];
    for (const [, id, name, type, features, toggles] of source.matchAll(METADATA)) {
      const allowed = type === 'query' ? QUERY_OPERATIONS : MUTATION_OPERATIONS;
      if (allowed.has(name)) operations.set(name, { id, features: boolKeys(features, true), toggles: boolKeys(toggles, false) });
    }
    for (const [, id, name, type] of source.matchAll(RELAY_OPERATION)) {
      if ((type === 'query' ? QUERY_OPERATIONS : MUTATION_OPERATIONS).has(name)) operations.set(name, { id, relay: true });
    }
  }
  return { bearer, operations };
}

const readText = url => fetch(url, { signal: AbortSignal.timeout(8000) })
  .then(response => response.ok ? response.text() : '').catch(() => '');

async function discover() {
  const scripts = [...document.scripts];
  const urls = new Set(scripts.map(script => script.src).filter(safeBundle));
  for (const entry of performance.getEntriesByType('resource')) {
    if (safeBundle(entry.name)) urls.add(entry.name);
  }
  const initial = [...urls].slice(0, 24);
  const sources = await Promise.all(initial.map(readText));
  const bundleURLs = new Set();
  for (const [index, source] of sources.entries()) {
    for (const [, relative] of source.matchAll(STATIC_IMPORT)) {
      const url = new URL(relative, initial[index]).href;
      if (safeBundle(url)) bundleURLs.add(url);
    }
  }
  for (const source of [...scripts.filter(script => !script.src).map(script => script.textContent), ...sources]) {
    for (const [, id, name] of source.matchAll(CHUNK)) {
      const hash = source.match(new RegExp(`[{,]${id}:"([a-f0-9]{8,20})"`))?.[1];
      if (hash) bundleURLs.add(`https://abs.twimg.com/responsive-web/client-web/${name}.${hash}a.js`);
    }
  }
  const read = new Set(initial);
  const imported = [...bundleURLs].filter(url => !read.has(url));
  const extra = [...new Set([...imported, ...[...urls].slice(24).reverse()])].slice(0, 16);
  sources.push(...await Promise.all(extra.map(readText)));
  return parseOperations(sources);
}

export class XRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function createXClient() {
  const observed = new Map();
  const pendingDetails = new Map();
  let discovery, scannedAt = 0;

  function scan() {
    discovery = discover().catch(() => null).finally(() => { scannedAt = Date.now(); });
    return discovery;
  }

  async function renderedDetail(id) {
    const markup = await readText(postURL(id));
    const params = markup.match(/key:"([\w-]{1,80})(\{(?:[^"\\]|\\.){1,20000}\})",name:"TweetDetail"/);
    if (params) {
      try { observed.set('TweetDetail', { id: params[1], relay: true, providers: detailProviders(JSON.parse(JSON.parse('"' + params[2] + '"'))) }); }
      catch { /* A legacy page has no Relay variables. */ }
    }
    for (const [, serialized] of markup.matchAll(/kind:"Result\.Ok",value:("(?:[^"\\]|\\.)*")/g)) {
      if (!serialized.includes('threaded_conversation_with_injections_v2')) continue;
      try {
        const payload = JSON.parse(JSON.parse(serialized));
        if (findPost(payload, id)) return payload;
      } catch { /* Ignore unrelated page data. */ }
    }
  }

  async function request(name, variables, method) {
    const allowed = method === 'POST' ? MUTATION_OPERATIONS : QUERY_OPERATIONS;
    if (!allowed.has(name)) throw new XRequestError('unavailable', 'Action unavailable in this version of X.');
    const csrf = document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1];
    if (!csrf) throw new XRequestError('session', 'Sign in to X to continue.');
    const modern = BOOKMARK_OPERATIONS[name];
    const definition = (definitions, operation) => observed.get(operation) || definitions?.operations.get(operation);
    const currentScan = discovery || scan();
    let definitions = await currentScan;
    if (currentScan !== discovery) definitions = await discovery;
    else if ((!definitions?.bearer || (!definition(definitions, name) && !definition(definitions, modern))) && Date.now() - scannedAt > 3000) {
      definitions = await scan();
    }
    const wireName = modern && (observed.has(modern) || (!observed.has(name) && definitions?.operations.has(modern))) ? modern : name;
    const operation = definition(definitions, wireName);
    if (!operation || !definitions?.bearer) throw new XRequestError('unavailable', 'This action is temporarily unavailable.');
    const relay = operation.relay === true || wireName !== name;
    const relayBookmark = relay && bookmarkDirection(wireName) !== undefined;
    const url = relay ? new URL(`https://api.x.com/graphql/${operation.id}/${wireName}`) :
      new URL(`/i/api/graphql/${operation.id}/${name}`, SITE);
    const headers = {
      authorization: definitions.bearer,
      'x-csrf-token': csrf,
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-active-user': 'yes',
    };
    const options = { method, headers, credentials: relay ? 'include' : 'same-origin', signal: AbortSignal.timeout(10000) };
    if (method === 'POST') {
      headers['content-type'] = 'application/json';
      options.body = JSON.stringify({ queryId: operation.id, variables: relayBookmark ? { tweetId: variables.tweet_id } : variables });
    } else {
      const detail = relay && name === 'TweetDetail';
      url.searchParams.set('variables', JSON.stringify(detail ? { ...operation.providers,
        focalTweetId: variables.focalTweetId, cursor: variables.cursor ?? null, withFocalTweet: true, rankingMode: null, referrer: null } : variables));
      if (operation.features) url.searchParams.set('features', operation.features);
      if (operation.toggles) url.searchParams.set('fieldToggles', operation.toggles);
    }
    const response = await fetch(url, options);
    if (response.status === 429) throw new XRequestError('limited', 'X is rate limiting requests. Try again in a moment.');
    if (!response.ok) {
      const code = [400, 401, 403, 404].includes(response.status) ? 'unavailable' : 'server';
      throw new XRequestError(code, 'X could not complete this request.');
    }
    const payload = await response.json();
    if (method === 'POST') {
      const bookmark = bookmarkDirection(name);
      const confirmed = bookmark !== undefined ? bookmarkConfirmed(payload, bookmark) :
        payload?.data && Object.values(payload.data).some(Boolean);
      if (!confirmed || payload.errors?.length) {
        const code = !confirmed && payload.errors?.length ? 'unavailable' : 'server';
        throw new XRequestError(code, 'X did not confirm this action.');
      }
    } else if (!payload?.data) {
      throw new XRequestError('server', 'X did not return a result for this request.');
    }
    return payload;
  }

  return {
    remember({ name, id, features, toggles, relay, variables }) {
      if ((!QUERY_OPERATIONS.has(name) && !MUTATION_OPERATIONS.has(name)) || !/^[\w-]{1,80}$/.test(id || '')) return;
      // The page can only suggest an ID and read feature flags. All routes and writes remain allowlisted.
      let providers;
      if (relay && name === 'TweetDetail' && typeof variables === 'string' && variables.length <= 18000) {
        try { providers = detailProviders(JSON.parse(variables)); } catch { /* Ignore malformed variables. */ }
      }
      observed.set(name, {
        id,
        relay: relay === true && (name === 'TweetDetail' || bookmarkDirection(name) !== undefined),
        providers,
        features: typeof features === 'string' && features.length < 18000 ? features : '{}',
        toggles: typeof toggles === 'string' && toggles.length < 8000 ? toggles : '{}',
      });
    },
    async query(name, variables) {
      return request(name, variables, 'GET').catch(() => undefined);
    },
    detail(id, cursor) {
      if (!isPostId(id)) return Promise.resolve(undefined);
      const key = JSON.stringify([id, cursor || '']);
      if (!pendingDetails.has(key)) {
        pendingDetails.set(key, request('TweetDetail', {
          focalTweetId: id, ...(cursor && { cursor }),
          includePromotedContent: false, with_rux_injections: false, withCommunity: true,
          withQuickPromoteEligibilityTweetFields: false, withBirdwatchNotes: false, withVoice: true, rankingMode: 'Relevance',
        }, 'GET').catch(() => cursor ? undefined : renderedDetail(id)).finally(() => pendingDetails.delete(key)));
      }
      return pendingDetails.get(key);
    },
    mutate(name, variables) {
      return request(name, variables, 'POST');
    },
  };
}
