// Náhodné kombinace parametrů – hledá pády a nevalidní sítě.
import { build, DEFAULTS } from '../js/geometry.js';
const [,, manPath, N = 60] = process.argv;
const Module = (await import(manPath)).default;
let M = await Module(); M.setup();
let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const R = (a, b) => a + (b - a) * rnd();
let bad = 0;
for (let i = 0; i < +N; i++) {
  const P = {
    kouleD: pick([90, 100, 120, 140, 160]), svickaH: R(15, 40), stromky: pick([0, 1, 2]),
    rezim: pick(['vcelku', 'zvlast']), natoceni: R(-180, 180), velikost: R(50, 100), celyVOkne: rnd() > 0.3,
    delka: R(4, 30), hloubka: R(3, 14), vyskaSten: R(2, 7), sokl: R(0, 1),
    strechaTyp: pick(['sedlova', 'polovalba', 'valba', 'mansarda', 'pultova']), sklon: R(10, 65),
    krytina: pick(['tasky', 'plech', 'hladka']), presahOkap: R(0, 1.2), presahStit: R(0, 1),
    polovalbaPodil: R(0.1, 0.7), mansardaZlom: R(0.8, 3.5), mansardaSpodniSklon: R(55, 80),
    roubeni: pick(['zadne', 'vodorovne', 'svisle', 'usek']), obloukyPredni: pick([0, 0, 2, 3, 5]), obloukyUsek: R(0.2, 1),
    obloukyStrana: pick(['vlevo', 'vpravo']), obloukyStit: pick([0, 2, 3]), stitObklad: pick(['zadny', 'svisle', 'vodorovne', 'supiny']),
    ramyOken: rnd() > 0.5, oknaTyp: pick(['blana', 'otvor']), oknoS: R(0.6, 1.8), oknoV: R(0.6, 1.8), parapet: R(0.5, 1.2),
    predniOkna: Math.floor(R(0, 7)), zadniOkna: Math.floor(R(0, 6)), levyOkna: Math.floor(R(0, 3)), pravyOkna: Math.floor(R(0, 3)),
    stitOkna: Math.floor(R(0, 4)), stitOknaVyska: R(0, 0.6), dvereStrana: pick(['predni', 'zadni', 'levy', 'pravy', 'zadne']), dvereX: rnd(),
    vikyre: pick([0, 1, 2]), vikyrStrana: pick(['predni', 'zadni']), vikyrS: R(1.5, 8), vikyrV: R(0.8, 2), vikyrOkna: Math.floor(R(1, 5)), vikyrOdsazeni: R(0.3, 2), vikyrPozice: rnd(),
    stresniOkna: Math.floor(R(0, 4)), stresniOknaStrana: pick(['predni', 'zadni']), komin: pick([0, 1, 2]), kominPozice: R(0.1, 0.9),
    p1Strana: pick(['zadny', 'predni', 'zadni', 'levy', 'pravy']), p1Typ: pick(['otevreny', 'uzavreny']), p1Hloubka: R(1, 4), p1Sirka: R(0.2, 1.1), p1Pozice: rnd(), p1Napojeni: R(2, 3.5), p1Okraj: R(1.5, 2.8), p1Sloupky: Math.floor(R(2, 6)), p1Zabradli: rnd() > 0.5,
    p2Strana: pick(['zadny', 'zadny', 'levy', 'pravy']), p2Typ: pick(['otevreny', 'uzavreny']),
    mezistriska: pick(['zadna', 'predni', 'stity', 'predni+stity', 'vse']), mezistriskaVyska: R(2, 4),
  };
  if (i % 10 === 9) { M = await Module(); M.setup(); } // WASM paměť roste – nová instance
  if (process.env.TRACE) console.log('case', i, JSON.stringify(P));
  try {
    const t0 = performance.now();
    const r = build(M, P);
    const ms = performance.now() - t0;
    const st = r.parts.map(p => p.status + '/' + p.indices.length / 3);
    const ok = r.parts.every(p => p.status === 'NoError' && p.indices.length > 100);
    if (process.env.TRACE) console.log('  ms', ms.toFixed(0), 'heap', (process.memoryUsage().rss/1e6).toFixed(0));
    if (!ok || ms > 4000) { bad++; console.log('BAD', i, ms.toFixed(0), st, JSON.stringify(P)); }
  } catch (e) { bad++; console.log('EXC', i, e.message, JSON.stringify(P)); }
}
console.log('hotovo, problémů:', bad);
