import { isPostId } from './model.js';
import { MUTATION_OPERATIONS, QUERY_OPERATIONS, SITE } from './protocol.js';

const BUNDLE = /\/(?:main|runtime|entry-client-[\w-]+|bundle\.(?:ImmersiveMediaViewer|Conversation|TweetDetail|Bookmarks|TweetAction|Search(?:Timeline)?))\.[\w.-]+\.js$/;
const CHUNK = /(\d+):"(bundle\.(?:ImmersiveMediaViewer|Conversation|TweetDetail|Bookmarks|TweetAction|Search(?:Timeline)?))"/g;
const METADATA = /queryId\s*:\s*"([\w-]+)"\s*,\s*operationName\s*:\s*"(\w+)"\s*,\s*operationType\s*:\s*"(query|mutation)"(?:\s*,\s*metadata\s*:\s*\{\s*featureSwitches\s*:\s*(\[[^\]]*\])\s*,\s*fieldToggles\s*:\s*(\[[^\]]*\]))?/g;

function safeBundle(url) {
  try {
    const parsed = new URL(url);
    return (parsed.origin === SITE || parsed.origin === 'https://abs.twimg.com') &&
      (BUNDLE.test(parsed.pathname) || /\/x-web\/[\w/-]*entry-client-[\w-]+\.js$/.test(parsed.pathname));
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
    bearer ||= source.match(/"(Bearer [A-Za-z0-9%._-]+)"/)?.[1];
    for (const [, id, name, type, features, toggles] of source.matchAll(METADATA)) {
      const allowed = type === 'query' ? QUERY_OPERATIONS : MUTATION_OPERATIONS;
      if (allowed.has(name)) operations.set(name, { id, features: boolKeys(features, true), toggles: boolKeys(toggles, false) });
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
  const sources = await Promise.all([...urls].slice(0, 16).map(readText));
  const bundleURLs = new Set();
  for (const source of [...scripts.filter(script => !script.src).map(script => script.textContent), ...sources]) {
    for (const [, id, name] of source.matchAll(CHUNK)) {
      const hash = source.match(new RegExp(`[{,]${id}:"([a-f0-9]{8,20})"`))?.[1];
      if (hash) bundleURLs.add(`https://abs.twimg.com/responsive-web/client-web/${name}.${hash}a.js`);
    }
  }
  sources.push(...await Promise.all([...bundleURLs].filter(url => !urls.has(url)).slice(0, 8).map(readText)));
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
  let discovery;

  async function request(name, variables, method) {
    const allowed = method === 'POST' ? MUTATION_OPERATIONS : QUERY_OPERATIONS;
    if (!allowed.has(name)) throw new XRequestError('unavailable', 'Action unavailable in this version of X.');
    const csrf = document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1];
    if (!csrf) throw new XRequestError('session', 'Sign in to X to continue.');
    discovery ||= discover().catch(() => null);
    const definitions = await discovery;
    if (!definitions?.bearer) discovery = undefined;
    const operation = observed.get(name) || definitions?.operations.get(name);
    if (!operation || !definitions?.bearer) throw new XRequestError('unavailable', 'This action is temporarily unavailable.');
    const url = new URL(`/i/api/graphql/${operation.id}/${name}`, SITE);
    const headers = {
      authorization: definitions.bearer,
      'x-csrf-token': csrf,
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-active-user': 'yes',
    };
    const options = { method, headers, credentials: 'same-origin', signal: AbortSignal.timeout(10000) };
    if (method === 'POST') {
      headers['content-type'] = 'application/json';
      options.body = JSON.stringify({ queryId: operation.id, variables });
    } else {
      url.searchParams.set('variables', JSON.stringify(variables));
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
      const confirmed = payload?.data && Object.values(payload.data).some(Boolean);
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
    remember({ name, id, features, toggles }) {
      if ((!QUERY_OPERATIONS.has(name) && !MUTATION_OPERATIONS.has(name)) || !/^[\w-]{1,80}$/.test(id || '')) return;
      // The page can only suggest an ID and read feature flags. All routes and writes remain allowlisted.
      observed.set(name, {
        id,
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
        }, 'GET').catch(() => undefined).finally(() => pendingDetails.delete(key)));
      }
      return pendingDetails.get(key);
    },
    mutate(name, variables) {
      return request(name, variables, 'POST');
    },
  };
}
