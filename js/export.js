// Export do 3MF (doporučeno pro Bambu Studio) a STL.
import { zipSync, strToU8 } from '../vendor/fflate.js';

const fmt = v => (Math.round(v * 10000) / 10000).toString();

function objectXml(id, name, part, dx, dy) {
  const p = part.positions, ix = part.indices;
  const v = [], t = [];
  for (let i = 0; i < p.length; i += 3) v.push(`<vertex x="${fmt(p[i] + dx)}" y="${fmt(p[i + 1] + dy)}" z="${fmt(p[i + 2])}"/>`);
  for (let i = 0; i < ix.length; i += 3) t.push(`<triangle v1="${ix[i]}" v2="${ix[i + 1]}" v3="${ix[i + 2]}"/>`);
  return `<object id="${id}" name="${name}" type="model"><mesh><vertices>${v.join('')}</vertices><triangles>${t.join('')}</triangles></mesh></object>`;
}

// parts: [{name, positions, indices, separate}], bedCenter: střed podložky [mm]
export function make3MF(parts, { bedCenter = [128, 128], title = 'Chalupa v kouli' } = {}) {
  // díly vedle sebe podél X, aby se nepřekrývaly
  let objs = '', items = '';
  let xCursor = 0;
  const boxes = parts.map(p => {
    let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity, mnz = Infinity;
    for (let i = 0; i < p.positions.length; i += 3) {
      mnx = Math.min(mnx, p.positions[i]); mxx = Math.max(mxx, p.positions[i]);
      mny = Math.min(mny, p.positions[i + 1]); mxy = Math.max(mxy, p.positions[i + 1]);
      mnz = Math.min(mnz, p.positions[i + 2]);
    }
    return { mnx, mxx, mny, mxy, mnz };
  });
  const totalW = boxes.reduce((a, b) => a + (b.mxx - b.mnx), 0) + 10 * (parts.length - 1);
  xCursor = bedCenter[0] - totalW / 2;
  parts.forEach((part, i) => {
    const b = boxes[i];
    const dx = xCursor - b.mnx;
    const dy = bedCenter[1] - (b.mny + b.mxy) / 2;
    xCursor += (b.mxx - b.mnx) + 10;
    const id = i + 1;
    // posun Z na podložku
    const shifted = { positions: part.positions, indices: part.indices };
    if (Math.abs(b.mnz) > 1e-4) {
      const q = new Float32Array(part.positions);
      for (let k = 2; k < q.length; k += 3) q[k] -= b.mnz;
      shifted.positions = q;
    }
    objs += objectXml(id, part.name, shifted, dx, dy);
    items += `<item objectid="${id}" printable="1"/>`;
  });
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="cs-CZ" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Title">${title}</metadata>
<metadata name="Application">chalupa-v-kouli</metadata>
<resources>${objs}</resources>
<build>${items}</build>
</model>`;
  const files = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`),
    '3D/3dmodel.model': strToU8(model),
  };
  return zipSync(files, { level: 6 });
}

export function makeSTL(part) {
  const p = part.positions, ix = part.indices;
  const n = ix.length / 3;
  const buf = new ArrayBuffer(84 + n * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, n, true);
  let o = 84;
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true); o += 12;
    for (const q of [a, b, c]) { dv.setFloat32(o, p[q], true); dv.setFloat32(o + 4, p[q + 1], true); dv.setFloat32(o + 8, p[q + 2], true); o += 12; }
    o += 2;
  }
  return new Uint8Array(buf);
}

export function download(data, filename, mime = 'application/octet-stream') {
  const blob = new Blob([data], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
