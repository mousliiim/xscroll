import { connectSearchTabs, nativeSearchResults } from './search-tabs.js';
import { SEARCH_HELPER } from '../x/protocol.js';
import { REMOTE_ORIGIN, REMOTE_PERMISSION, remoteCommand, remoteStatus } from '../../remote/protocol.mjs';

const STORAGE_KEY = 'xscrollRemoteTab';
const HEADERS = { 'Content-Type': 'application/json', 'X-XScroll-Desktop': '1' };

const currentTab = async () => (await chrome.storage.session.get(STORAGE_KEY))[STORAGE_KEY];
const hasPermission = () => chrome.permissions.contains({ origins: [REMOTE_PERMISSION] });

async function desktop(action, body) {
  const response = await fetch(`${REMOTE_ORIGIN}/api/desktop/${action}`, {
    method: body ? 'POST' : 'GET', headers: HEADERS, body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(6000), cache: 'no-store', redirect: 'error',
  });
  if (!response.ok) throw new Error('Remote server unavailable');
  return response.json();
}

async function setup(message) {
  if (message.type === 'disable') {
    await chrome.storage.session.remove(STORAGE_KEY);
    if (await hasPermission()) await desktop('disconnect', {}).catch(() => {});
    return { enabled: false };
  }
  if (message.type === 'enable') {
    if (!Number.isInteger(message.tabId) || message.tabId < 0 || !await hasPermission()) return { enabled: false };
    const info = await desktop('info');
    await chrome.storage.session.set({ [STORAGE_KEY]: message.tabId });
    await chrome.tabs.sendMessage(message.tabId, { channel: 'xscroll.remote', type: 'start' }).catch(() => {});
    return { enabled: true, ...info };
  }
  const id = await currentTab();
  if (Number.isInteger(id) && await hasPermission()) {
    try { return { enabled: true, ...await desktop('info') }; } catch { return { enabled: true, offline: true }; }
  }
  return { enabled: false };
}

chrome.runtime.onConnect.addListener(connectSearchTabs);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !message) return;
  if (message.channel === SEARCH_HELPER) { nativeSearchResults(message, sender); return; }
  if (message.channel === 'xscroll.remote.setup' && Object.values({
    standard: chrome.runtime.getURL('popup/index.html'),
    nested: chrome.runtime.getURL('extension/popup/index.html'),
  }).includes(sender.url)) {
    setup(message).then(respond, () => respond({ enabled: false, offline: true }));
    return true;
  }
  if (message.channel !== 'xscroll.remote.poll' || sender.frameId !== 0 || !sender.tab) return;
  async function poll() {
    if (sender.tab.id !== await currentTab() || !await hasPermission()) return { disabled: true };
    const action = ['stop', 'wake'].includes(message.type) ? message.type : 'poll';
    try {
      const data = await desktop(action, { state: remoteStatus(message.state) });
      return { screenConnected: data.screenConnected === true, screenAudio: data.screenAudio === true, commands: Array.isArray(data.commands) ? data.commands.map(remoteCommand).filter(Boolean) : [] };
    } catch {
      return { offline: true };
    }
  }
  poll().then(respond, () => respond({ offline: true }));
  return true;
});
