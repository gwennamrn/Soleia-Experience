#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Soleia — optimiseur de médias (images + vidéos)
//
// Rôle : on dépose l'ORIGINAL dans _src/<chemin>/nom.ext, et ce script écrit les
// versions optimisées (« dérivés ») dans site/<chemin>/nom.<format>. Le dossier
// _src/ miroite donc l'arborescence servie sous site/.
//
//   Exemple : _src/ateliers/img/miroir-1.jpg
//          -> site/ateliers/img/miroir-1.avif | .webp | .jpg
//
// Lancé une seule fois à l'import (les dérivés sont commités), JAMAIS au déploiement.
//
// Usage :
//   node tools/optimiser-medias.mjs            (traite tout _src/)
//   node tools/optimiser-medias.mjs --thumb    (+ vignettes -thumb width:800)
//   node tools/optimiser-medias.mjs --force    (ignore le cache/manifeste)
//   node tools/optimiser-medias.mjs --only "**/_test/**"   (filtre par motif)
// ─────────────────────────────────────────────────────────────────────────────

import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import sharp from 'sharp';
import ffmpegStatic from 'ffmpeg-static';

// ── Chemins de base ──────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, '_src');
const SITE_DIR = path.join(ROOT, 'site');
const MANIFEST_PATH = path.join(ROOT, 'tools', '.media-manifest.json');
const MANIFEST_VERSION = 1;

const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);

// ── Arguments ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const FLAGS = {
  thumb: argv.includes('--thumb'),
  force: argv.includes('--force'),
  only: null,
};
{
  const i = argv.indexOf('--only');
  if (i !== -1 && argv[i + 1]) FLAGS.only = argv[i + 1];
}

// ── Utilitaires ──────────────────────────────────────────────────────────────
function ko(bytes) {
  return `${Math.max(1, Math.round(bytes / 1024))}ko`;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function fileSize(p) {
  try {
    return (await fs.stat(p)).size;
  } catch {
    return 0;
  }
}

function sha1OfFile(p) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = createReadStream(p);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

// Mini matcher de glob (suffisant pour --only) : supporte ** et *.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++; // **/ -> .*
      } else {
        re += '[^/]*';
      }
    } else if ('\\^$+?.()|{}[]'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

async function walk(dir) {
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
      out.push(...(await walk(full)));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

// ── Manifeste (idempotence) ──────────────────────────────────────────────────
async function loadManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (data && data.version === MANIFEST_VERSION && data.entries) return data;
  } catch {
    /* manifeste absent ou illisible : on repart de zéro */
  }
  return { version: MANIFEST_VERSION, entries: {} };
}

async function saveManifest(manifest) {
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

// ── Détection transparence ───────────────────────────────────────────────────
async function hasAlpha(srcAbs, ext) {
  try {
    const meta = await sharp(srcAbs).metadata();
    if (typeof meta.hasAlpha === 'boolean') return meta.hasAlpha;
  } catch {
    /* ignore */
  }
  return ext === '.png';
}

// ── Traitement d'une PHOTO ───────────────────────────────────────────────────
async function processPhoto(srcAbs, relNoExt, outDirAbs) {
  const inIllustrations = relNoExt.split(path.sep).includes('illustrations');
  const ext = path.extname(srcAbs).toLowerCase();
  const alpha = inIllustrations || (await hasAlpha(srcAbs, ext));

  const baseName = path.basename(relNoExt);
  const produced = [];
  const reportParts = [];

  // Une « variante » = un suffixe ('' pleine résolution, ou '-thumb') + une largeur.
  const variants = [{ suffix: '', width: null }];
  if (FLAGS.thumb) variants.push({ suffix: '-thumb', width: 800 });

  for (const v of variants) {
    const name = baseName + v.suffix;

    const prep = () => {
      let img = sharp(srcAbs).rotate(); // auto-orient via EXIF
      if (v.width) img = img.resize({ width: v.width, withoutEnlargement: true });
      return img;
    };

    // AVIF
    const avifOut = path.join(outDirAbs, `${name}.avif`);
    await prep().avif({ quality: 60, effort: 6 }).toFile(avifOut);
    produced.push(avifOut);

    // WebP
    const webpOut = path.join(outDirAbs, `${name}.webp`);
    await prep().webp({ quality: 80 }).toFile(webpOut);
    produced.push(webpOut);

    // Format « de repli » : PNG si transparence, sinon JPEG.
    let fallbackOut;
    if (alpha) {
      fallbackOut = path.join(outDirAbs, `${name}.png`);
      await prep().png({ compressionLevel: 9, palette: true }).toFile(fallbackOut);
    } else {
      fallbackOut = path.join(outDirAbs, `${name}.jpg`);
      await prep().jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(fallbackOut);
    }
    produced.push(fallbackOut);

    const fbExt = path.extname(fallbackOut).slice(1);
    const tag = v.suffix ? ' (vignette)' : '';
    reportParts.push(
      `avif ${ko(await fileSize(avifOut))} · webp ${ko(await fileSize(webpOut))} · ${fbExt} ${ko(
        await fileSize(fallbackOut),
      )}${tag}`,
    );
  }

  console.log(`✓ ${relNoExt} — ${reportParts.join('  ·  ')}`);
  return produced;
}

// ── ffmpeg ───────────────────────────────────────────────────────────────────
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegStatic) {
      reject(new Error('ffmpeg-static introuvable (binaire non installé).'));
      return;
    }
    const child = spawn(ffmpegStatic, ['-y', '-hide_banner', '-loglevel', 'error', ...args]);
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg a échoué (code ${code}) : ${stderr.trim()}`));
    });
  });
}

async function ffmpegEncoders() {
  return new Promise((resolve) => {
    if (!ffmpegStatic) return resolve('');
    const child = spawn(ffmpegStatic, ['-hide_banner', '-encoders']);
    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.on('error', () => resolve(''));
    child.on('close', () => resolve(out));
  });
}

// ── Traitement d'une VIDÉO ───────────────────────────────────────────────────
async function processVideo(srcAbs, relNoExt, outDirAbs, encoders) {
  const baseName = path.basename(relNoExt);
  const produced = [];
  const reportParts = [];

  // AV1 .webm — SVT-AV1 si dispo, sinon repli libaom-av1.
  const av1Out = path.join(outDirAbs, `${baseName}.av1.webm`);
  if (encoders.includes('libsvtav1')) {
    await runFfmpeg([
      '-i', srcAbs,
      '-c:v', 'libsvtav1', '-crf', '32', '-b:v', '0',
      '-c:a', 'libopus', '-b:a', '128k',
      av1Out,
    ]);
  } else {
    await runFfmpeg([
      '-i', srcAbs,
      '-c:v', 'libaom-av1', '-crf', '32', '-b:v', '0', '-cpu-used', '6',
      '-c:a', 'libopus', '-b:a', '128k',
      av1Out,
    ]);
  }
  produced.push(av1Out);
  reportParts.push(`av1 ${ko(await fileSize(av1Out))}`);

  // VP9 .webm
  const vp9Out = path.join(outDirAbs, `${baseName}.vp9.webm`);
  await runFfmpeg([
    '-i', srcAbs,
    '-c:v', 'libvpx-vp9', '-crf', '31', '-b:v', '0',
    '-c:a', 'libopus', '-b:a', '128k',
    vp9Out,
  ]);
  produced.push(vp9Out);
  reportParts.push(`vp9 ${ko(await fileSize(vp9Out))}`);

  // H.264 .mp4
  const h264Out = path.join(outDirAbs, `${baseName}.h264.mp4`);
  await runFfmpeg([
    '-i', srcAbs,
    '-c:v', 'libx264', '-crf', '21', '-preset', 'slow',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    h264Out,
  ]);
  produced.push(h264Out);
  reportParts.push(`h264 ${ko(await fileSize(h264Out))}`);

  // Poster (frame à 1 s)
  const posterOut = path.join(outDirAbs, `${baseName}-poster.jpg`);
  await runFfmpeg(['-ss', '1', '-i', srcAbs, '-frames:v', '1', '-q:v', '3', posterOut]);
  produced.push(posterOut);
  reportParts.push(`poster ${ko(await fileSize(posterOut))}`);

  console.log(`✓ ${relNoExt} (vidéo) — ${reportParts.join(' · ')}`);
  return produced;
}

// ── Programme principal ──────────────────────────────────────────────────────
async function main() {
  if (!(await exists(SRC_DIR))) {
    console.log('ℹ️  Aucun dossier _src/ à la racine — rien à optimiser.');
    console.log('   Dépose tes originaux dans _src/ (miroir de site/) puis relance « npm run media ».');
    process.exit(0);
  }

  const allFiles = await walk(SRC_DIR);
  // On ignore les fichiers d'accompagnement (README, .DS_Store, etc.).
  let media = allFiles.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return PHOTO_EXT.has(ext) || VIDEO_EXT.has(ext);
  });

  if (FLAGS.only) {
    const re = globToRegExp(FLAGS.only);
    media = media.filter((f) => {
      const rel = path.relative(SRC_DIR, f).split(path.sep).join('/');
      return re.test(rel) || re.test('_src/' + rel);
    });
  }

  if (media.length === 0) {
    console.log('ℹ️  Aucun média à traiter dans _src/' + (FLAGS.only ? ` (filtre : ${FLAGS.only})` : '') + '.');
    process.exit(0);
  }

  const manifest = await loadManifest();
  const hasVideo = media.some((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()));
  const encoders = hasVideo ? await ffmpegEncoders() : '';

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const srcAbs of media) {
    const rel = path.relative(SRC_DIR, srcAbs); // ex. ateliers/img/miroir-1.jpg
    const relPosix = rel.split(path.sep).join('/');
    const ext = path.extname(srcAbs).toLowerCase();
    const relDir = path.dirname(rel);
    const relNoExt = path.join(relDir, path.basename(rel, path.extname(rel)));
    const relNoExtPosix = relNoExt.split(path.sep).join('/');
    const outDirAbs = path.join(SITE_DIR, relDir);

    let hash;
    try {
      hash = await sha1OfFile(srcAbs);
    } catch (err) {
      console.error(`✗ ${relNoExtPosix} — lecture impossible : ${err.message}`);
      failed++;
      continue;
    }

    // Idempotence : même hash + tous les dérivés présents + même variante thumb -> SKIP.
    const prev = manifest.entries[relPosix];
    if (!FLAGS.force && prev && prev.hash === hash && prev.thumb === FLAGS.thumb) {
      const allThere =
        Array.isArray(prev.outputs) &&
        prev.outputs.length > 0 &&
        (await Promise.all(prev.outputs.map((o) => exists(path.join(ROOT, o))))).every(Boolean);
      if (allThere) {
        console.log(`· ${relNoExtPosix} — inchangé, sauté`);
        skipped++;
        continue;
      }
    }

    await fs.mkdir(outDirAbs, { recursive: true });

    try {
      let produced;
      if (PHOTO_EXT.has(ext)) {
        produced = await processPhoto(srcAbs, relNoExtPosix, outDirAbs);
      } else {
        produced = await processVideo(srcAbs, relNoExtPosix, outDirAbs, encoders);
      }

      manifest.entries[relPosix] = {
        hash,
        thumb: FLAGS.thumb,
        outputs: produced.map((p) => path.relative(ROOT, p).split(path.sep).join('/')),
        at: new Date().toISOString(),
      };
      processed++;
    } catch (err) {
      console.error(`✗ ${relNoExtPosix} — échec : ${err.message}`);
      failed++;
    }
  }

  await saveManifest(manifest);

  console.log('');
  console.log(`Récapitulatif : ${processed} traité(s) · ${skipped} sauté(s)${failed ? ` · ${failed} en échec` : ''}.`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Erreur inattendue :', err);
  process.exit(1);
});
