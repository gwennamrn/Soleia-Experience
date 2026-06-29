# Soleia — site Astro (statique), construit puis servi par nginx.
# Image multi-étapes : on construit avec Node, on ne garde que le résultat.

# ---------- Étape 1 : construction du site avec Astro ----------
FROM node:22-alpine AS build
WORKDIR /app

# Le manifeste des dépendances d'abord : tant qu'il ne change pas,
# Docker réutilise le cache de cette étape (installation plus rapide).
COPY package.json package-lock.json ./

# On installe UNIQUEMENT ce qu'il faut pour construire (Astro).
# - --omit=dev : pas de sharp/ffmpeg (optimisation des médias À L'IMPORT, pas au build).
# - --ignore-scripts : on saute le postinstall (hook Git local, inutile ici) et les
#   scripts d'install ; esbuild/rollup fournissent leurs binaires via des paquets
#   optionnels (@esbuild/linux-x64, @rollup/rollup-linux-*) → aucun script requis.
RUN npm ci --omit=dev --ignore-scripts

# Le reste des sources, puis on construit.
# `npm run build` lance d'abord le garde-fou médias (prebuild), puis Astro.
COPY . .
RUN npm run build

# ---------- Étape 2 : image finale légère (nginx sert dist/) ----------
FROM nginx:alpine

# nginx sert automatiquement index.html et les sous-dossiers (/ateliers/, …).
# Astro génère des URL « propres » en dossiers (build.format: 'directory').
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
