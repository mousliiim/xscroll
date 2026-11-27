import { remoteCommand } from '../../remote/protocol.mjs';

export function createRemoteRelay(host, getState, execute, routeDisplay) {
  let session, screenConnected = false, lastWake = -Infinity;
  const send = (type, state) => chrome.runtime.sendMessage({ channel: 'xscroll.remote.poll', type, state }).catch(() => ({ disabled: true }));

  async function poll(current) {
    current.owner = undefined;
    const result = await send('poll', getState());
    if (session !== current) return;
    screenConnected = result?.screenConnected === true;
    routeDisplay(screenConnected, result?.screenAudio === true);
    if (!result || result.disabled) { session = undefined; return; }
    for (const value of result.commands || []) {
      const command = remoteCommand(value);
      if (command) execute(command);
    }
    const owner = host.ownerDocument.defaultView;
    current.owner = owner;
    current.timer = owner.setTimeout(() => poll(current), result.offline ? 2500 : 80);
  }

  return {
    start() {
      if (session) return;
      session = {};
      void poll(session);
    },
    sync() {
      const now = performance.now();
      if (!session || !screenConnected || session.owner || now - lastWake < 145) return;
      lastWake = now;
      void send('wake');
    },
    stop() {
      screenConnected = false;
      routeDisplay(false, false);
      if (!session) return;
      session.owner?.clearTimeout(session.timer);
      session = undefined;
      void send('stop');
    },
    rebind() {
      if (!session || !session.owner) return;
      session.owner.clearTimeout(session.timer);
      const next = {};
      session = next;
      void poll(next);
    },
  };
}
