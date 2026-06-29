# Dossier `_src/` — les originaux (sauvegarde)

Ce dossier contient les **fichiers originaux** des images et des vidéos du site
(les photos « brutes », telles qu'on les reçoit ou qu'on les exporte).

## À quoi il sert

- C'est une **sauvegarde** : on garde ici la version d'origine, en pleine qualité.
- On **ne le sert jamais** au public. Le site en ligne n'affiche que les versions
  optimisées (plus légères) qui se trouvent dans `site/`.

## Comment il est organisé

`_src/` **copie l'arborescence** de `site/`. Autrement dit, un original rangé ici :

```
_src/ateliers/img/miroir-1.jpg
```

produira automatiquement ses versions optimisées au même endroit dans `site/` :

```
site/ateliers/img/miroir-1.avif
site/ateliers/img/miroir-1.webp
site/ateliers/img/miroir-1.jpg
```

## La marche à suivre

1. Dépose ton image (ou ta vidéo) d'origine ici, dans le bon sous-dossier.
2. Lance dans un terminal :
   - `npm run media` — fabrique les versions optimisées,
   - ou `npm run media:thumbs` — pareil, **plus** des petites vignettes pour les galeries.
3. Insère ensuite l'image dans la page via un bloc `<picture>` (voir `CLAUDE.md`,
   section « Images & vidéos — pipeline obligatoire »).

> ℹ️  On ne réduit **jamais** la taille des grandes images : seules les vignettes
> sont rétrécies. Les originaux restent ici, intacts.
