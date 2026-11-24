// Chalupa v kouli – geometrické jádro
// Vše v milimetrech, osa Z nahoru (tisková orientace), okno koule míří do -Y.
// Rozměry domu se zadávají v metrech (skutečný dům) a přepočítávají se měřítkem s [mm/m].
//
// build(M, P) → { parts:[{name, positions, indices}], info, warnings }
//   M … inicializovaný modul manifold-3d (po M.setup())
//   P … parametry (viz DEFAULTS)

export const DEFAULTS = {
  // --- koule ---
  kouleD: 90,           // vnější průměr koule [mm] (celková výška ≈ 1,12 × průměr)
  kouleStena: 2.4,      // tloušťka stěny koule [mm]
  svickaD: 42,          // průměr otvoru na svíčku [mm]
  svickaH: 28,          // výška válcové části otvoru na svíčku [mm]
  dutyPodstavec: true,  // uzavřená dutina v podstavci (méně filamentu)
  rezim: 'vcelku',      // 'vcelku' | 'zvlast' (domek jako samostatný díl)
  rezOdstup: 50,        // řez koulí: vzdálenost roviny řezu od středu koule [% poloměru] (menší = větší otvor)
  rezSklon: 20,         // řez koulí: sklon roviny od svislice [°] (nahoře dál dozadu)
  stromky: 2,           // 0–2
  stromkyVelikost: 100, // % z maxima, které se vejde
  stromkyStrana: 'obe', // pro 1 stromek: 'vlevo' | 'vpravo'

  // --- umístění domu ---
  natoceni: 0,          // [°] otočení domu kolem svislé osy (0 = okapová strana do okna)
  velikost: 100,        // % z maximálního měřítka, které se vejde
  celyVOkne: true,      // dům musí být celý vidět oknem
  posunY: 0,            // [mm] posun domu dozadu (+) / dopředu (−)

  // --- dům: základ [m] ---
  delka: 14,
  hloubka: 8,
  vyskaSten: 3.2,       // výška okapu nad terénem
  sokl: 0.4,

  // --- střecha ---
  strechaTyp: 'sedlova', // sedlova | polovalba | valba | mansarda | pultova
  sklon: 45,
  krytina: 'tasky',     // hladka | tasky (řady) | kosoctverce (eternit/břidlice) | plech (svislé drážky)
  presahOkap: 0.4,
  presahStit: 0.3,
  polovalbaPodil: 0.35,
  mansardaSpodniSklon: 70,
  mansardaZlom: 2.2,    // výška zlomu nad okapem [m]

  // --- stěny ---
  roubeni: 'zadne',     // zadne | vodorovne | svisle | usek (jen úsek s oblouky)
  obloukyPredni: 0,     // počet podstávkových oblouků na přední straně
  obloukyUsek: 0.5,     // podíl délky přední strany s oblouky
  obloukyStrana: 'vlevo',
  obloukyStit: 0,       // oblouky na štítové stěně na stejné straně
  stitObklad: 'zadny',  // zadny | svisle | vodorovne | supiny
  ramyOken: true,
  oknaTyp: 'blana',     // blana (prosvítí) | otvor

  // --- skladba stěn zleva doprava při pohledu zvenku ---
  // O = okno, D = dveře, B = podstávkový oblouk s oknem, A = oblouk bez okna, - = mezera; číslo opakuje (3O = O O O)
  // Prázdné pole = starý způsob (počty oken níže).
  predniSkladba: 'O O D O',
  zadniSkladba: 'O O',
  levySkladba: 'O O',
  pravySkladba: 'O O',

  // --- okna a dveře [m] ---
  oknoS: 1.1, oknoV: 1.3, parapet: 0.9,
  predniOkna: 3, predniPozice: '',
  zadniOkna: 2, zadniPozice: '',
  levyOkna: 2, levyPozice: '',
  pravyOkna: 2, pravyPozice: '',
  stitOkna: 2,          // okna ve štítu (nad okapem), na každém štítu
  stitOknaVyska: 0.3,   // poloha řady ve štítu (0 = okap, 1 = hřeben)
  stitOknaStrana: 'oba',// oba | levy | pravy
  dvereStrana: 'predni',// predni | zadni | levy | pravy | zadne
  dvereX: 0.6,          // poloha na stěně (0–1)
  dvereS: 1.0, dvereV: 2.1,

  // --- vikýře, střešní okna, komíny ---
  vikyre: 0, vikyrStrana: 'predni', vikyrS: 4.0, vikyrV: 1.2, vikyrOkna: 3,
  vikyrOdsazeni: 0.8, vikyrPozice: 0.5,
  stresniOkna: 0, stresniOknaStrana: 'predni',
  komin: 1, kominPozice: 0.7, kominVyska: 0.8,

  // --- přístřešky (2 sloty) ---
  p1Strana: 'zadny', p1Typ: 'otevreny', p1Hloubka: 2.5, p1Sirka: 0.6, p1Pozice: 0.5,
  p1Napojeni: 2.8, p1Okraj: 2.3, p1Sloupky: 3, p1Zabradli: false,
  p2Strana: 'zadny', p2Typ: 'uzavreny', p2Hloubka: 2.0, p2Sirka: 0.6, p2Pozice: 0.5,
  p2Napojeni: 2.5, p2Okraj: 2.0, p2Sloupky: 2, p2Zabradli: false,

  // --- mezistříška (podlomenice) ---
  mezistriska: 'zadna', // zadna | predni | stity | predni+stity | vse
  mezistriskaVyska: 2.8, mezistriskaHloubka: 0.5,
};

// konstanty tisku [mm]
const T_WALL = 1.2;      // stěna domu
const T_MEMB = 0.6;      // blána okna (prosvítí)
const T_ROOF = 1.2;      // kolmá tloušťka střechy
const RELIEF = 0.45;     // vystouplé rámy / oblouky
const GROOVE_D = 0.3;    // hloubka drážek
const GROOVE_W = 0.4;    // šířka drážek

const rad = d => d * Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- správa paměti WASM
function makeTracker(M) {
  const list = [];
  const { Manifold, CrossSection } = M;
  const wrapS = (obj, names) => {
    const orig = {};
    for (const n of names) { orig[n] = obj[n]; obj[n] = (...a) => { const r = orig[n].apply(obj, a); list.push(r); return r; }; }
    return () => { for (const n of names) obj[n] = orig[n]; };
  };
  const wrapP = (proto, names) => {
    const orig = {};
    for (const n of names) { orig[n] = proto[n]; proto[n] = function (...a) { const r = orig[n].apply(this, a); list.push(r); return r; }; }
    return () => { for (const n of names) proto[n] = orig[n]; };
  };
  const restores = [
    wrapS(Manifold, ['cube', 'cylinder', 'sphere', 'extrude', 'revolve', 'union', 'difference', 'intersection', 'hull', 'compose', 'ofMesh']),
    wrapP(Manifold.prototype, ['add', 'subtract', 'intersect', 'transform', 'translate', 'rotate', 'scale', 'mirror', 'trimByPlane', 'hull', 'simplify', 'asOriginal']),
    wrapS(CrossSection, ['square', 'circle', 'union', 'difference', 'intersection', 'hull', 'ofPolygons']),
    wrapP(CrossSection.prototype, ['add', 'subtract', 'intersect', 'translate', 'rotate', 'scale', 'mirror', 'offset', 'hull', 'simplify', 'extrude', 'revolve']),
  ];
  return {
    cs(polys, fill = 'NonZero') { const c = new CrossSection(polys, fill); list.push(c); return c; },
    done() {
      restores.forEach(r => r());
      for (const o of list) { try { if (Array.isArray(o)) o.forEach(x => x.delete()); else o.delete(); } catch (e) { /* už smazáno */ } }
      list.length = 0;
    },
  };
}

function meshOf(man) {
  const m = man.getMesh();
  const np = m.numProp;
  const nv = m.vertProperties.length / np;
  const positions = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) {
    positions[i * 3] = m.vertProperties[i * np];
    positions[i * 3 + 1] = m.vertProperties[i * np + 1];
    positions[i * 3 + 2] = m.vertProperties[i * np + 2];
  }
  return { positions, indices: new Uint32Array(m.triVerts) };
}

// ---------------------------------------------------------------- střecha: obálky (body pro konvexní obal)
// Vrací body obálky střechy domu o rozměrech L×W s okapem ve výšce he.
// ox/oy = přesah ve směru štítu / okapu (0 = bez přesahu). Roviny střechy zůstávají stejné.
function roofGeom(P, L, W, he) {
  const typ = P.strechaTyp;
  const ta = Math.tan(rad(clamp(P.sklon, 5, 75)));
  const g = { typ, ta, L, W, he };
  if (typ === 'mansarda') {
    const t1 = Math.tan(rad(clamp(P.mansardaSpodniSklon, 50, 85)));
    let hz = Math.max(0.1, P._mansZlom);
    let b = hz / t1;
    if (b > W / 2 * 0.8) { b = W / 2 * 0.8; hz = b * t1; }
    g.t1 = t1; g.b = b; g.hb = he + hz; g.hr = g.hb + (W / 2 - b) * ta;
  } else if (typ === 'pultova') {
    g.hr = he + W * ta;
  } else if (typ === 'valba') {
    g.hr = he + Math.min(L, W) / 2 * ta;
  } else {
    g.hr = he + W / 2 * ta;
  }
  if (typ === 'polovalba') {
    g.f = clamp(P.polovalbaPodil, 0.1, 0.8);
    g.hk = g.hr - g.f * W / 2 * ta;
  }
  return g;
}

// výška vnějšího povrchu střechy (bez přesahu) nad bodem y v příčném řezu u štítu
function profileZ(g, y) {
  const { typ, ta, W, he } = g;
  const ay = Math.abs(y);
  switch (typ) {
    case 'pultova': return he + (y + W / 2) * ta;
    case 'mansarda': {
      if (ay >= W / 2 - g.b) return he + (W / 2 - ay) * g.t1;
      return g.hb + (W / 2 - g.b - ay) * ta;
    }
    case 'polovalba': return Math.min(he + (W / 2 - ay) * ta, g.hk);
    case 'valba': return he;
    default: return he + (W / 2 - ay) * ta;
  }
}

// výška povrchu přední střešní plochy (y<0), uprostřed délky domu
function frontRoofZ(g, y) {
  const { typ, ta, W, he } = g;
  if (typ === 'pultova') return he + (y + W / 2) * ta;
  if (typ === 'mansarda') {
    const ay = Math.abs(y);
    if (ay >= W / 2 - g.b) return he + (W / 2 - ay) * g.t1;
    return g.hb + (W / 2 - g.b - ay) * ta;
  }
  if (typ === 'valba') return he + Math.min(W / 2 - Math.abs(y), Math.min(g.L, W) / 2) * ta;
  return he + (W / 2 - Math.abs(y)) * ta;
}

// body konvexní obálky; e = přesah okapu, gx = přesah štítu (u valby se použije e)
function envPoints(g, e = 0, gx = 0) {
  const { typ, ta, L, W, he, hr } = g;
  const pts = [];
  const sym = (x, y, z) => { pts.push([x, y, z], [-x, y, z], [x, -y, z], [-x, -y, z]); };
  if (typ === 'sedlova') {
    sym(L / 2 + gx, W / 2 + e, he - e * ta);
    pts.push([L / 2 + gx, 0, hr], [-L / 2 - gx, 0, hr]);
  } else if (typ === 'valba') {
    sym(L / 2 + e, W / 2 + e, he - e * ta);
    if (L >= W) pts.push([(L - W) / 2, 0, hr], [-(L - W) / 2, 0, hr]);
    else pts.push([0, (W - L) / 2, hr], [0, -(W - L) / 2, hr]);
  } else if (typ === 'polovalba') {
    const f = g.f;
    sym(L / 2 + gx, W / 2 + e, he - e * ta);
    const yk = f * W / 2 + gx;
    sym(L / 2 + gx, yk, hr - yk * ta);
    const xr = Math.max(0.01, L / 2 - f * W / 2);
    pts.push([xr, 0, hr], [-xr, 0, hr]);
  } else if (typ === 'mansarda') {
    sym(L / 2 + gx, W / 2 + e, he - e * g.t1);
    sym(L / 2 + gx, W / 2 - g.b, g.hb);
    pts.push([L / 2 + gx, 0, g.hr], [-L / 2 - gx, 0, g.hr]);
  } else if (typ === 'pultova') {
    const x = L / 2 + gx;
    for (const sx of [x, -x]) {
      pts.push([sx, -W / 2 - e, he - e * ta]);
      pts.push([sx, W / 2 + e, he + (W + e) * ta]);
      pts.push([sx, W / 2 + e, he - e * ta]);
    }
  }
  return pts;
}

// lomové body štítu (y-souřadnice) pro polygon štítu
function gableBreaks(g) {
  const { typ, W } = g;
  if (typ === 'valba') return null;
  if (typ === 'pultova') return [-W / 2, W / 2];
  if (typ === 'polovalba') return [-W / 2, -g.f * W / 2, g.f * W / 2, W / 2];
  if (typ === 'mansarda') return [-W / 2, -(W / 2 - g.b), 0, W / 2 - g.b, W / 2];
  return [-W / 2, 0, W / 2];
}

// ---------------------------------------------------------------- fasády
function facades(L, W) {
  return {
    predni: { o: [-L / 2, -W / 2, 0], u: [1, 0, 0], w: [0, -1, 0], len: L, gable: false },
    zadni: { o: [L / 2, W / 2, 0], u: [-1, 0, 0], w: [0, 1, 0], len: L, gable: false },
    levy: { o: [-L / 2, W / 2, 0], u: [0, -1, 0], w: [-1, 0, 0], len: W, gable: true, yOf: u => W / 2 - u },
    pravy: { o: [L / 2, -W / 2, 0], u: [0, 1, 0], w: [1, 0, 0], len: W, gable: true, yOf: u => u - W / 2 },
  };
}
const fMat = f => [f.u[0], f.u[1], f.u[2], 0, 0, 0, 1, 0, f.w[0], f.w[1], f.w[2], 0, f.o[0], f.o[1], f.o[2], 1];
const fPoint = (f, u, z, w) => [f.o[0] + u * f.u[0] + w * f.w[0], f.o[1] + u * f.u[1] + w * f.w[1], f.o[2] + z];
function onFacade(f, cs, w0, w1) {
  return cs.extrude(w1 - w0).translate([0, 0, w0]).transform(fMat(f));
}
const rectPoly = (u0, z0, u1, z1) => [[u0, z0], [u1, z0], [u1, z1], [u0, z1]];

// ---------------------------------------------------------------- skladba stěny
// „2O D 3O“ → ['O','O','D','O','O','O']; povolené znaky O D B A -
export function parseSkladba(str) {
  if (str == null) return null;
  const out = [];
  let num = '';
  for (const ch of String(str).toUpperCase()) {
    if (ch >= '0' && ch <= '9') { num += ch; continue; }
    const t = ch === '_' ? '-' : ch;
    if ('ODBA-'.includes(t)) {
      const k = Math.min(Math.max(parseInt(num || '1', 10), 0), 20);
      for (let i = 0; i < k; i++) out.push(t);
    }
    num = '';
  }
  return out.length ? out.slice(0, 30) : null;
}

// ---------------------------------------------------------------- rozmístění oken
function parsePositions(str, s) {
  if (!str || !String(str).trim()) return null;
  const v = String(str).split(/[;,\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => isFinite(x));
  return v.length ? v.map(x => x * s) : null;
}

// rovnoměrně n oken do intervalů [[a,b],...] (vrací středy), šířka okna ww, okraj m
function distribute(intervals, n, ww, m) {
  n = Math.round(n);
  const iv = intervals.filter(([a, b]) => b - a >= ww + 2 * m - 1e-6);
  if (!n || !iv.length) return [];
  const lens = iv.map(([a, b]) => b - a), tot = lens.reduce((x, y) => x + y, 0);
  // počty oken do intervalů (největší zbytky), max podle kapacity
  const cap = lens.map(l => Math.max(1, Math.floor((l - 2 * m + ww * 0.4) / (ww * 1.4))));
  const raw = lens.map(l => n * l / tot);
  const cnt = raw.map((r, i) => Math.min(cap[i], Math.floor(r)));
  let left = n - cnt.reduce((x, y) => x + y, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((x, y) => y[0] - x[0]);
  for (let pass = 0; pass < 3 && left > 0; pass++) {
    for (const [, i] of order) if (left > 0 && cnt[i] < cap[i]) { cnt[i]++; left--; }
  }
  const out = [];
  iv.forEach(([a, b], i) => {
    const k = cnt[i];
    for (let j = 0; j < k; j++) {
      const x = a + (b - a) * (j + 0.5) / k;
      out.push(clamp(x, a + m + ww / 2, b - m - ww / 2));
    }
  });
  return out.sort((x, y) => x - y);
}

// ---------------------------------------------------------------- strom
function tree(M, trk, H) {
  // tři patra; spodní stojí přímo na sněhu, spodky vyšších pater pod 45° (tisk bez podpěr)
  const rb = 0.36 * H;
  const tiers = [[0.0, 1.0, 0.56], [0.27, 0.8, 0.47], [0.5, 0.58, 0.4]]; // [z0, r, výška]
  let t = null;
  let prev = null;
  for (const [z0f, rf, hf] of tiers) {
    const r = rf * rb, z0 = z0f * H, ht = hf * H;
    let r0 = 0.0;
    if (prev) r0 = Math.max(0.3, prev.r * (1 - (z0 - prev.z0) / prev.h) - 0.2);
    const zb = z0 + Math.max(r - r0, 0);
    const pts = r0 > 0 ? [[0, z0], [r0, z0], [r, zb], [0, zb + ht]] : [[0, z0], [r, z0], [0, z0 + ht]];
    const part = trk.cs([pts]).revolve(40);
    t = t ? t.add(part) : part;
    prev = { r, z0: zb, h: ht };
  }
  return t;
}

// ---------------------------------------------------------------- hlavní sestavení
export function computeLayout(P) {
  const D = P.kouleD, R = D / 2;
  const ts = P.kouleStena, Rin = R - ts;
  const hb = 0.24 * D;
  const zc = hb + 0.38 * D;
  const zf = zc - 0.40 * R;                 // horní plocha podlahy (sníh)
  const rFloor = Math.sqrt(Rin * Rin - (zc - zf) ** 2);
  // řez rovinou: normála n míří dozadu, nahoře se rovina sklání dozadu o úhel a
  const a = rad(clamp(P.rezSklon, 0, 40));
  const dc = clamp(P.rezOdstup, 10, 85) / 100 * R;   // střed koule je o dc za rovinou
  const n = [0, Math.cos(a), -Math.sin(a)];
  const up = [0, Math.sin(a), Math.cos(a)];          // směr „nahoru“ v rovině řezu
  const pd = n[2] * zc - dc;                         // rovina: n·p = pd
  const oc = [0, -dc * n[1], zc - dc * n[2]];        // střed otvoru
  const rw = Math.sqrt(Math.max(Rin * Rin - dc * dc, 1)); // poloměr otvoru (vnitřní hrana)
  const cut = {
    n, up, pd, oc, rw, a,
    dist: (x, y, z) => n[1] * y + n[2] * z - pd,      // > 0 = za rovinou (zůstává)
    // poloha bodu v rovině otvoru (x vodorovně, u nahoru od středu otvoru)
    proj: (x, y, z) => [x, (y - oc[1]) * up[1] + (z - oc[2]) * up[2]],
  };
  return { D, R, ts, Rin, hb, zc, zf, zw: oc[2], rw, rFloor, cut, rb0: 0.41 * D, rb1: 0.395 * D };
}

// klíčové body domu v metrech (lokální souřadnice domu) – pro výpočet měřítka
function houseKeyPoints(P) {
  const L = P.delka, W = P.hloubka, He = P.vyskaSten;
  const g = roofGeom(P, L, W, He);
  const e = P.presahOkap, gx = P.presahStit;
  const pts = envPoints(g, e, gx).map(p => p.slice());
  pts.push([L / 2, W / 2, 0], [-L / 2, W / 2, 0], [L / 2, -W / 2, 0], [-L / 2, -W / 2, 0]);
  const F = facades(L, W);
  for (const k of ['p1', 'p2']) {
    const st = P[k + 'Strana'];
    if (!F[st]) continue;
    const f = F[st];
    const wdt = clamp(P[k + 'Sirka'], 0.05, 1.2) * f.len;
    const uc = clamp(P[k + 'Pozice'], 0, 1) * f.len;
    const d = P[k + 'Hloubka'];
    for (const u of [uc - wdt / 2 - 0.2, uc + wdt / 2 + 0.2]) {
      pts.push(fPoint(f, u, P[k + 'Okraj'] + 0.15, d + 0.2), fPoint(f, u, 0, d + 0.2), fPoint(f, u, P[k + 'Napojeni'] + 0.15, 0));
    }
  }
  if (P.komin > 0) {
    for (let i = 0; i < P.komin; i++) {
      const x = kominX(P, i, L);
      pts.push([x, 0, g.hr + P.kominVyska]);
    }
  }
  return { pts, g };
}

function kominX(P, i, L) {
  const p = P.komin === 1 ? P.kominPozice : (i === 0 ? 1 - P.kominPozice : P.kominPozice);
  return (clamp(p, 0.1, 0.9) - 0.5) * L;
}

function fitScale(P, Lay) {
  const { pts } = houseKeyPoints(P);
  const th = rad(P.natoceni), c = Math.cos(th), sn = Math.sin(th);
  const lim = (Lay.Rin - 2.5) ** 2;
  // se stromky necháme kolem domu volné místo
  const fpLim = (P.stromky > 0 ? Lay.rFloor * 0.8 : Lay.rFloor - 2) ** 2;
  const ok = s => {
    for (const [x, y, z] of pts) {
      const X = (x * c - y * sn) * s, Y = (x * sn + y * c) * s + P.posunY, Z = z * s + Lay.zf;
      if (X * X + Y * Y + (Z - Lay.zc) ** 2 > lim) return false;
      if (z <= P.vyskaSten + 0.01 && X * X + Y * Y > fpLim) return false;
      if (Lay.cut.dist(X, Y, Z) < 2) return false;                 // dům nesmí přečnívat z řezu
      if (P.stromky > 0 && Math.abs(X) > (Lay.rw - 1.5) * 0.72) return false; // místo pro stromky po stranách
      if (P.celyVOkne) {
        const rr = Lay.rw - 1.5;
        const [px, pu] = Lay.cut.proj(X, Y, Z);
        if (pu >= 0 ? px * px + pu * pu > rr * rr : Math.abs(px) > rr * 0.95) return false;
      }
    }
    return true;
  };
  let lo = 0.2, hi = 30;
  if (!ok(lo)) return lo;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  return lo;
}

export function build(M, Pin) {
  const P = { ...DEFAULTS, ...Pin };
  const trk = makeTracker(M);
  const warnings = [];
  try {
    const { Manifold, CrossSection } = M;
    const Lay = computeLayout(P);
    const { R, Rin, hb, zc, zf, rw, cut } = Lay;
    const segs = 160;

    // --- měřítko domu
    P._mansZlom = P.mansardaZlom;
    const sMax = fitScale(P, Lay);
    const s = sMax * clamp(P.velikost, 20, 100) / 100;

    // --- DŮM (lokálně, mm)
    const H = buildHouse(M, trk, P, s, warnings);

    // umístit do koule
    const placeHouse = m => m.rotate([0, 0, P.natoceni]).translate([0, P.posunY, zf - 0.3]);
    let house = placeHouse(H.solid);

    // --- KOULE
    const prof = trk.cs([[[0, 0], [Lay.rb0 - 0.8, 0], [Lay.rb0, 0.8], [Lay.rb1, hb - 2.5], [Lay.rb1 - 0.7, hb - 0.7], [Lay.rb1 - 2.5, hb], [0, hb]]]);
    let shell = prof.revolve(segs).add(Manifold.sphere(R, segs).translate([0, 0, zc]));
    const cavity = Manifold.sphere(Rin, segs).translate([0, 0, zc]).trimByPlane([0, 0, 1], zf);
    shell = shell.subtract(cavity);
    // šikmý řez rovinou (jen nad podstavcem)
    {
      const B = 4 * R, { n, up, oc } = cut;
      const pts = [];
      for (const sx of [-B, B]) for (const su of [-B, B]) for (const sn of [0.02, -B]) {
        pts.push([sx, oc[1] + su * up[1] + sn * n[1], oc[2] + su * up[2] + sn * n[2]]);
      }
      const cutter = Manifold.hull(pts).trimByPlane([0, 0, 1], hb + 0.4);
      shell = shell.subtract(cutter);
    }

    // svíčka: válec + nálevka + světlovod do domu
    const rs = P.svickaD / 2;
    const zs = clamp(P.svickaH, 8, zf - 6);
    const cand = Manifold.cylinder(zs + 1, rs, rs, 96).translate([0, 0, -1]);
    // světlovod = vnitřní půdorys domu (zmenšený) ∩ kruh svíčky
    const inner2d = trk.cs([rectPoly(-H.L / 2 + T_WALL + 0.6, -H.W / 2 + T_WALL + 0.6, H.L / 2 - T_WALL - 0.6, H.W / 2 - T_WALL - 0.6)])
      .rotate(P.natoceni).translate([0, P.posunY]);
    const lightSec = inner2d.intersect(CrossSection.circle(rs, 96));
    let lightTop = null;
    if (lightSec.area() > 4) {
      const zTop = zf - 1.1; // nálevka končí pod spodkem domku, dál rovná šachta do vnitřku domku
      const thin = Manifold.cylinder(0.01, rs, rs, 96).translate([0, 0, zs]);
      const funnel = Manifold.hull([thin, lightSec.extrude(3.0).translate([0, 0, zTop])]); // konvexní: kruh → šachta
      shell = shell.subtract(cand.add(funnel));
      // kontrola sklonu nálevky
      const b = lightSec.bounds();
      const reach = Math.max(rs - Math.min(Math.abs(b.min[0]), Math.abs(b.max[0]), Math.abs(b.min[1]), Math.abs(b.max[1])), 0);
      if (reach > (zf - 1.1 - zs) * 1.25) warnings.push('Strop otvoru na svíčku je plošší než 45° – zvaž menší výšku svíčky nebo větší kouli.');
    } else {
      shell = shell.subtract(cand);
      warnings.push('Domek je příliš malý na světlovod – světlo se do domku nedostane.');
    }

    // úspora materiálu: uzavřená dutina v podstavci (strop pod 45°, tiskne se bez podpěr)
    if (P.dutyPodstavec !== false) {
      const wall = 2.4, a = rs + wall, z0 = 1.2;
      const zTop = zf - wall;
      const baseR = z => z <= 0.8 ? Lay.rb0 - 0.8 + z : (z <= hb - 2.5 ? Lay.rb0 + (Lay.rb1 - Lay.rb0) * (z - 0.8) / (hb - 3.3) : (z <= hb ? Lay.rb1 - 2.5 : -1));
      const sphR = z => { const d = z - zc; return Math.abs(d) < R ? Math.sqrt(R * R - d * d) : -1; };
      const dz = 0.5, zs_ = [], rs_ = [];
      for (let z = z0; z <= zTop + 1e-6; z += dz) { zs_.push(z); rs_.push(Math.max(baseR(z), sphR(z)) - wall); }
      for (let i = rs_.length - 1; i >= 0; i--) {
        rs_[i] = Math.min(rs_[i], a + (zTop - zs_[i]));            // střecha dutiny pod 45°
        if (i < rs_.length - 1) rs_[i] = Math.min(rs_[i], rs_[i + 1] + dz); // převis nejvýš 45°
      }
      const poly = [[a, z0]];
      for (let i = 0; i < rs_.length; i++) if (rs_[i] > a + 0.6) poly.push([rs_[i], zs_[i]]); else { poly.push([a + 0.6, zs_[i]]); break; }
      poly.push([a, poly[poly.length - 1][1]]);
      if (poly.length > 4) {
        const voidM = trk.cs([poly]).revolve(96).trimByPlane(cut.n, cut.pd + wall);
        shell = shell.subtract(voidM);
      }
    }

    // --- stromky
    const trees = placeTrees(M, trk, P, Lay, H, s);
    for (const t of trees.solids) shell = shell.add(t);
    if (trees.warning) warnings.push(trees.warning);

    // --- díly
    const parts = [];
    if (P.rezim === 'zvlast') {
      // zahloubení pro domek 0,6 mm
      const fp = trk.cs([rectPoly(-H.L / 2 - 0.4 - 0.2, -H.W / 2 - 0.4 - 0.2, H.L / 2 + 0.4 + 0.2, H.W / 2 + 0.4 + 0.2)])
        .rotate(P.natoceni).translate([0, P.posunY]);
      shell = shell.subtract(fp.extrude(1.6).translate([0, 0, zf - 0.6]));
      const hz = house.translate([0, 0, -0.3]);
      parts.push({ name: 'koule', man: shell });
      parts.push({ name: 'domek', man: hz, separate: true });
      // projde oknem? (průmět do roviny okna, otočení libovolné kolem osy y nelze – kontrola obdélníku)
      const bb = H.solid.boundingBox();
      const dx = bb.max[0] - bb.min[0], dy = bb.max[1] - bb.min[1], dz = bb.max[2] - bb.min[2];
      const minW = Math.min(dx, dy);
      if (Math.hypot(minW, dz) > 2 * rw - 2) warnings.push('Samostatný domek možná neprojde oknem koule – vkládej ho šikmo, případně tiskni vcelku.');
    } else {
      parts.push({ name: 'chalupa_v_kouli', man: shell.add(house) });
    }

    const out = parts.map(p => {
      const st = p.man.status();
      return { name: p.name, separate: !!p.separate, ...meshOf(p.man), volume: p.man.volume(), genus: p.man.genus(), status: String(st && st.value !== undefined ? st.value : st) };
    });

    const preview = [
      { name: 'koule', ...meshOf(P.rezim === 'zvlast' ? parts[0].man : shell) },
      { name: 'domek', ...meshOf(P.rezim === 'zvlast' ? parts[1].man : house) },
    ];
    const bbH = H.solid.boundingBox();
    const info = {
      meritko: s,                       // mm na metr
      pomer: Math.round(1000 / s),      // 1 : x
      domekMm: [bbH.max[0] - bbH.min[0], bbH.max[1] - bbH.min[1], bbH.max[2] - bbH.min[2]],
      kouleMm: [Lay.rb0 * 2, Lay.rb0 * 2, zc + R],
      oknoD: rw * 2,
      podlahaD: Lay.rFloor * 2,
      stromky: trees.heights,
      oknoMm: [P.oknoS * s, P.oknoV * s],
      layout: { ...Lay, cut: { n: Lay.cut.n, pd: Lay.cut.pd, oc: Lay.cut.oc, a: Lay.cut.a } },
    };
    if (P.oknoS * s < 2.5 || P.oknoV * s < 2.5) warnings.push('Okna vycházejí menší než 2,5 mm – budou špatně vidět. Zmenši dům (rozměry) nebo zvětši kouli.');
    return { parts: out, preview, info, warnings };
  } finally {
    trk.done();
  }
}

// ---------------------------------------------------------------- stromky
function placeTrees(M, trk, P, Lay, H, s) {
  const n = clamp(Math.round(P.stromky), 0, 2);
  const res = { solids: [], heights: [] };
  if (!n) return res;
  const { zf, zc, Rin } = Lay;
  const th = rad(P.natoceni), c = Math.cos(th), sn = Math.sin(th);
  // obdélník domu (s přesahy) v rovině podlahy
  const hx = H.ext[0], hy = H.ext[1];
  // kolize: stěny domu (s odstupem podle velikosti stromku) a přesahy (jen kmen)
  const insideHouse = (x, y, rb) => {
    const lx = x * c + (y - P.posunY) * sn, ly = -x * sn + (y - P.posunY) * c;
    if (Math.abs(lx) < H.L / 2 + rb * 0.8 + 1 && Math.abs(ly) < H.W / 2 + rb * 0.8 + 1) return true;
    return Math.abs(lx - H.extC[0]) < hx + 1.5 && Math.abs(ly - H.extC[1]) < hy + 1.5;
  };
  const maxH = (x, y, r) => {
    // nejvyšší strom, jehož kužel se vejde pod kopuli (s rezervou 3 mm)
    let best = 0;
    for (let Ht = 8; Ht < 120; Ht += 0.5) {
      const rb = 0.36 * Ht;
      const rr = Math.hypot(x, y);
      // kontrolní body: okraj spodního patra a špička
      const chk = [[rr + rb, zf + 1], [rr, zf + Ht * 1.02], [rr + 0.8 * rb, zf + 0.37 * Ht], [rr + 0.58 * rb, zf + 0.62 * Ht]];
      if (chk.every(([q, z]) => q * q + (z - zc) ** 2 < (Rin - 3) ** 2)
        && Lay.cut.dist(x, y - rb, zf + 1) > 2 && Lay.cut.dist(x, y, zf + Ht) > 2) best = Ht; else break;
    }
    return best;
  };
  const sides = n === 2 ? [-1, 1] : [P.stromkyStrana === 'vpravo' ? 1 : -1];
  const hxg = Math.abs(c) * (H.L / 2) + Math.abs(sn) * (H.W / 2);
  const houseH = H.height;
  for (const sd of sides) {
    let best = null;
    for (let x = 0; x <= Lay.rFloor; x += 1) {
      for (let y = -Lay.rFloor; y <= Lay.rFloor; y += 1) {
        const X = sd * x;
        const Ht = Math.min(maxH(X, y), houseH * 1.0);
        if (Ht < 10) continue;
        const rb = 0.36 * Ht;
        if (Math.hypot(X, y) + rb > Lay.rFloor - 2) continue;
        if (insideHouse(X, y, rb)) continue;
        // preferujeme místo za domem, těsně vedle něj a vyšší strom
        const behind = y - P.posunY;
        if (behind < 3) continue; // stromky jen za domem
        // ideálně těsně za rohem domu, aby z okna vykukovaly do strany
        const score = Ht * 0.7 + behind * 0.15 - Math.abs(x - hxg * 0.92) * 0.9;
        if (!best || score > best.score) best = { X, y, Ht, score };
      }
    }
    if (!best) { res.warning = 'Na stromek nezbylo místo.'; continue; }
    const Ht = best.Ht * clamp(P.stromkyVelikost, 30, 100) / 100;
    res.solids.push(tree(M, trk, Ht).translate([best.X, best.y, zf - 0.2]));
    res.heights.push(Ht);
  }
  return res;
}

// ---------------------------------------------------------------- DŮM
function buildHouse(M, trk, P, s, warnings) {
  const { Manifold, CrossSection } = M;
  const L = P.delka * s, W = P.hloubka * s, He = P.vyskaSten * s;
  const hs = clamp(P.sokl * s, 0, He * 0.4);
  P._mansZlom = P.mansardaZlom * s;
  const g = roofGeom(P, L, W, He);
  const e = P.presahOkap * s, gx = P.presahStit * s;
  const ta = g.ta;
  const cosMin = P.strechaTyp === 'mansarda' ? Math.cos(Math.atan(g.t1)) : Math.cos(Math.atan(ta));
  const tv = T_ROOF / cosMin;               // svislá tloušťka střechy
  const t = T_WALL;
  const F = facades(L, W);

  // 1) tělo
  let body = Manifold.cube([L, W, He]).translate([-L / 2, -W / 2, 0]).add(Manifold.hull(envPoints(g, 0, 0)));
  // 2) střešní deska
  const envO = envPoints(g, e, gx);
  const zMin = Math.min(...envO.map(p => p[2]));
  const fascia = envO.filter(p => Math.abs(p[2] - zMin) < 1e-6).map(p => [p[0], p[1], p[2] - tv]);
  const envHull = Manifold.hull([...envO, ...fascia]);
  const slab = envHull.subtract(envHull.translate([0, 0, -tv]));
  // 3) sokl
  const sokl = hs > 0.3 ? Manifold.cube([L + 0.8, W + 0.8, hs]).translate([-L / 2 - 0.4, -W / 2 - 0.4, 0]) : null;
  let solid = body.add(slab);
  if (sokl) solid = solid.add(sokl);
  // krytina: drážky ve vnější vrstvě střechy
  if (P.krytina === 'tasky' || P.krytina === 'plech' || P.krytina === 'kosoctverce') {
    const dv = 0.38 / cosMin;
    const bb = envHull.boundingBox();
    const cx = (bb.max[0] + bb.min[0]) / 2, cy = (bb.max[1] + bb.min[1]) / 2;
    const grow = Manifold.hull([envHull, envHull.translate([0, 0, 3])]); // jen nahoru, ne do stran
    const band = grow.subtract(envHull.translate([0, 0, -dv]));
    const lines = [];
    if (P.krytina === 'tasky') {
      const along = Math.max(0.38 * s, 1.35);
      const sinA = Math.sin(Math.atan(ta));
      const dz = along * Math.max(sinA, 0.25);
      for (let z = bb.max[2] - dz * 0.6 + 0.0137; z > zMin + dz * 0.3; z -= dz) {
        lines.push(Manifold.cube([bb.max[0] - bb.min[0] + 2, bb.max[1] - bb.min[1] + 2, 0.38]).translate([bb.min[0] - 1, bb.min[1] - 1, z - 0.19]));
      }
    } else if (P.krytina === 'kosoctverce') {
      // dvě řady šikmých drážek → kosočtverce ve střešní rovině
      const cosT = Math.cos(Math.atan(P.strechaTyp === 'mansarda' ? Math.tan(rad(P.sklon)) : ta));
      const phi = Math.atan(cosT);
      const sp = Math.max(0.45 * s, 1.7) * Math.sin(phi) * 1.35;
      const big = Math.hypot(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1]) + 4;
      const hz = bb.max[2] - bb.min[2] + 4;
      for (const sg of [1, -1]) {
        const fam = [];
        const ang = sg * phi * 180 / Math.PI;
        const px = -Math.sin(sg * phi), py = Math.cos(sg * phi);
        for (let k = -Math.ceil(big / sp / 2); k <= Math.ceil(big / sp / 2); k++) {
          const off = k * sp * (sg > 0 ? 1 : 1.0071) + 0.0131 * sg;
          fam.push(Manifold.cube([big, 0.4, hz]).translate([-big / 2, -0.2, bb.min[2] - 2]).rotate([0, 0, ang])
            .translate([cx + 0.0917 + px * off, cy + 0.1731 + py * off, 0]));
        }
        // druhá řada o kousek mělčí, aby se dna drážek nepřekrývala ve stejné rovině
        const bandF = sg > 0 ? band : grow.subtract(envHull.translate([0, 0, -dv * 0.8]));
        solid = solid.subtract(Manifold.compose(fam).intersect(bandF)); // rovnoběžné drážky se nepřekrývají → compose
      }
    } else {
      const sp = Math.max(0.5 * s, 1.6);
      for (let x = 0.0131; x < (bb.max[0] - bb.min[0]) / 2; x += sp) for (const sx of [x, -x]) {
        lines.push(Manifold.cube([0.4, bb.max[1] - bb.min[1] + 2, bb.max[2] - bb.min[2] + 2]).translate([sx - 0.2, bb.min[1] - 1, bb.min[2] - 1]));
      }
    }
    if (lines.length) solid = solid.subtract(Manifold.compose(lines).intersect(band));
  }

  // vnitřek
  const gi = roofGeom({ ...P, _mansZlom: P._mansZlom }, L - 2 * t, W - 2 * t, He + t * (P.strechaTyp === 'mansarda' ? g.t1 : ta));
  if (P.strechaTyp === 'mansarda') { gi.hb = g.hb + t * ta; gi.hr = gi.hb + (gi.W / 2 - gi.b) * ta; }
  const hollow = L - 2 * t > 2 && W - 2 * t > 2;
  if (!hollow) warnings.push('Domek je moc úzký na dutý vnitřek – bude plný a nebude prosvítat.');
  const inner = hollow ? Manifold.cube([L - 2 * t, W - 2 * t, He + 2]).translate([-L / 2 + t, -W / 2 + t, -1])
    .add(Manifold.hull(envPoints(gi, 0, 0))).translate([0, 0, -tv]) : null;
  // vikýře
  const dormers = buildDormers(M, trk, P, g, s, L, W, tv, warnings);
  for (const d of dormers.outer) solid = solid.add(d);
  // komíny
  for (let i = 0; i < P.komin; i++) {
    const x = kominX(P, i, L / s) * s;
    const cw = Math.max(0.6 * s, 2.0), cd = Math.max(0.6 * s, 2.0);
    const top = g.hr + P.kominVyska * s;
    const yOff = P.strechaTyp === 'pultova' ? W / 4 : 0;
    const zb = Math.min(frontRoofZ(g, yOff - cd / 2), frontRoofZ(g, yOff + cd / 2), g.hr - 1) - 3;
    if (top - zb < 1) continue;
    let ch = Manifold.cube([cw, cd, top - zb]).translate([x - cw / 2, yOff - cd / 2, zb]);
    ch = ch.add(Manifold.cube([cw + 0.8, cd + 0.8, 0.8]).translate([x - cw / 2 - 0.4, yOff - cd / 2 - 0.4, top - 0.8]));
    solid = solid.add(ch);
  }

  if (inner) solid = solid.subtract(inner);
  for (const d of dormers.inner) solid = solid.subtract(d);

  // 4) fasády – okna, dveře, oblouky, drážky
  const winS = P.oknoS * s, winV = P.oknoV * s, sill = P.parapet * s;
  const zTopWall = He - tv - 0.5;            // nejvyšší místo pro prvky na okapové stěně
  const items = { predni: [], zadni: [], levy: [], pravy: [] };
  const archZones = { predni: null, zadni: null, levy: null, pravy: null };
  const logZones = { predni: [], zadni: [], levy: [], pravy: [] };
  const m = Math.max(0.35 * s, 1.0);         // okraj od rohu

  // podstávkové oblouky
  const nA = Math.round(P.obloukyPredni);
  const archSide = P.obloukyStrana === 'vpravo' ? 'pravy' : 'levy';
  const seqs = {};
  for (const k of Object.keys(F)) seqs[k] = parseSkladba(P[k + 'Skladba']);
  if (nA > 0 && !seqs.predni) {
    const us = clamp(P.obloukyUsek, 0.15, 1) * L;
    archZones.predni = P.obloukyStrana === 'vpravo' ? [L - us, L, nA] : [0, us, nA];
  }
  if (Math.round(P.obloukyStit) > 0 && !seqs[archSide]) archZones[archSide] = [0, W, Math.round(P.obloukyStit)];
  // oblouky na štítu: na levém štítu je "vlevo" u přední strany na konci u = W (y=-W/2)… pro jednoduchost celá šířka

  // drážky roubení – zóny
  for (const k of Object.keys(F)) {
    if (P.roubeni === 'vodorovne' || P.roubeni === 'svisle') logZones[k].push([0, F[k].len]);
    else if (P.roubeni === 'usek' && archZones[k]) logZones[k].push([archZones[k][0], archZones[k][1]]);
  }

  // dveře
  const doorFace = F[P.dvereStrana] && !seqs[P.dvereStrana] ? P.dvereStrana : null;
  const doorW = P.dvereS * s, doorH = Math.min(P.dvereV * s, zTopWall - hs - 0.5);
  let door = null;
  if (doorFace) {
    const len = F[doorFace].len;
    const uc = clamp(P.dvereX * len, m + doorW / 2, len - m - doorW / 2);
    door = { u: uc, w: doorW, z0: hs + 0.17, h: doorH - 0.17 };
  }

  const pillar = Math.max(0.35 * s, 1.0);
  const archInfo = {};
  for (const k of Object.keys(F)) {
    const f = F[k];
    const wTop = zTopWall;
    const sillZ = Math.max(sill, hs + 0.6);
    const hWin = Math.min(winV, wTop - sillZ - 0.6);
    const list = items[k];
    const az = archZones[k];
    archInfo[k] = [];
    const seq = seqs[k];
    if (seq) {
      const WT = { O: 1, D: 1, B: 1.7, A: 1.7, '-': 0.7 };
      const tot = seq.reduce((acc, t) => acc + WT[t], 0);
      const m0 = Math.max(0.15 * s, 0.6);
      const unit = (f.len - 2 * m0) / tot;
      const bays = [];
      let u = m0;
      for (const t of seq) { const w = WT[t] * unit; bays.push({ t, a: u, b: u + w }); u += w; }
      const gap = Math.max(0.3 * s, 0.8);
      // oblouky – souvislé skupiny B/A
      for (let i = 0; i < bays.length;) {
        if (bays[i].t !== 'B' && bays[i].t !== 'A') { i++; continue; }
        let j = i;
        while (j + 1 < bays.length && (bays[j + 1].t === 'B' || bays[j + 1].t === 'A')) j++;
        const grp = bays.slice(i, j + 1);
        const a0 = i === 0 ? 0 : grp[0].a, a1 = j === bays.length - 1 ? f.len : grp[grp.length - 1].b;
        const zTopA = wTop - 0.2, z0 = hs + Math.max(0.2 * s, 0.6);
        const r = Math.min((grp[0].b - grp[0].a - pillar) / 2, (zTopA - z0) * 0.45);
        if (r > 0.8) {
          const zSpring = zTopA - Math.max(0.15 * s, 0.8) - r;
          const centers = grp.map(bb => (bb.a + bb.b) / 2);
          archInfo[k].push({ a0, a1, centers, r, zSpring, zTopA, z0 });
          if (P.roubeni === 'usek') logZones[k].push([a0, a1]);
          const ww = Math.min(winS, 2 * r - 2 * Math.max(0.25 * s, 0.8));
          const hh = Math.min(hWin, zSpring + r * 0.5 - sillZ);
          grp.forEach((bb, q) => { if (bb.t === 'B' && ww > 1.5 && hh > 1.5) list.push({ u: centers[q], w: ww, z0: sillZ, h: hh, kind: 'okno' }); });
        }
        i = j + 1;
      }
      for (const bb of bays) {
        const uc = (bb.a + bb.b) / 2, bw = bb.b - bb.a - gap;
        if (bb.t === 'O') { const ww = Math.min(winS, bw); if (ww > 1.2 && hWin > 1.5) list.push({ u: uc, w: ww, z0: sillZ, h: hWin, kind: 'okno' }); }
        if (bb.t === 'D') { const dw = Math.min(doorW, bw); if (dw > 1.2) list.push({ u: uc, w: dw, z0: hs + 0.17, h: doorH - 0.17, kind: 'dvere' }); }
      }
    }
    let restIv = [[0, f.len]];
    if (seq) { /* hotovo výše */ } else if (az) {
      const [a0, a1, n] = az;
      restIv = [[0, a0], [a1, f.len]].filter(([a, b]) => b - a > 0.5);
      const span = (a1 - a0) / n;
      const zTopA = wTop - 0.2;
      const openW = span - pillar;
      const r = openW / 2;
      const zSpring = zTopA - Math.max(0.15 * s, 0.8) - r;
      archInfo[k].push({ a0, a1, centers: Array.from({ length: n }, (_, i) => a0 + (i + 0.5) * span), r, zSpring, zTopA, z0: hs + Math.max(0.2 * s, 0.6) });
      const ww = Math.min(winS, openW - 2 * Math.max(0.25 * s, 0.8));
      for (let i = 0; i < n; i++) {
        const uc = a0 + (i + 0.5) * span;
        if (door && door.u > a0 + i * span && door.u < a0 + (i + 1) * span && doorFace === k) continue;
        const hh = Math.min(hWin, zSpring + r * 0.5 - sillZ);
        if (ww > 1.5 && hh > 1.5) list.push({ u: uc, w: ww, z0: sillZ, h: hh, kind: 'okno' });
      }
    }
    // dveře
    let ivs = restIv;
    if (!seq && door && doorFace === k) {
      list.push({ ...door, kind: 'dvere' });
      const gap = Math.max(0.4 * s, 1.0);
      ivs = [];
      for (const [a, b] of restIv) {
        const d0 = door.u - door.w / 2 - gap, d1 = door.u + door.w / 2 + gap;
        if (d1 <= a || d0 >= b) ivs.push([a, b]);
        else { if (d0 > a) ivs.push([a, d0]); if (d1 < b) ivs.push([d1, b]); }
      }
    }
    const cnt = { predni: P.predniOkna, zadni: P.zadniOkna, levy: P.levyOkna, pravy: P.pravyOkna }[k];
    const posStr = { predni: P.predniPozice, zadni: P.zadniPozice, levy: P.levyPozice, pravy: P.pravyPozice }[k];
    const manual = parsePositions(posStr, s);
    const centers = seq ? [] : manual ? manual : distribute(ivs, Math.round(cnt), winS, m);
    if (hWin > 1.5) for (const uc of centers) list.push({ u: uc, w: winS, z0: sillZ, h: hWin, kind: 'okno' });

    // okna ve štítu
    const showGableWins = f.gable && (P.stitOknaStrana === 'oba' || (P.stitOknaStrana === 'levy' && k === 'levy') || (P.stitOknaStrana === 'pravy' && k === 'pravy'));
    if (showGableWins && P.stitOkna > 0 && gableBreaks(g)) {
      const topAt = u => profileZ(g, f.yOf(u)) - tv - 0.6;
      const gh = Math.max(...gableBreaks(g).map(y => profileZ(g, y))) - He;
      const zc0 = He + clamp(P.stitOknaVyska, 0, 0.9) * gh + 0.4;
      const n = Math.round(P.stitOkna);
      let ww = winS * 0.9, hh = winV * 0.85;
      for (let tries = 0; tries < 14; tries++) {
        const gapG = Math.max(ww * 0.7, 1.0);
        const cs = [];
        for (let i = 0; i < n; i++) cs.push(f.len / 2 + (i - (n - 1) / 2) * (ww + gapG));
        const okAll = cs.every(uc => Math.min(topAt(uc - ww / 2), topAt(uc + ww / 2)) >= zc0 + hh);
        if (okAll) { cs.forEach(uc => list.push({ u: uc, w: ww, z0: zc0, h: hh, kind: 'okno' })); break; }
        ww *= 0.9; hh *= 0.9;
        if (ww < 1.6) break;
      }
    }
  }

  // drážky (2D na fasádu)
  const gw = GROOVE_W, sp = Math.max(0.3 * s, 1.15);
  let cutters = [];
  for (const k of Object.keys(F)) {
    const f = F[k];
    const zTop = f.gable ? He - (P.strechaTyp === 'valba' ? tv + 0.5 : 0.3) : zTopWall;
    const rects = [];
    for (const [a, b] of logZones[k]) {
      if (P.roubeni === 'svisle') {
        for (let u = a + sp / 2 + 0.0123; u < b - 0.3; u += sp) rects.push(rectPoly(u - gw / 2, hs + 0.4, u + gw / 2, zTop));
      } else {
        for (let z = hs + sp + 0.0123; z < zTop - 0.3; z += sp) rects.push(rectPoly(a + 0.47, z - gw / 2, b - 0.47, z + gw / 2));
      }
    }
    // obklad štítu
    if (f.gable && P.stitObklad !== 'zadny' && gableBreaks(g)) {
      const poly = [[0, He]];
      for (const y of gableBreaks(g)) {
        // u ← y
        const u = k === 'levy' ? W / 2 - y : y + W / 2;
        poly.push([u, profileZ(g, y)]);
      }
      poly.push([W, He]);
      poly.sort((A, B) => A[0] - B[0]);
      const region = trk.cs([[[0, He], ...poly.filter(p => p[1] > He + 1e-6), [W, He]]]).offset(-(tv + 0.4), 'Miter');
      const gr = [];
      const top = g.hr + 2;
      if (P.stitObklad === 'svisle') for (let u = sp / 2; u < W; u += sp) gr.push(rectPoly(u - gw / 2, He, u + gw / 2, top));
      else if (P.stitObklad === 'vodorovne') for (let z = He + sp * 0.7; z < top; z += sp) gr.push(rectPoly(0, z - gw / 2, W, z + gw / 2));
      else if (P.stitObklad === 'supiny') {
        const sp2 = sp * 1.15, len = W + (top - He) * 2;
        for (let d = -len; d < len; d += sp2) {
          gr.push([[d - gw / 2, He], [d + gw / 2, He], [d + gw / 2 + (top - He), top], [d - gw / 2 + (top - He), top]]);
          gr.push([[d - gw / 2, He], [d + gw / 2, He], [d + gw / 2 - (top - He), top], [d - gw / 2 - (top - He), top]]);
        }
      }
      if (gr.length && region.area() > 1) {
        let gcs = trk.cs(gr);
        gcs = CrossSection.union([gcs]).intersect(region);
        // nezasahovat do oken
        const winCs = items[k].length ? trk.cs(items[k].map(it => rectPoly(it.u - it.w / 2 - 0.8, it.z0 - 0.8, it.u + it.w / 2 + 0.8, it.z0 + it.h + 0.8))) : null;
        if (winCs) gcs = gcs.subtract(winCs);
        if (gcs.area() > 0.01) cutters.push(onFacade(f, gcs, -GROOVE_D, 0.25));
      }
    }
    if (rects.length) {
      let rcs = trk.cs(rects);
      cutters.push(onFacade(f, rcs, -GROOVE_D, 0.25));
    }
  }
  if (cutters.length) solid = solid.subtract(Manifold.union(cutters));

  // reliéfy: oblouky + rámy oken + rámy dveří
  const reliefs = [];
  for (const k of Object.keys(F)) {
    const f = F[k];
    const polys = [];
    let archCs = null;
    for (const ai of archInfo[k]) {
      const frame = trk.cs([rectPoly(ai.a0 + 0.05, ai.z0, ai.a1 - 0.05, ai.zTopA)]);
      const holes = [];
      for (const uc of ai.centers) {
        holes.push(trk.cs([rectPoly(uc - ai.r, ai.z0 - 1, uc + ai.r, ai.zSpring)]));
        holes.push(CrossSection.circle(ai.r, 48).translate([uc, ai.zSpring]));
      }
      const one = frame.subtract(CrossSection.union(holes));
      archCs = archCs ? archCs.add(one) : one;
    }
    const fw = Math.max(0.12 * s, 0.5);
    for (const it of items[k]) {
      if (it.kind === 'okno' && !P.ramyOken) continue;
      const outer = rectPoly(it.u - it.w / 2 - fw, it.z0 - fw, it.u + it.w / 2 + fw, it.z0 + it.h + fw);
      polys.push(trk.cs([outer]).subtract(trk.cs([rectPoly(it.u - it.w / 2, it.z0, it.u + it.w / 2, it.z0 + it.h)])));
    }
    let all = archCs;
    if (polys.length) all = all ? all.add(CrossSection.union(polys)) : CrossSection.union(polys);
    if (all && all.area() > 0.01) reliefs.push(onFacade(f, all, -0.1, RELIEF));
  }
  if (reliefs.length) solid = solid.add(Manifold.union(reliefs));

  // otvory oken a dveří
  const pockets = [];
  const bar = 0.55;
  const winDepth = P.oknaTyp === 'otvor' ? t + 0.6 : t - T_MEMB;
  for (const k of Object.keys(F)) {
    const f = F[k];
    const wins = [], doors = [];
    for (const it of items[k]) {
      let c = trk.cs([rectPoly(it.u - it.w / 2, it.z0, it.u + it.w / 2, it.z0 + it.h)]);
      if (it.kind === 'okno') {
        if (it.w > 3.2 && it.h > 3.2) {
          c = c.subtract(trk.cs([rectPoly(it.u - bar / 2, it.z0 - 1, it.u + bar / 2, it.z0 + it.h + 1)]));
          const zb = it.z0 + it.h * 0.62;
          c = c.subtract(trk.cs([rectPoly(it.u - it.w, zb - bar / 2, it.u + it.w, zb + bar / 2)]));
        }
        wins.push(c);
      } else doors.push(c);
    }
    if (wins.length) pockets.push(onFacade(f, CrossSection.union(wins), -winDepth, 1.5));
    if (doors.length) pockets.push(onFacade(f, CrossSection.union(doors), -0.45, 1.5));
  }
  for (const p of dormers.pockets) pockets.push(p);
  if (pockets.length) solid = solid.subtract(Manifold.union(pockets));

  // střešní okna
  const nS = Math.round(P.stresniOkna);
  if (nS > 0 && P.strechaTyp !== 'mansarda') {
    const sw = Math.max(0.8 * s, 2.2), sh = Math.max(1.0 * s, 2.6);
    const back = P.stresniOknaStrana === 'zadni';
    const xs = [];
    // vyhnout se vikýřům
    const occ = dormers.xRanges.filter(r => r.back === back);
    const span = (P.strechaTyp === 'valba' ? Math.max(L - W, L * 0.3) : L) * 0.8;
    for (let i = 0; i < nS; i++) {
      let x = -span / 2 + span * (i + 0.5) / nS;
      for (const r of occ) if (x > r.x0 - sw && x < r.x1 + sw) x = (x < (r.x0 + r.x1) / 2 ? r.x0 - sw : r.x1 + sw);
      xs.push(x);
    }
    const yPos = -W / 2 + W * 0.25;
    const ang = Math.atan(ta) * 180 / Math.PI;
    for (const x of xs) {
      if (Math.abs(x) > L / 2 - sw) continue;
      let sk = Manifold.cube([sw, sh, 1.4]).translate([-sw / 2, -sh / 2, -0.7]).rotate([ang, 0, 0]).translate([x, yPos, frontRoofZ(g, yPos)]);
      if (back) sk = sk.mirror([0, 1, 0]);
      if (P.strechaTyp !== 'pultova' || !back) solid = solid.add(sk);
    }
  }

  // mezistříška
  const msides = { zadna: [], predni: ['predni'], stity: ['levy', 'pravy'], 'predni+stity': ['predni', 'levy', 'pravy'], vse: ['predni', 'zadni', 'levy', 'pravy'] }[P.mezistriska] || [];
  const extras = [];
  for (const k of msides) {
    const f = F[k];
    const zm = P.mezistriskaVyska * s, d = Math.max(P.mezistriskaHloubka * s, 1.5);
    extras.push(leanTo(Manifold, f, -d, f.len + d, zm, zm - d * Math.tan(rad(25)), d, 1.0));
  }
  // přístřešky
  for (const pk of ['p1', 'p2']) {
    const k = P[pk + 'Strana'];
    if (!F[k]) continue;
    const f = F[k];
    const wdt = clamp(P[pk + 'Sirka'], 0.05, 1.2) * f.len;
    const uc = clamp(P[pk + 'Pozice'], 0, 1) * f.len;
    const u0 = uc - wdt / 2, u1 = uc + wdt / 2;
    const d = P[pk + 'Hloubka'] * s;
    const za = P[pk + 'Napojeni'] * s, zl = P[pk + 'Okraj'] * s;
    const tr = 1.0;
    extras.push(leanTo(Manifold, f, u0 - 0.8, u1 + 0.8, za, zl, d + 0.8, tr));
    if (P[pk + 'Typ'] === 'uzavreny') {
      const pts = [];
      for (const u of [u0, u1]) pts.push(fPoint(f, u, 0, -0.3), fPoint(f, u, 0, d), fPoint(f, u, za - tr * 0.5, -0.3), fPoint(f, u, zl - tr * 0.5, d));
      extras.push(Manifold.hull(pts));
    } else {
      const ps = Math.max(0.2 * s, 1.4);
      const n = Math.max(2, Math.round(P[pk + 'Sloupky']));
      for (let i = 0; i < n; i++) {
        const u = u0 + ps / 2 + (wdt - ps) * i / (n - 1);
        const pts = [];
        for (const du of [-ps / 2, ps / 2]) for (const dw of [d - ps, d]) { pts.push(fPoint(f, u + du, 0, dw), fPoint(f, u + du, zl + 0.2, dw)); }
        extras.push(Manifold.hull(pts));
      }
      if (P[pk + 'Zabradli']) {
        const zr = Math.min(0.95 * s, zl - 2);
        const bh = 0.7;
        const rail = (ua, wa, ub, wb) => {
          const pts = [];
          for (const [uu, ww] of [[ua, wa], [ub, wb]]) for (const dz of [0, bh]) for (const dd of [-0.35, 0.35]) {
            const isAlongU = Math.abs(wa - wb) < 1e-6;
            pts.push(isAlongU ? fPoint(f, uu, zr + dz, ww + dd) : fPoint(f, uu + dd, zr + dz, ww));
          }
          return Manifold.hull(pts);
        };
        extras.push(rail(u0 + ps / 2, d - ps / 2, u1 - ps / 2, d - ps / 2));
        extras.push(rail(u0 + ps / 2, 0, u0 + ps / 2, d - ps / 2));
        extras.push(rail(u1 - ps / 2, 0, u1 - ps / 2, d - ps / 2));
      }
    }
  }
  if (extras.length) solid = solid.add(Manifold.union(extras));

  solid = solid.trimByPlane([0, 0, 1], 0);
  const bb = solid.boundingBox();
  // obdélník půdorysu (pro stromky)
  const ext = [(bb.max[0] - bb.min[0]) / 2, (bb.max[1] - bb.min[1]) / 2];
  const extC = [(bb.max[0] + bb.min[0]) / 2, (bb.max[1] + bb.min[1]) / 2];
  return { solid, L, W, He, ext, extC, height: bb.max[2] };
}

// šikmá stříška na fasádě: od napojení (výška za, u stěny) k okraji (výška zl, ve vzdálenosti d)
function leanTo(Manifold, f, u0, u1, za, zl, d, tr) {
  const pts = [];
  for (const u of [u0, u1]) {
    pts.push(fPoint(f, u, za, -0.4), fPoint(f, u, za + tr, -0.4));
    pts.push(fPoint(f, u, zl, d), fPoint(f, u, zl + tr, d));
  }
  return Manifold.hull(pts);
}

// ---------------------------------------------------------------- vikýře (ležaté, s pultovou stříškou)
function buildDormers(M, trk, P, g, s, L, W, tv, warnings) {
  const { Manifold, CrossSection } = M;
  const res = { outer: [], inner: [], pockets: [], xRanges: [] };
  const n = Math.round(P.vikyre);
  if (!n || P.strechaTyp === 'pultova' && P.vikyrStrana === 'zadni') return res;
  const t = T_WALL;
  const wd = Math.min(P.vikyrS * s, (P.strechaTyp === 'valba' ? Math.max(L - W, L * 0.3) : L) / n - 2);
  if (wd < 4) { warnings.push('Vikýř se na střechu nevejde.'); return res; }
  const sb = Math.max(P.vikyrOdsazeni * s, t + 0.8);
  const yf = -W / 2 + sb;
  const zb = frontRoofZ(g, yf);
  let hd = P.vikyrV * s;
  const tg = Math.tan(rad(10));
  // průsečík stříšky s hlavní střechou
  const yTop = P.strechaTyp === 'pultova' ? W / 2 - 0.5 : -0.3;
  const zRidge = frontRoofZ(g, yTop);
  if (zb + hd > zRidge - 1) hd = Math.max(2, zRidge - 1 - zb);
  const zt = zb + hd;
  const fRoof = y => frontRoofZ(g, y) - (zt + (y - yf) * tg);
  let a = yf, b = yTop;
  if (fRoof(b) < 0) { b = yTop; } else {
    for (let i = 0; i < 50; i++) { const mid = (a + b) / 2; if (fRoof(mid) < 0) a = mid; else b = mid; }
  }
  const yi = b, zi = zt + (yi - yf) * tg;
  const trd = 1.0, ov = 0.7;
  const positions = n === 1 ? [P.vikyrPozice] : [1 - P.vikyrPozice, P.vikyrPozice].sort();
  const back = P.vikyrStrana === 'zadni';
  for (const pos of positions) {
    const xc = (clamp(pos, 0, 1) - 0.5) * (L - wd - 4);
    const x0 = xc - wd / 2, x1 = xc + wd / 2;
    const zlow = zb - 3;
    let outer = Manifold.hull([[x0, yf, zlow], [x1, yf, zlow], [x0, yf, zt], [x1, yf, zt], [x0, yi, zi], [x1, yi, zi], [x0, yi + 0.5, zlow], [x1, yi + 0.5, zlow]]);
    const roof = Manifold.hull([
      [x0 - ov, yf - ov, zt - ov * tg], [x1 + ov, yf - ov, zt - ov * tg], [x0 - ov, yi + 1, zi + tg],
      [x1 + ov, yi + 1, zi + tg], [x0 - ov, yf - ov, zt - ov * tg + trd], [x1 + ov, yf - ov, zt - ov * tg + trd],
      [x0 - ov, yi + 1, zi + tg + trd], [x1 + ov, yi + 1, zi + tg + trd]]);
    outer = outer.add(roof);
    const yIn0 = Math.max(yf + t, -W / 2 + t + 0.3);
    let inner = Manifold.hull([[x0 + t, yIn0, zlow - 12], [x1 - t, yIn0, zlow - 12], [x0 + t, yIn0, zt - 0.6], [x1 - t, yIn0, zt - 0.6],
      [x0 + t, yi - 1, zi - 1.2], [x1 - t, yi - 1, zi - 1.2], [x0 + t, yi - 1, zlow - 12], [x1 - t, yi - 1, zlow - 12]]);
    // okna ve vikýři
    const k = Math.max(1, Math.round(P.vikyrOkna));
    const fDorm = { o: [-L / 2, yf, 0], u: [1, 0, 0], w: [0, -1, 0] };
    const hh = Math.max(1.5, hd - 1.8);
    const gap = Math.max(0.15 * s, 0.6);
    const ww = Math.max(1.5, (wd - 2 * t - gap * (k - 1)) / k);
    const wins = [];
    for (let i = 0; i < k; i++) {
      const u = x0 + t + i * (ww + gap) + L / 2;
      wins.push(rectPoly(u, zb + 0.8, u + ww, zb + 0.8 + hh));
    }
    let pocket = onFacade(fDorm, trk.cs(wins), -(t - T_MEMB), 1.5);
    if (back) { outer = outer.mirror([0, 1, 0]); inner = inner.mirror([0, 1, 0]); pocket = pocket.mirror([0, 1, 0]); }
    res.outer.push(outer); res.inner.push(inner); res.pockets.push(pocket);
    res.xRanges.push({ x0, x1, back });
  }
  return res;
}
