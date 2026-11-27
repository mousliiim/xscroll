<div align="center">

<img src="static/icons/icon128.png" width="68" height="68" alt="">

# XScroll

**Swipe through X videos, float the player over your work, or watch on another screen while your phone controls playback.**

[Download for Chrome](downloads/XScroll.zip?raw=true) · [Lire en français](README.fr.md)

</div>

https://github.com/user-attachments/assets/e664878c-4946-402c-a871-c0132e9f3d2a

## What you can do

| Feature | What it lets you do |
| --- | --- |
| **Swipe & discover** | Start from a video on X, shuffle into a fresh feed, or search for a topic from your phone. |
| **Mini player & speed** | Keep a resizable player on top of other apps. Change speed live from 0.25× to 2× or hold for a quick slow-down or boost. |
| **Replies & post actions** | Read replies beside the video, let them scroll automatically, and like, save or repost from the player or phone. |
| **Phone & second screen** | Use your phone as a remote and send playback to a browser on another device on the same network. |

## Install on Chrome

1. [Download XScroll.zip](downloads/XScroll.zip?raw=true) and extract it.
2. Open `chrome://extensions`, turn on **Developer mode**, then click **Load unpacked**. Select the extracted folder containing `manifest.json`.
3. Open or refresh X. Click **XScroll** or the XScroll button on a video.

On Windows, you can also double-click **Installer-XScroll.cmd** after extracting the ZIP. It prepares the folder and copies its path for **Load unpacked**.

<details>
<summary>Windows PowerShell installer</summary>

From the extracted folder, run the command below and select the folder shown in Chrome.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-XScroll.ps1 -Language en
```

</details>

Choose **English** or **Français** in the extension popup or the player settings. The phone remote and external screen also have their own language picker. Press `?` in the player for keyboard shortcuts.

## Use your phone or another screen

1. On the computer, open a terminal in the extracted folder and start the relay with Node.js 22 or newer.

   ```sh
   node remote/server.mjs --lan
   ```

2. Open XScroll on X. In the Chrome popup, click **Enable phone remote** and allow the local connection.
3. On a phone on the same network, open the phone address printed by the relay and enter the code shown in Chrome.
4. To watch on another device, open **External screen** on the remote. Open its `/screen` link on that device and enter the code shown there on your phone. Use **Turn on sound** on the display to move the audio there.

<details>
<summary>Using Ubuntu in WSL?</summary>

If the phone can’t reach the relay, stop it and add `--configure-lan`. Approve the Windows prompt to set up local forwarding.

```sh
node remote/server.mjs --lan --configure-lan
```

[WSL networking](https://learn.microsoft.com/windows/wsl/networking)

</details>

<details>
<summary>Build from source</summary>

```sh
npm ci
npm run build
npm test
```

Load the `extension/` folder in Chrome. `npm run package` rebuilds the download ZIP and requires the `zip` command. You can run the local relay from the checkout with `npm run remote -- --lan`.

</details>

<details>
<summary>Demo credits</summary>

The demo was recorded in Chromium with XScroll installed and a sample X feed.

- [Flower](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4) · MDN, CC0.
- [Sunflower](https://commons.wikimedia.org/wiki/File:Video_Codec_Test_sunflower_1080p25.y4m.webm) · Taurus Media Technik, CC0.

</details>

[Privacy](PRIVACY.md) · [MIT license](LICENSE)
