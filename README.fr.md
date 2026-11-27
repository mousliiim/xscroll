<div align="center">

<img src="static/icons/icon128.png" width="68" height="68" alt="">

# XScroll

**Fais défiler les vidéos de X, garde le lecteur au-dessus de tes applis ou regarde sur un autre écran en pilotant depuis ton téléphone.**

[Télécharger pour Chrome](downloads/XScroll.zip?raw=true) · [Read in English](README.md)

</div>

https://github.com/user-attachments/assets/e664878c-4946-402c-a871-c0132e9f3d2a

## Ce que tu peux faire

| Fonction | À quoi ça sert |
| --- | --- |
| **Défiler et découvrir** | Pars d’une vidéo sur X, lance un fil inédit au hasard ou cherche un sujet depuis ton téléphone. |
| **Mini-lecteur et vitesse** | Garde une fenêtre redimensionnable au-dessus de tes applis. Change la vitesse en direct de 0,25× à 2× ou maintiens un bouton pour ralentir ou accélérer temporairement. |
| **Réponses et interactions** | Lis les réponses à côté de la vidéo, laisse-les défiler automatiquement et aime, enregistre ou reposte depuis le lecteur ou le téléphone. |
| **Téléphone et second écran** | Pilote la lecture depuis ton téléphone et affiche la vidéo dans le navigateur d’un autre appareil sur le même réseau. |

## Installer sur Chrome

1. [Télécharge XScroll.zip](downloads/XScroll.zip?raw=true) et extrais-le.
2. Ouvre `chrome://extensions`, active le **Mode développeur**, puis clique sur **Charger l’extension non empaquetée**. Sélectionne le dossier extrait qui contient `manifest.json`.
3. Ouvre ou actualise X. Clique sur **XScroll** ou sur son bouton dans une vidéo.

Sur Windows, tu peux aussi double-cliquer sur **Installer-XScroll.cmd** après avoir extrait le ZIP. Il prépare le dossier et copie le chemin à coller dans Chrome.

<details>
<summary>Installation Windows avec PowerShell</summary>

Dans le dossier extrait, lance la commande ci-dessous, puis sélectionne dans Chrome le dossier indiqué.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-XScroll.ps1 -Language fr
```

</details>

Choisis **Français** ou **English** dans le popup de l’extension ou les réglages du lecteur. La télécommande et l’écran externe ont aussi leur sélecteur de langue. Appuie sur `?` dans le lecteur pour voir les raccourcis.

## Utiliser le téléphone ou un autre écran

1. Sur l’ordinateur, ouvre PowerShell sous Windows ou un terminal sous macOS ou Linux dans le dossier extrait. Lance le relais avec Node.js 22 ou plus récent.

   ```sh
   node remote/server.mjs --lan --lang fr
   ```

   Sous Windows, accepte la demande administrateur si elle apparaît. XScroll configure l’accès local à son relais et affiche l’adresse du téléphone après l’avoir testée depuis l’ordinateur.

2. Ouvre XScroll sur X. Dans le popup Chrome, clique sur **Activer la télécommande** et autorise la connexion locale.
3. Sur un téléphone connecté au même réseau, ouvre l’adresse de la télécommande affichée par le relais et saisis le code affiché dans Chrome.
4. Pour regarder sur un autre appareil, ouvre **Écran externe** dans la télécommande. Ouvre son lien `/screen` sur cet appareil, puis saisis le code de l’écran sur le téléphone. Choisis **Activer le son** sur l’écran pour y transférer l’audio.

<details>
<summary>Tu utilises Ubuntu dans WSL ?</summary>

En mode NAT, la même commande `--lan` configure et vérifie automatiquement la redirection Windows. Accepte la demande administrateur si XScroll doit actualiser la règle. En mode miroir, WSL rejoint directement le réseau local et peut nécessiter une règle de pare-feu Hyper-V pour le port TCP `4781`. Tu peux aussi lancer le relais dans PowerShell sous Windows. [Réseau WSL](https://learn.microsoft.com/windows/wsl/networking)

Si le téléphone ne se connecte toujours pas, utilise la dernière adresse affichée par le relais et vérifie que les deux appareils sont sur le même réseau local. Le Wi-Fi invité et certains pare-feu d’entreprise peuvent bloquer les connexions entre appareils.

</details>

<details>
<summary>Compiler depuis les sources</summary>

```sh
npm ci
npm run build
npm test
```

Charge le dossier `extension/` dans Chrome. `npm run package` régénère le ZIP avec la commande `zip`. Pour lancer le relais depuis le dépôt, utilise `npm run remote -- --lan`.

</details>

<details>
<summary>Crédits de la démo</summary>

La démo a été enregistrée dans Chromium avec XScroll installé et un fil X d’exemple.

- [Flower](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4) · MDN, CC0.
- [Sunflower](https://commons.wikimedia.org/wiki/File:Video_Codec_Test_sunflower_1080p25.y4m.webm) · Taurus Media Technik, CC0.

</details>

[Confidentialité](PRIVACY.md) · [Licence MIT](LICENSE)
