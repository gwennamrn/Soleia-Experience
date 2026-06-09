# Soleia — site web

Le site de **Soleia** (« Soleia Expérience ») — ateliers et événements créatifs,
« la pause créative qui fait du BIEN ».

Aujourd'hui, le site est **une page d'accueil** ; il grandira (Ateliers, Boutique,
Histoire, Galerie, F.A.Q…).

## 👋 Tu reprends le projet ?
Tu n'as **pas besoin de savoir coder**. Tu vas surtout **discuter avec Claude** (dans
Visual Studio Code) pour imaginer et faire évoluer le site. Pour bien démarrer :

1. Ouvre le dossier du projet dans **VS Code** (avec Claude Code).
2. Ouvre le fichier **`PROMPT.md`**, copie le texte indiqué, et colle-le au début de ta
   conversation avec Claude.
3. Demande ce que tu veux en langage normal (ex. « ajoute une page Ateliers », « propose-moi
   5 versions du bouton », « change l'ambiance pour plus douce »). Claude te montrera des images.

Claude connaît déjà la marque (couleurs, polices, ton) grâce au fichier **`CLAUDE.md`**.

## Voir le site sur ton ordinateur
Dans un terminal, à la racine du projet :
```
cd site && python3 -m http.server 8000
```
Puis ouvre **http://localhost:8000** dans ton navigateur.
(Claude peut aussi le faire et te montrer une capture — n'hésite pas à lui demander.)

## Ce qu'il y a dans le dossier
```
site/
  index.html     → la page d'accueil
  logo.svg       → le logo (soleil)
  favicon.svg    → la petite icône de l'onglet
CLAUDE.md        → le guide que Claude lit automatiquement (identité + façon de travailler)
AGENTS.md        → même idée, pour d'autres outils
PROMPT.md        → le texte à coller en début de conversation
Dockerfile       → sert à mettre le site en ligne (géré côté technique)
```

## Mise en ligne & technique
La mise en ligne (Dokploy) et les optimisations techniques (images, performances…)
sont gérées par **Cyprien**, qui repasse régulièrement. De ton côté : concentre-toi
sur le design et le contenu, Claude s'occupe du reste. 🌞
