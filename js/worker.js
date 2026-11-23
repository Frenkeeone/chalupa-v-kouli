// Výpočet geometrie mimo hlavní vlákno.
import Module from '../vendor/manifold/manifold.js';
import { build } from './geometry.js';

let M = null;
let builds = 0; // WASM paměť po výpočtech roste → hlavní vlákno worker po čase vymění
const ready = (async () => { M = await Module(); M.setup(); })();

self.onmessage = async (ev) => {
  const { id, params } = ev.data;
  try {
    await ready;
    const t0 = performance.now();
    const res = build(M, params);
    const ms = performance.now() - t0;
    builds++;
    const transfer = [];
    for (const p of [...res.parts, ...res.preview]) transfer.push(p.positions.buffer, p.indices.buffer);
    self.postMessage({ id, ok: true, res, ms, builds }, transfer);
  } catch (e) {
    self.postMessage({ id, ok: false, error: String(e && e.stack || e) });
  }
};
