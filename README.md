# Soleia — Prototypes de la page d'accueil

Dix directions visuelles pour la partie haute (hero) de la page d'accueil de
**Soleia Expérience**, à partir de la version A validée, du moodboard et de la charte couleur.

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
  index.html        → page de sélection (les 10 directions)
  favicon.svg       → icône « soleil »
  previews/         → aperçus utilisés sur la page de sélection
  01/index.html     → Solaire éditorial      (CSS pur)
  02/index.html     → Soleil 3D              (Three.js / WebGL)
  03/index.html     → Groovy bloom           (GSAP)
  04/index.html     → Pétales                (Canvas)
  05/index.html     → Marquee magazine       (GSAP)
  06/index.html     → Blob morphing          (SVG morph)
  07/index.html     → Sticker collage        (drag JS)
  08/index.html     → Aurora gradient        (shader WebGL)
  09/index.html     → Type kinétique         (Motion One)
  10/index.html     → Soleil & rubans rétro  (Lenis parallax)
  a/index.html      → Version A d'origine (référence)
Dockerfile          → image nginx (sert le dossier site/)
```

Chaque page est **autonome** : HTML + CSS + JS en ligne, polices via Google Fonts,
libs (Three.js, GSAP, Lenis, Motion One…) via CDN, décors en SVG. Aucune étape de
build. Amélioration progressive : chaque hero reste complet en CSS si le JS/WebGL échoue.

## Aperçu en local

```bash
cd site
python3 -m http.server 8000
# puis ouvrir http://127.0.0.1:8000
```

URLs : `/` (sélection), `/01/` … `/10/`, et `/a/` (référence).

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
tondomaine.com/01/   → Solaire éditorial
…
tondomaine.com/10/   → Soleil & rubans rétro
tondomaine.com/a/    → version A d'origine (référence)
```

Tu envoies **une seule URL** pour récolter les retours.

## Plus tard : ne garder qu'une version

Une fois la direction choisie, il suffit de remplacer le contenu de
`site/index.html` par celui de la version retenue (ou de la copier à la racine de
`site/`), puis de redéployer. Le reste peut être supprimé.
