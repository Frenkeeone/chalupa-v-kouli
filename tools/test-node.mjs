// Test: sestaví všechny presety v Node a uloží STL do zadané složky.
// Použití: node tools/test-node.mjs <cesta k manifold.js> <výstupní složka>
import { writeFileSync } from 'node:fs';
import { build } from '../js/geometry.js';
import { PRESETS } from '../js/presets.js';
const [,, manPath, outDir = '.'] = process.argv;
const Module = (await import(manPath)).default;
const M = await Module(); M.setup();
function stl(parts) {
  const tris = parts.reduce((a, p) => a + p.indices.length / 3, 0);
  const buf = Buffer.alloc(84 + tris * 50); buf.writeUInt32LE(tris, 80);
  let o = 84;
  for (const p of parts) for (let i = 0; i < p.indices.length; i += 3) {
    o += 12;
    for (let k = 0; k < 3; k++) { const v = p.indices[i + k] * 3; buf.writeFloatLE(p.positions[v], o); buf.writeFloatLE(p.positions[v + 1], o + 4); buf.writeFloatLE(p.positions[v + 2], o + 8); o += 12; }
    o += 2;
  }
  return buf;
}
const only = process.env.ONLY;
for (const pr of PRESETS) {
  if (only && pr.id !== only) continue;
  for (const rezim of (process.env.REZIM ? [process.env.REZIM] : ['vcelku'])) {
    const t0 = performance.now();
    const r = build(M, { ...pr.p, rezim });
    const dt = performance.now() - t0;
    console.log(`${pr.id} [${rezim}] ${dt.toFixed(0)} ms  1:${r.info.pomer}  domek ${r.info.domekMm.map(v => v.toFixed(1)).join('×')} mm  stromky ${r.info.stromky.map(v=>v.toFixed(1))}`);
    for (const p of r.parts) console.log(`   ${p.name}: tri ${p.indices.length / 3}, objem ${(p.volume / 1000).toFixed(1)} cm³, genus ${p.genus}, status ${p.status}`);
    for (const w of r.warnings) console.log('   ! ' + w);
    writeFileSync(`${outDir}/${pr.id}-${rezim}.stl`, stl(r.parts));
  }
}
