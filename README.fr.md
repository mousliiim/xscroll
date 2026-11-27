<div align="center">

<img src="docs/brand.png" width="68" height="68" alt="">

# XScroll

**Fais défiler les vidéos de X, garde le lecteur au-dessus de tes applis ou regarde sur un autre écran en pilotant depuis ton téléphone.**

[Télécharger pour Chrome](downloads/XScroll.zip?raw=true) · [Voir la démo](docs/xscroll-preview.mp4) · [Read in English](README.md)

<a href="docs/xscroll-preview.mp4"><img src="docs/xscroll-preview.webp" width="880" alt="Lire la démo de XScroll avec le fil vidéo, le mini-lecteur et la télécommande mobile"></a>

</div>

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

1. Sur l’ordinateur, ouvre un terminal dans le dossier extrait et lance le relais avec Node.js 22 ou plus récent.

   ```sh
   node remote/server.mjs --lan --lang fr
   ```

2. Ouvre XScroll sur X. Dans le popup Chrome, clique sur **Activer la télécommande** et autorise la connexion locale.
3. Sur un téléphone connecté au même réseau, ouvre l’adresse de la télécommande affichée par le relais et saisis le code affiché dans Chrome.
4. Pour regarder sur un autre appareil, ouvre **Écran externe** dans la télécommande. Ouvre son lien `/screen` sur cet appareil, puis saisis le code de l’écran sur le téléphone. Choisis **Activer le son** sur l’écran pour y transférer l’audio.

<details>
<summary>Tu utilises Ubuntu dans WSL ?</summary>

Si le téléphone ne joint pas le relais, arrête-le puis relance-le en ajoutant `--configure-lan`. Accepte la demande Windows pour activer la redirection locale.

```sh
node remote/server.mjs --lan --configure-lan
```

[Réseau WSL](https://learn.microsoft.com/windows/wsl/networking)

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

[Confidentialité](PRIVACY.md) · [Licence MIT](LICENSE) · [Crédits de la démo](docs/demo-credits.md)
