// Vygeneruje 3MF pro preset (pro testy). node tools/export-node.mjs <manifold.js> <preset> <rezim> <out.3mf>
import { writeFileSync } from 'node:fs';
import { build } from '../js/geometry.js';
import { PRESETS } from '../js/presets.js';
import { make3MF } from '../js/export.js';
const [,, manPath, id, rezim, out] = process.argv;
const M = await (await import(manPath)).default(); M.setup();
const r = build(M, { ...PRESETS.find(p => p.id === id).p, rezim });
writeFileSync(out, make3MF(r.parts));
console.log(r.parts.map(p => p.name + ' ' + p.status + ' genus ' + p.genus).join('; '), r.warnings);
