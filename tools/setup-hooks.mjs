#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Soleia — installation du hook Git local (pre-commit)
//
// Pointe Git vers le dossier .githooks/ du dépôt, pour activer la vérification
// des médias avant chaque commit. Tout est dans un try/catch SILENCIEUX : ce
// script ne doit JAMAIS faire échouer un « npm install » (postinstall).
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

try {
  if (existsSync(path.join(ROOT, '.git'))) {
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    console.log('✓ Hook Git « pre-commit » activé (vérification des médias avant commit).');
  }
} catch {
  // Silencieux : pas de dépôt Git, Git absent, ou config refusée — on n'échoue pas.
}
