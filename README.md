# Soleia — Prototypes de la page d'accueil

Trois directions visuelles pour la partie haute (hero) de la page d'accueil de
**Soleia Expérience**, à partir du croquis original et de la charte couleur.

> _« La pause créative qui fait du BIEN. »_

## Palette

| Couleur     | Hex       |
|-------------|-----------|
| Rose        | `#fb6ba6` |
| Orange      | `#f8742f` |
| Rose clair  | `#f8e6e6` |

## Contenu

```
site/
  index.html        → page de sélection (les 3 directions)
  favicon.svg       → icône « soleil »
  previews/         → aperçus utilisés sur la page de sélection
  a/index.html      → A · Éditorial solaire
  b/index.html      → B · Pop joyeux
  c/index.html      → C · Carnet artisanal
Dockerfile          → image nginx (sert le dossier site/)
```

Chaque page est **autonome** : HTML + CSS en ligne, polices via Google Fonts,
décors en SVG. Aucune étape de build, aucune dépendance.

## Aperçu en local

```bash
cd site
python3 -m http.server 8000
# puis ouvrir http://127.0.0.1:8000
```

URLs : `/` (sélection), `/a/`, `/b/`, `/c/`.

## Déploiement sur Dokploy

Un **seul** repo, une **seule** application, un **seul** domaine.

1. Dokploy → **Create Project** → **Create Service** → **Application**.
2. **Source** : GitHub → `SpiderSnakes/Soleia`, branche `main`.
3. **Build Type** : `Dockerfile` (chemin `./Dockerfile`).
4. **Port** du conteneur : `80`.
5. **Domains** : ajoute ton domaine et active le HTTPS (Let's Encrypt).
6. **Deploy**.

En ligne, tu obtiens :

```
tondomaine.com       → page de sélection
tondomaine.com/a/    → A · Éditorial solaire
tondomaine.com/b/    → B · Pop joyeux
tondomaine.com/c/    → C · Carnet artisanal
```

Tu envoies **une seule URL** pour récolter les retours.

## Plus tard : ne garder qu'une version

Une fois la direction choisie, il suffit de remplacer le contenu de
`site/index.html` par celui de la version retenue (ou de la copier à la racine de
`site/`), puis de redéployer. Le reste peut être supprimé.
