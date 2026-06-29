#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Soleia — vérification des médias référencés (GARDE au build)
//
// Node PUR : aucun import de sharp / ffmpeg. Ce script doit pouvoir tourner dans
// un conteneur minimal, sans dépendances natives.
//
// Rôle : scanne tous les site/**/*.html, relève chaque image/vidéo locale citée
// (src des <img>/<video>, src + srcset des <source>) et vérifie que le fichier
// existe bien sous site/. S'il manque au moins un fichier -> liste + exit 1.
// Sinon « ✓ tous les médias référencés existent » + exit 0.
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_DIR = path.join(ROOT, 'site');

const MEDIA_EXT = new Set(['avif', 'webp', 'jpg', 'jpeg', 'png', 'webm', 'mp4']);

// Dossiers exclus (brouillons / pages de labo non publiées) :
//  - site/ateliers/labo/**
//  - tout segment de type vN ou deco-vN (ex. /v1/, /deco-v3/)
function isExcluded(htmlAbs) {
  const rel = path.relative(SITE_DIR, htmlAbs).split(path.sep);
  if (rel[0] === 'ateliers' && rel[1] === 'labo') return true;
  return rel.some((seg) => /^(deco-)?v\d+$/.test(seg));
}

async function walkHtml(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkHtml(full)));
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function hasMediaExt(url) {
  const clean = url.split('#')[0].split('?')[0];
  const ext = clean.includes('.') ? clean.slice(clean.lastIndexOf('.') + 1).toLowerCase() : '';
  return MEDIA_EXT.has(ext);
}

function isLocal(url) {
  if (!url) return false;
  if (/^(https?:)?\/\//i.test(url)) return false; // http(s):// ou //cdn
  if (/^data:/i.test(url)) return false;
  if (/^(mailto:|tel:|#)/i.test(url)) return false;
  return true;
}

// Extrait les URLs média d'un fichier HTML.
function extractRefs(html) {
  const refs = [];

  // src="..." (couvre <img src>, <video src>, <source src>, <audio src>…)
  for (const m of html.matchAll(/\bsrc\s*=\s*"([^"]*)"/gi)) {
    const url = m[1].trim();
    if (isLocal(url) && hasMediaExt(url)) refs.push(url);
  }
  for (const m of html.matchAll(/\bsrc\s*=\s*'([^']*)'/gi)) {
    const url = m[1].trim();
    if (isLocal(url) && hasMediaExt(url)) refs.push(url);
  }

  // srcset="url1 1x, url2 2x, …" (sur <source> et <img>)
  const srcsetVals = [];
  for (const m of html.matchAll(/\bsrcset\s*=\s*"([^"]*)"/gi)) srcsetVals.push(m[1]);
  for (const m of html.matchAll(/\bsrcset\s*=\s*'([^']*)'/gi)) srcsetVals.push(m[1]);
  for (const val of srcsetVals) {
    for (const candidate of val.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (isLocal(url) && hasMediaExt(url)) refs.push(url);
    }
  }

  return refs;
}

// Résout une URL référencée (absolue « /… » ou relative au fichier HTML) vers un
// chemin disque sous site/.
function resolveToDisk(url, htmlAbs) {
  const clean = url.split('#')[0].split('?')[0];
  if (clean.startsWith('/')) {
    return path.join(SITE_DIR, clean.slice(1));
  }
  return path.resolve(path.dirname(htmlAbs), clean);
}

async function fileExists(p) {
  try {
    const st = await fs.stat(p);
    return st.isFile();
  } catch {
    return false;
  }
}

async function main() {
  if (!(await fileExists(path.join(SITE_DIR, 'index.html'))) && !(await dirExists(SITE_DIR))) {
    console.log('ℹ️  Dossier site/ introuvable — rien à vérifier.');
    process.exit(0);
  }

  const htmlFiles = (await walkHtml(SITE_DIR)).filter((f) => !isExcluded(f));

  const missing = []; // { html, url, disk }
  let checked = 0;

  for (const htmlAbs of htmlFiles) {
    let html;
    try {
      html = await fs.readFile(htmlAbs, 'utf8');
    } catch {
      continue;
    }
    const refs = extractRefs(html);
    for (const url of refs) {
      checked++;
      const disk = resolveToDisk(url, htmlAbs);
      if (!(await fileExists(disk))) {
        missing.push({
          html: path.relative(ROOT, htmlAbs),
          url,
          disk: path.relative(ROOT, disk),
        });
      }
    }
  }

  if (missing.length > 0) {
    console.error(`✗ ${missing.length} média(s) référencé(s) introuvable(s) :\n`);
    for (const m of missing) {
      console.error(`  • ${m.url}`);
      console.error(`      cité dans : ${m.html}`);
      console.error(`      attendu à : ${m.disk}`);
    }
    console.error('');
    console.error('→ Dépose l’original dans _src/ (miroir de site/) puis lance « npm run media ».');
    process.exit(1);
  }

  console.log(`✓ tous les médias référencés existent (${checked} référence(s) dans ${htmlFiles.length} page(s)).`);
  process.exit(0);
}

async function dirExists(p) {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

main().catch((err) => {
  console.error('Erreur inattendue :', err);
  process.exit(1);
});
