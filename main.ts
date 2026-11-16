// Deterministic offline artifact exporter; Node 22.18+ standard library only.
import { existsSync, cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const source = fileURLToPath(new URL('.', import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const relation = relative(resolve(source), destination);
if (relation === '' || (!relation.startsWith('..' + sep) && !isAbsolute(relation))) {
  throw new Error('Output must be outside the source repository.');
}
if (existsSync(destination) && readdirSync(destination).length) {
  throw new Error('Output must be empty, so stale files cannot enter the artifact.');
}
mkdirSync(destination, { recursive: true });
for (const directory of ['game', 'screenshots']) {
  const entries = readdirSync(join(source, directory));
  if (!entries.length) throw new Error(`Missing ${directory} contents`);
  cpSync(join(source, directory), join(destination, directory), { recursive: true, dereference: false });
}
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
console.log('Lantern Tide: game, four browser captures, and deterministic dossier exported.');
