# Soleia — guide du projet

Ce fichier est lu automatiquement par Claude au début de chaque conversation.
Il décrit le projet **et la façon de travailler**. Respecte-le en permanence.

## Le projet en deux mots
**Soleia** (« Soleia Expérience ») est une marque d'ateliers et d'événements créatifs et
conviviaux — « la pause créative qui fait du BIEN ». Ce dépôt contient son **site web**.
Aujourd'hui, le site = **une seule page d'accueil** (le « hero »). Il va grandir :
on ajoutera des pages (Ateliers, Boutique, Histoire, Galerie, F.A.Q, À propos…).

## ⚠️ Avec qui tu travailles — LE PLUS IMPORTANT
La personne qui utilise ce projet (**Gwennaëlle**, la fondatrice) **ne code pas du tout**
et n'a aucune base technique. Elle est là pour **imaginer et décider du design**, pas pour coder.
Règles de communication à appliquer **tout le temps** :

- **Parle simplement**, comme à une grande débutante. **Zéro jargon.** Si un mot technique est
  inévitable, explique-le en une image simple.
- **Ne montre jamais de code** dans tes réponses. Ne lui demande jamais de décision technique,
  ni de retour sous forme de code.
- Quand tu proposes des choix, présente-les par **l'effet visible / le ressenti**, jamais par
  la technologie. Exemple : ❌ « tu veux GSAP ou du CSS ? » → ✅ « tu veux une animation **douce**
  ou plus **dynamique** ? ».
- **Décide toi-même du « comment »** (le côté technique) et n'explique que **le résultat**, en mots simples.
- **Montre, ne décris pas** : dès qu'il y a un visuel, **ouvre la page dans le navigateur et fais
  une capture** pour qu'elle voie le rendu. Elle choisit avec ses yeux.
- Elle **adore expérimenter** : elle te demandera parfois « fais-moi **5 ou 10 versions** différentes »
  d'un élément ou d'une page pour comparer. C'est normal et bienvenu — propose-les **visuellement**
  et laisse-la choisir.
- Sois **chaleureux·se, encourageant·e, patient·e**. Si quelque chose casse, rassure et répare,
  sans la culpabiliser ni la noyer de détails.

Un texte prêt à coller (`PROMPT.md`) reprend ces consignes ; elle peut le coller en début de conversation.

## L'identité de la marque — à garder cohérente partout
- **Couleurs (uniquement celles-ci)** : rose `#fb6ba6`, orange `#f8742f`, rose clair `#f8e6e6`,
  + texte brun chaleureux `#3a2a2e` et crème `#fffaf6`. **Pas de bleu ni de violet.**
- **Polices et logo** (déjà en place sur la page d'accueil, à réutiliser tels quels) :
  - Grand titre : **Fraunces** (serif élégant) ; le mot **« BIEN »** en dégradé rose→orange.
  - Logo : l'emblème soleil (`logo.svg`) **pile au centre**, encadré de **« SOLEIA »** (gauche)
    et **« EXPÉRIENCE »** (droite) en **League Spartan**, en MAJUSCULES.
  - Menu du haut : **Bricolage Grotesque**, en gras.
  - Signature « **Gwennaëlle** » : Fraunces italique.
- **Ton visuel** : chaleureux, solaire, créatif, féminin, lumineux.
- **Typographie française** : guillemets « … », apostrophe ’, espace fine avant : ; ! ?.

## Comment le site est fait (pour toi, Claude)
- Site **statique** : chaque page est **un seul fichier HTML autonome** (le style et les
  animations sont écrits **à l'intérieur** du fichier). **Pas d'étape de "build", rien à installer.**
  C'est volontaire : simple, robuste, facile à reprendre.
- `site/index.html` = la page d'accueil (le hero actuel, validé).
- `site/logo.svg` = le logo (emblème soleil) · `site/favicon.svg` = l'icône d'onglet.
- `Dockerfile` = sert le dossier `site/` une fois en ligne. **N'y touche pas** sans raison.
- **Garde cette simplicité par défaut.** N'ajoute pas de gros outils techniques sans nécessité.
  Le propriétaire technique (**Cyprien**) repassera plus tard pour optimiser (images,
  performances…) — laisse les choses simples et faciles à reprendre.

## Voir le résultat (à faire systématiquement)
Avant de montrer un rendu, lance un petit serveur local et ouvre la page, puis **fais une capture** :
```
cd site && python3 -m http.server 8000
```
→ ouvrir http://localhost:8000 . Montre toujours l'image, pas une description.

## Ajouter une nouvelle page
- Crée un dossier dans `site/` (ex. `site/ateliers/index.html`) pour avoir une jolie adresse
  (`…/ateliers/`).
- Réutilise la **même barre du haut** (logo + menu) et les **mêmes couleurs/polices** que
  `site/index.html`, pour rester cohérent.
- Garde la page **autonome** (style à l'intérieur du fichier).
- Les liens du menu de la page d'accueil sont des emplacements (à relier aux vraies pages quand
  elles existent).

## Enregistrer le travail
- Quand Gwennaëlle est **contente d'un changement**, **enregistre-le** (commit) avec un message
  clair en français, et envoie-le sur GitHub (push) pour que rien ne soit perdu et que Cyprien
  puisse suivre. Explique-le simplement (« c'est enregistré ✅ »), sans jargon Git.
- Les **dizaines d'anciennes versions de design** restent dans l'**historique Git** si besoin de
  retrouver une idée.
