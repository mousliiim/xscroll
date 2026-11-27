# XScroll privacy

XScroll has no hosted backend, analytics, or developer data collection.

- **X pages.** The extension reads selected X timeline responses to find playable videos and post metadata. It requests related videos, replies and profile photos from X or X’s media CDN using the active X session.
- **Post actions.** Likes, reposts and bookmarks are sent to X when you select the corresponding control. XScroll uses the session already in your browser. It keeps credentials out of extension storage.
- **Preferences.** Quality, theme, video framing, mini-player layout, replies auto-scroll and a bounded history of recently viewed clips are stored locally. Playback preferences use `xscroll:` keys for x.com. A bounded watch history is also kept in Chrome extension storage so it survives site cache changes.
- **Chrome access.** The observer and content script run on `https://x.com/*`. Chrome’s `activeTab` permission lets the toolbar popup identify or reload the active X tab when you use the popup.
- **Files and clipboard.** Downloads save an MP4 to your device. Copying a link writes the selected post’s URL to your clipboard.

- **Optional phone remote.** The local server carries playback, discovery and post action commands, search topics and player status. Pairing codes, sessions and the current discovery status stay in server memory. When you submit a topic, the extension opens X’s video search in a temporary background tab using your existing X session. Chrome asks for access to its local loopback address when you enable the remote.

- **Optional external display.** Authorizing a display from the phone remote gives its local browser temporary read-only access to the current video URL, caption, author avatar and playback state. It loads compatible MP4s directly from X’s CDN. XScroll keeps X login data on the desktop and excludes media identified as protected or restricted from the display.
