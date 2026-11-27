import { localizeMarkup, refreshLanguage, text } from '../../remote/language.mjs';
import { extensionLanguage, saveLanguage } from './language.js';
import { REMOTE_PERMISSION } from '../../remote/protocol.mjs';

const remotePanel = document.querySelector('#remote-panel');
const remoteToggle = document.querySelector('#remote-toggle');
const remoteInfo = document.querySelector('#remote-info');
const remoteUrls = document.querySelector('#remote-urls');
const remoteDetails = document.querySelector('#remote-details');
let remoteEnabled = false;
let remoteTab;
const remoteRequest = (type, tabId) => chrome.runtime.sendMessage({ channel: 'xscroll.remote.setup', type, tabId });

function renderRemote(info) {
  remoteEnabled = Boolean(info?.enabled);
  text(remoteToggle.querySelector('span'), remoteEnabled ? 'Disconnect phone remote' : 'Enable phone remote');
  remotePanel.toggleAttribute('data-connected', Boolean(remoteEnabled && info?.code));
  remoteInfo.hidden = !info?.code && !info?.offline;
  text(remoteInfo, info?.code ? 'Pairing code: {code}' :
    info?.offline ? 'Start the local server with npm run remote -- --lan, then connect.' : '', { code: info?.code });
  remoteUrls.replaceChildren();
  for (const address of info?.urls || []) {
    if (!/^http:\/\/\d+\.\d+\.\d+\.\d+:4781\/$/.test(address)) continue;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = address;
    link.textContent = address;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    remoteUrls.append(item);
  }
  remoteUrls.hidden = !remoteUrls.childElementCount;
  remoteDetails.hidden = remoteInfo.hidden && remoteUrls.hidden;
}

remoteToggle.addEventListener('click', async () => {
  remoteToggle.disabled = true;
  try {
    if (remoteEnabled) renderRemote(await remoteRequest('disable'));
    else if (await chrome.permissions.request({ origins: [REMOTE_PERMISSION] })) {
      renderRemote(await remoteRequest('enable', remoteTab));
    }
  } catch { renderRemote({ offline: true }); }
  finally { remoteToggle.disabled = false; }
});

const status = document.querySelector('#status');
const button = document.querySelector('#launch');
const label = button.firstChild;
const languagePicker = document.querySelector('.language-select');
const channel = 'xscroll.popup';
let activate;

function display(message, action, run) {
  text(status, message);
  text(label, action);
  activate = run;
  button.disabled = !run;
}

async function initialize() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return display('Open X in a tab to start watching.', 'Go to X', openSite);
  const send = type => chrome.tabs.sendMessage(tab.id, { channel, type });
  const info = await send('state').catch(() => null);
  if (info?.site && info.ready !== false) {
    remoteTab = tab.id;
    remotePanel.hidden = false;
    void remoteRequest('status').then(renderRemote).catch(() => {});
    if (info.theme === 'light') document.documentElement.dataset.theme = 'light';
    const description = info.floating ? 'Your mini player is open.' :
      info.open ? 'Your player is open on this tab.' :
      info.post ? 'Open the video from this post.' : 'Browse videos from the X page you’re on.';
    return display(description, info.open ? 'Return to player' : 'Open player', async () => {
      const result = await send('open');
      if (!result?.opened) throw new Error('Player unavailable');
      window.close();
    });
  }
  if (tab.url?.startsWith('https://x.com/')) {
    return display('Reload this X tab to connect XScroll.', 'Reload X', async () => {
      await chrome.tabs.reload(tab.id);
      window.close();
    });
  }
  return display('Open X to start watching videos with XScroll.', 'Go to X', openSite);
}

async function openSite() {
  await chrome.tabs.create({ url: 'https://x.com/home' });
  window.close();
}

button.addEventListener('click', async () => {
  if (!activate) return;
  button.disabled = true;
  try { await activate(); }
  catch { display('Couldn’t reach this tab. Open X to try again.', 'Go to X', openSite); }
});
localizeMarkup(document.body);
languagePicker.addEventListener('change', () => { void saveLanguage(languagePicker.value); });
extensionLanguage(locale => {
  document.documentElement.lang = locale;
  languagePicker.value = locale;
  refreshLanguage(document.body);
}).then(initialize).catch(() => display('Open X in a tab to start watching.', 'Go to X', openSite));
