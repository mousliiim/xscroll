export const LANGUAGE_KEY = 'xscroll-language';

const pairs = [
  ['Language', 'Langue'],
  ['Video player for X', 'Lecteur vidéo pour X'],
  ['Checking this tab…', 'Vérification de cet onglet…'],
  ['Open player', 'Ouvrir le lecteur'],
  ['Return to player', 'Revenir au lecteur'],
  ['Phone remote', 'Télécommande mobile'],
  ['Keyboard shortcuts in the player', 'Raccourcis clavier dans le lecteur'],
  ['Enable phone remote', 'Activer la télécommande'],
  ['Disconnect phone remote', 'Déconnecter la télécommande'],
  ['Pairing code: {code}', 'Code de jumelage : {code}'],
  ['Start the local server with npm run remote -- --lan, then connect.', 'Lance le serveur local avec npm run remote -- --lan, puis connecte-toi.'],
  ['Open X in a tab to start watching.', 'Ouvre X dans un onglet pour commencer.'],
  ['Go to X', 'Aller sur X'],
  ['Your mini player is open.', 'Ton mini-lecteur est ouvert.'],
  ['Your player is open on this tab.', 'Ton lecteur est ouvert dans cet onglet.'],
  ['Open the video from this post.', 'Ouvre la vidéo de cette publication.'],
  ['Browse videos from the X page you’re on.', 'Parcours les vidéos de ta page X actuelle.'],
  ['Reload this X tab to connect XScroll.', 'Actualise cet onglet X pour connecter XScroll.'],
  ['Reload X', 'Actualiser X'],
  ['Open X to start watching videos with XScroll.', 'Ouvre X pour regarder des vidéos avec XScroll.'],
  ['Couldn’t reach this tab. Open X to try again.', 'Impossible de joindre cet onglet. Ouvre X pour réessayer.'],
  ['Open XScroll', 'Ouvrir XScroll'],
  ['Play this video in XScroll', 'Lire cette vidéo dans XScroll'],
  ['Open floating player', 'Ouvrir le lecteur flottant'],
  ['Mini player', 'Mini-lecteur'],
  ['Player settings', 'Réglages du lecteur'],
  ['Close XScroll (Esc)', 'Fermer XScroll (Échap)'],
  ['Video and post actions', 'Vidéo et actions sur la publication'],
  ['Video feed', 'Fil vidéo'],
  ['Looking for unseen videos…', 'Recherche de vidéos inédites…'],
  ['Find more', 'Trouver d’autres vidéos'],
  ['Seek video', 'Position dans la vidéo'],
  ['Play (Space)', 'Lire (Espace)'],
  ['Pause (Space)', 'Mettre en pause (Espace)'],
  ['Mute (M)', 'Couper le son (M)'],
  ['Unmute (M)', 'Rétablir le son (M)'],
  ['Volume', 'Volume'],
  ['Playback speed', 'Vitesse de lecture'],
  ['Navigate videos', 'Parcourir les vidéos'],
  ['Previous video (↑)', 'Vidéo précédente (↑)'],
  ['Next video (↓)', 'Vidéo suivante (↓)'],
  ['Fill video frame (V)', 'Remplir le cadre (V)'],
  ['Fit', 'Image entière'],
  ['Fill', 'Remplir'],
  ['Fill · Cropped to frame (V)', 'Remplir · Image recadrée (V)'],
  ['Fit · Whole image (V)', 'Image entière · Cadrage ajusté (V)'],
  ['Fullscreen', 'Plein écran'],
  ['Exit fullscreen', 'Quitter le plein écran'],
  ['Post actions', 'Actions sur la publication'],
  ['Like', 'J’aime'],
  ['Unlike', 'Retirer la mention J’aime'],
  ['Liked', 'Aimé'],
  ['Repost', 'Reposter'],
  ['Undo repost', 'Annuler le repost'],
  ['Reposted', 'Reposté'],
  ['Bookmark', 'Ajouter aux signets'],
  ['Remove bookmark', 'Retirer des signets'],
  ['Save', 'Enregistrer'],
  ['Saved', 'Enregistré'],
  ['Show replies', 'Afficher les réponses'],
  ['Show {count} replies', 'Afficher {count} réponses'],
  ['Replies', 'Réponses'],
  ['Copy post link', 'Copier le lien de la publication'],
  ['Share', 'Partager'],
  ['Current post', 'Publication actuelle'],
  ['Post', 'Publication'],
  ['Open post on X', 'Ouvrir la publication sur X'],
  ['Video and replies split', 'Répartition entre la vidéo et les réponses'],
  ['Auto-scroll replies (A)', 'Défilement automatique des réponses (A)'],
  ['Auto-scroll', 'Défilement auto'],
  ['Open conversation on X', 'Ouvrir la conversation sur X'],
  ['Close replies (Esc)', 'Fermer les réponses (Échap)'],
  ['Replies list', 'Liste des réponses'],
  ['Video quality', 'Qualité vidéo'],
  ['Download video', 'Télécharger la vidéo'],
  ['Mini player size and framing', 'Taille et cadrage du mini-lecteur'],
  ['Mini player size', 'Taille du mini-lecteur'],
  ['Appearance', 'Apparence'],
  ['System', 'Système'],
  ['Light', 'Clair'],
  ['Dark', 'Sombre'],
  ['Keyboard shortcuts (?)', 'Raccourcis clavier (?)'],
  ['Keyboard shortcuts', 'Raccourcis clavier'],
  ['Window size', 'Taille de la fenêtre'],
  ['Compact', 'Compacte'],
  ['Balanced', 'Moyenne'],
  ['Large', 'Grande'],
  ['Video framing', 'Cadrage vidéo'],
  ['Profile preview', 'Aperçu du profil'],
  ['View profile', 'Voir le profil'],
  ['Post on X', 'Publication sur X'],
  ['Return player to tab', 'Rapatrier le lecteur dans l’onglet'],
  ['Return to tab', 'Revenir à l’onglet'],
  ['{time} of {duration}', '{time} sur {duration}'],
  ['Best', 'Optimale'],
  ['Auto', 'Auto'],
  ['Auto · Original', 'Auto · Originale'],
  ['Original', 'Originale'],
  ['Play / pause', 'Lire / mettre en pause'],
  ['Previous / next video', 'Vidéo précédente / suivante'],
  ['Seek 5 seconds', 'Sauter de 5 secondes'],
  ['Slower / faster', 'Ralentir / accélérer'],
  ['Reset playback speed', 'Réinitialiser la vitesse'],
  ['Mute / unmute', 'Couper / rétablir le son'],
  ['Auto-scroll replies', 'Défilement automatique des réponses'],
  ['Mini player / return', 'Mini-lecteur / retour'],
  ['Change mini player size', 'Changer la taille du mini-lecteur'],
  ['Light / dark mode', 'Mode clair / sombre'],
  ['Fullscreen in tab', 'Plein écran dans l’onglet'],
  ['Fit / fill the video frame', 'Ajuster / remplir le cadre vidéo'],
  ['Close menu / panel', 'Fermer le menu / panneau'],
  ['Space', 'Espace'],
  ['Esc', 'Échap'],
  ['Shift + ← / →', 'Maj + ← / →'],
  ['Normal speed', 'Vitesse normale'],
  ['Current playback speed', 'Vitesse de lecture actuelle'],
  ['Back to 1×', 'Revenir à 1×'],
  ['Speed presets', 'Vitesses prédéfinies'],
  ['Hold to temporarily change speed', 'Maintenir pour changer temporairement la vitesse'],
  ['Hold for half speed', 'Maintenir pour ralentir à mi-vitesse'],
  ['Hold for double speed', 'Maintenir pour doubler la vitesse'],
  ['Hold ½×', 'Maintenir ½×'],
  ['Hold 2×', 'Maintenir 2×'],
  ['Loop a section', 'Lire un passage en boucle'],
  ['Clear loop', 'Supprimer la boucle'],
  ['Set start', 'Définir le début'],
  ['Set end', 'Définir la fin'],
  ['Slow motion', 'Ralenti'],
  ['Fast forward', 'Accéléré'],
  ['{count} followers', '{count} abonnés'],
  ['X user', 'Compte X'],
  ['View this reply on X', 'Voir cette réponse sur X'],
  ['Preview @{handle}', 'Aperçu du profil @{handle}'],
  ['Loading replies…', 'Chargement des réponses…'],
  ['Couldn’t load replies from X.', 'Impossible de charger les réponses de X.'],
  ['Try again', 'Réessayer'],
  ['No replies to show.', 'Aucune réponse à afficher.'],
  ['Load more replies', 'Afficher plus de réponses'],
  ['Drag an edge of the window to resize it.', 'Fais glisser un bord de la fenêtre pour la redimensionner.'],
  ['The mini player couldn’t open.', 'Impossible d’ouvrir le mini-lecteur.'],
  ['Fullscreen isn’t available.', 'Le plein écran est indisponible.'],
  ['This video couldn’t play.', 'Impossible de lire cette vidéo.'],
  ['Choose an end at least 0.25 s after A.', 'Choisis une fin au moins 0,25 s après A.'],
  ['Couldn’t download this video.', 'Impossible de télécharger cette vidéo.'],
  ['Sign in to X to use post actions.', 'Connecte-toi à X pour interagir avec les publications.'],
  ['X is rate limiting requests. Try again in a moment.', 'X limite les requêtes. Réessaie dans un instant.'],
  ['X couldn’t confirm this action. Open the post to try there.', 'X n’a pas confirmé cette action. Ouvre la publication pour réessayer.'],
  ['Post link copied.', 'Lien de la publication copié.'],
  ['Searching X for “{topic}”…', 'Recherche « {topic} » sur X…'],
  ['Loading the selected video…', 'Chargement de la vidéo sélectionnée…'],
  ['X couldn’t load this search. Try again in a moment.', 'X n’a pas chargé la recherche. Réessaie dans un instant.'],
  ['No new videos for “{topic}”.', 'Aucune nouvelle vidéo pour « {topic} ».'],
  ['Couldn’t load the selected video.', 'Impossible de charger la vidéo sélectionnée.'],
  ['You’re caught up for now.', 'Tu as vu toutes les vidéos disponibles.'],
  ['Retry', 'Réessayer'],
  ['Connecting…', 'Connexion…'],
  ['Connect your phone', 'Connecte ton téléphone'],
  ['In Chrome, open the XScroll popup and enter the six-digit pairing code.', 'Dans Chrome, ouvre le popup XScroll et recopie le code de jumelage à six chiffres.'],
  ['Pairing code', 'Code de jumelage'],
  ['Connect', 'Connecter'],
  ['Remote control', 'Télécommande'],
  ['XScroll remote', 'Télécommande XScroll'],
  ['Open the XScroll player on your computer.', 'Ouvre le lecteur XScroll sur ton ordinateur.'],
  ['Playback', 'Lecture'],
  ['Previous', 'Précédente'],
  ['Play', 'Lire'],
  ['Pause', 'Pause'],
  ['Next', 'Suivante'],
  ['Sound', 'Son'],
  ['Sound off', 'Son coupé'],
  ['Speed', 'Vitesse'],
  ['Speed controls', 'Variations de vitesse'],
  ['Hold for 0.5× speed', 'Maintenir pour ralentir à 0,5×'],
  ['Reset speed to 1×', 'Remettre la vitesse à 1×'],
  ['Hold for 2× speed', 'Maintenir pour accélérer à 2×'],
  ['Boost', 'Boost'],
  ['Show', 'Afficher'],
  ['Hide', 'Masquer'],
  ['Scroll up in replies', 'Remonter dans les réponses'],
  ['Scroll down in replies', 'Descendre dans les réponses'],
  ['Discover', 'Découvrir'],
  ['Shuffle', 'Au hasard'],
  ['Topic feed', 'Fil par sujet'],
  ['e.g. street photography', 'Ex. photo de rue'],
  ['Search for videos', 'Chercher des vidéos'],
  ['External screen', 'Écran externe'],
  ['Close', 'Fermer'],
  ['Open this link in the other screen’s browser.', 'Ouvre ce lien dans le navigateur de l’autre écran.'],
  ['External screen address', 'Adresse de l’écran externe'],
  ['Copy', 'Copier'],
  ['Code shown on the screen', 'Code affiché sur l’écran'],
  ['Pair screen', 'Associer'],
  ['Stop sharing', 'Arrêter la diffusion'],
  ['Ready to pair', 'Prêt à jumeler'],
  ['Player connected', 'Lecteur connecté'],
  ['Player disconnected', 'Lecteur déconnecté'],
  ['Relay unavailable', 'Relais indisponible'],
  ['Connected', 'Connecté'],
  ['Set up', 'Configurer'],
  ['Screen paired.', 'Écran associé.'],
  ['Sharing stopped.', 'Diffusion arrêtée.'],
  ['Address copied.', 'Adresse copiée.'],
  ['Select the address to copy it.', 'Sélectionne l’adresse pour la copier.'],
  ['“{topic}” is now playing on your computer.', 'Fil « {topic} » lancé sur l’ordinateur.'],
  ['A new feed is playing on your computer.', 'Nouveau fil lancé sur l’ordinateur.'],
  ['No new videos right now.', 'Aucune nouvelle vidéo pour le moment.'],
  ['The player didn’t confirm the request. Try again.', 'Le lecteur n’a pas confirmé la demande. Réessaie.'],
  ['The player didn’t confirm this action.', 'Le lecteur n’a pas confirmé cette action.'],
  ['The video changed. Try again on the current post.', 'La vidéo a changé. Réessaie sur le post affiché.'],
  ['This action is already in progress.', 'Cette action est déjà en cours.'],
  ['Sign in to X on your computer.', 'Connecte-toi à X sur l’ordinateur.'],
  ['X didn’t confirm this action. Try again.', 'X n’a pas confirmé cette action. Réessaie.'],
  ['XScroll · Screen', 'XScroll · Écran'],
  ['Connect this screen', 'Connecter cet écran'],
  ['Open', 'Ouvre'],
  ['on the phone remote, then enter this code.', 'dans la télécommande sur ton téléphone, puis saisis ce code.'],
  ['Screen code', 'Code de l’écran'],
  ['New code', 'Nouveau code'],
  ['External screen player', 'Lecteur sur écran externe'],
  ['X post', 'Publication X'],
  ['Turn on sound', 'Activer le son'],
  ['Mute this screen', 'Couper le son ici'],
  ['Start video', 'Lancer la vidéo'],
  ['This screen can’t play the video.', 'Cet écran ne peut pas lire cette vidéo.'],
  ['This video is available on the computer.', 'Cette vidéo est disponible sur l’ordinateur.'],
  ['Waiting for a video on XScroll…', 'En attente d’une vidéo sur XScroll…'],
  ['Loading video…', 'La vidéo se charge…'],
  ['Reconnecting to XScroll…', 'Reconnexion à XScroll…'],
  ['The code expired or sharing stopped.', 'Le code a expiré ou la diffusion a été arrêtée.'],
  ['Couldn’t reach XScroll.', 'Impossible de contacter XScroll.'],
  ['XScroll screen unavailable.', 'Écran XScroll indisponible.'],
  ['Phone', 'Téléphone'],
  ['Screen', 'Écran'],
  ['Computer', 'Ordinateur'],
  ['Add --lan to allow phones on your local network.', 'Ajoute --lan pour autoriser les téléphones sur ton réseau local.'],
  ['Use --configure-lan with --lan.', 'Utilise --configure-lan avec --lan.'],
  ['Setting up Windows network access for XScroll…', 'Configuration de l’accès réseau Windows pour XScroll…'],
  ['Local network access is unavailable.', 'Accès réseau local indisponible.'],
  ['No local IPv4 address found. Connect the computer to the network and restart XScroll.', 'Aucune adresse IPv4 locale détectée. Connecte l’ordinateur au réseau et relance XScroll.'],
  ['The relay is unreachable at the Windows network address. Check the firewall and restart XScroll.', 'Le relais ne répond pas sur l’adresse réseau Windows. Vérifie le pare-feu et relance XScroll.'],
  ['The relay is unreachable at all local network addresses.', 'Le relais ne répond sur aucune adresse du réseau local.'],
  ['Windows LAN or WSL IPv4 address not found.', 'Adresse réseau Windows ou IPv4 WSL introuvable.'],
  ['Windows setup failed. Check that you accepted the administrator prompt.', 'La configuration Windows a échoué. Vérifie que tu as accepté la demande administrateur.'],
  ['Local access only.', 'Réseau local uniquement.'],
  ['Invalid local address.', 'Adresse locale invalide.'],
  ['Desktop access only.', 'Accès bureau uniquement.'],
  ['Invalid method.', 'Méthode invalide.'],
  ['Invalid request.', 'Requête invalide.'],
  ['Page not found.', 'Page introuvable.'],
  ['Invalid origin.', 'Origine invalide.'],
  ['Screen is not paired.', 'Écran non associé.'],
  ['Pair your phone first.', 'Appaire ton téléphone.'],
  ['Incorrect or expired screen code.', 'Code écran incorrect ou expiré.'],
  ['Too many attempts. Try again in a minute.', 'Trop de tentatives. Réessaie dans une minute.'],
  ['Incorrect code.', 'Code incorrect.'],
  ['Invalid command or topic.', 'Commande ou sujet invalide.'],
  ['No video is playing.', 'Aucune vidéo en cours.'],
  ['The player is still processing your commands.', 'Le lecteur traite encore tes commandes.'],
];

const translations = {
  en: new Map(pairs.map(([english, french]) => [french, english])),
  fr: new Map(pairs),
};
let current = 'en';
const bindings = new WeakMap();
const attributes = ['title', 'aria-label', 'placeholder', 'alt'];

export function normalizeLanguage(value) {
  return typeof value === 'string' && /^fr(?:-|$)/i.test(value) ? 'fr' : 'en';
}

export const language = () => current;
export const setLanguage = value => { current = normalizeLanguage(value); };

export function translate(source, values, locale = current) {
  const text = translations[normalizeLanguage(locale)].get(source) ?? source ?? '';
  return values ? text.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match) : text;
}

function bind(node, property, apply) {
  const nodeBindings = bindings.get(node) || new Map();
  nodeBindings.set(property, apply);
  bindings.set(node, nodeBindings);
  apply();
}

export function text(node, source, values) {
  bind(node, 'text', () => {
    const message = typeof source === 'function' ? source() : translate(source, values);
    if (node.textContent !== message) node.textContent = message;
  });
}

export function attribute(node, name, source, values) {
  bind(node, name, () => {
    const message = typeof source === 'function' ? source() : translate(source, values);
    if (node.getAttribute(name) !== message) node.setAttribute(name, message);
  });
}

function walk(root, visit) {
  const walker = root.ownerDocument.createTreeWalker(root, 5);
  for (let node = root; node; node = walker.nextNode()) visit(node);
}

const known = value => translations.en.has(value) || translations.fr.has(value);

export function localizeMarkup(root) {
  walk(root, node => {
    if (node.nodeType === 3 && known(node.data.trim())) {
      const original = node.data;
      const phrase = original.trim();
      bind(node, 'data', () => { node.data = original.replace(phrase, translate(phrase)); });
    } else if (node.nodeType === 1) {
      for (const name of attributes) {
        const value = node.getAttribute(name);
        if (known(value)) attribute(node, name, value);
      }
    }
  });
}

export function refreshLanguage(root) {
  walk(root, node => {
    for (const apply of bindings.get(node)?.values() || []) apply();
  });
}

export function pageLanguage() {
  const controls = [...document.querySelectorAll('.language-select')];
  const change = value => {
    setLanguage(value || navigator.language);
    document.documentElement.lang = language();
    if (document.body.dataset.pageTitle) document.title = translate(document.body.dataset.pageTitle);
    for (const control of controls) control.value = language();
    refreshLanguage(document.body);
  };
  localizeMarkup(document.body);
  let stored;
  try { stored = localStorage.getItem(LANGUAGE_KEY); } catch {}
  change(stored);
  for (const control of controls) control.addEventListener('change', () => {
    try { localStorage.setItem(LANGUAGE_KEY, control.value); } catch {}
    change(control.value);
  });
  window.addEventListener('storage', event => {
    if (event.key === LANGUAGE_KEY) change(event.newValue);
  });
}
