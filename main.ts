// Emberfall Duel — hand-in program (Node 22, standard library only).
//
// It stages the entry for the grader: copy this repository's game/ and
// screenshots/ into the output directory, then write /output/dossier.json
// with buildDossier from the vendored make.fun library. The grader runs
// this program twice and expects byte-identical output both times, so
// every step below is a plain deterministic copy — no timestamps, no
// randomness, no network.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The gate's own caps, as this competition states them: the dossier text
// is capped at 160 KiB, at most 4 screenshots of at most 256 KiB each,
// game/ holds at most 993 entries and 48 MiB with no path over 1,000 bytes.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function stageDirectory(source, target) {
  // Start clean so a stale file from an earlier run can never leak into
  // the output and break the twice-identical requirement.
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

function handIn(repoRoot, outDir) {
  stageDirectory(join(repoRoot, 'game'), join(outDir, 'game'));
  stageDirectory(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  return dossier.length;
}

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const dossierBytes = handIn(repoRoot, outDir);
console.log(`Emberfall Duel staged to ${outDir} (dossier.json ${dossierBytes} bytes).`);
