import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { toCreasedNormals } from '../vendor/three/BufferGeometryUtils.js';
import { DEFAULTS } from './geometry.js';
import { PRESETS } from './presets.js';
import { make3MF, makeSTL, download } from './export.js';

// ------------------------------------------------------------------ formulář
const SIDES = [['predni', 'přední (okapová)'], ['zadni', 'zadní'], ['levy', 'levý štít'], ['pravy', 'pravý štít']];
const isGableRoof = P => P.strechaTyp !== 'valba';
const SCHEMA = [
  { t: 'Dům – základní rozměry', open: true, f: [
    { k: 'delka', l: 'Délka (okapová strana) [m]', t: 'num', min: 3, max: 40, step: 0.1 },
    { k: 'hloubka', l: 'Hloubka (štít) [m]', t: 'num', min: 2.5, max: 20, step: 0.1 },
    { k: 'vyskaSten', l: 'Výška stěn po okap [m]', t: 'num', min: 1.5, max: 10, step: 0.1 },
    { k: 'sokl', l: 'Sokl [m]', t: 'num', min: 0, max: 1.5, step: 0.05 },
    { k: 'natoceni', l: 'Natočení domu [°]', t: 'range', min: -180, max: 180, step: 1, full: true },
    { k: 'velikost', l: 'Velikost domu v kouli [%]', t: 'range', min: 40, max: 100, step: 1, full: true },
    { k: 'posunY', l: 'Posun dozadu / dopředu [mm]', t: 'range', min: -20, max: 20, step: 0.5, full: true },
    { k: 'celyVOkne', l: 'Celý dům musí být vidět oknem', t: 'chk', full: true },
  ] },
  { t: 'Střecha', open: true, f: [
    { k: 'strechaTyp', l: 'Typ střechy', t: 'sel', opts: [['sedlova', 'sedlová'], ['polovalba', 'polovalbová'], ['valba', 'valbová'], ['mansarda', 'mansardová'], ['pultova', 'pultová']], full: true },
    { k: 'sklon', l: 'Sklon [°]', t: 'num', min: 5, max: 75, step: 1 },
    { k: 'polovalbaPodil', l: 'Podíl polovalby', t: 'num', min: 0.1, max: 0.8, step: 0.05, show: P => P.strechaTyp === 'polovalba' },
    { k: 'mansardaSpodniSklon', l: 'Spodní sklon mansardy [°]', t: 'num', min: 50, max: 85, step: 1, show: P => P.strechaTyp === 'mansarda' },
    { k: 'mansardaZlom', l: 'Výška zlomu nad okapem [m]', t: 'num', min: 0.5, max: 5, step: 0.1, show: P => P.strechaTyp === 'mansarda' },
    { k: 'krytina', l: 'Krytina', t: 'sel', opts: [['kosoctverce', 'kosočtverce (eternit / břidlice)'], ['tasky', 'tašky (vodorovné řady)'], ['plech', 'plech / prkna (svislé drážky)'], ['hladka', 'hladká']], full: true },
    { k: 'presahOkap', l: 'Přesah u okapu [m]', t: 'num', min: 0, max: 2, step: 0.05 },
    { k: 'presahStit', l: 'Přesah u štítu [m]', t: 'num', min: 0, max: 2, step: 0.05, show: isGableRoof },
  ] },
  { t: 'Stěny a štíty', f: [
    { k: 'roubeni', l: 'Povrch stěn', t: 'sel', opts: [['zadne', 'hladké (zděné)'], ['vodorovne', 'roubení – vodorovné drážky'], ['svisle', 'svislá prkna'], ['usek', 'roubení jen u podstávkových oblouků']], full: true },
    { k: 'stitObklad', l: 'Obklad štítu', t: 'sel', opts: [['zadny', 'žádný'], ['svisle', 'svislá prkna'], ['vodorovne', 'vodorovná prkna'], ['supiny', 'šupiny (břidlice/šindel)']], show: isGableRoof },
    { k: 'mezistriska', l: 'Stříška mezi patry', t: 'sel', opts: [['zadna', 'žádná'], ['predni', 'vpředu'], ['stity', 'na štítech'], ['predni+stity', 'vpředu + štíty'], ['vse', 'dokola']] },
    { k: 'mezistriskaVyska', l: 'Výška stříšky [m]', t: 'num', min: 1, max: 8, step: 0.1, show: P => P.mezistriska !== 'zadna' },
    { k: 'mezistriskaHloubka', l: 'Hloubka stříšky [m]', t: 'num', min: 0.2, max: 1.5, step: 0.05, show: P => P.mezistriska !== 'zadna' },
  ] },
  { t: 'Okna a dveře', f: [
    { k: 'oknoS', l: 'Šířka okna [m]', t: 'num', min: 0.4, max: 3, step: 0.05 },
    { k: 'oknoV', l: 'Výška okna [m]', t: 'num', min: 0.4, max: 3, step: 0.05 },
    { k: 'parapet', l: 'Parapet [m]', t: 'num', min: 0.2, max: 2, step: 0.05 },
    { k: 'oknaTyp', l: 'Okna', t: 'sel', opts: [['blana', 'tenká blána – prosvítí'], ['otvor', 'průchozí otvor']] },
    { k: 'ramyOken', l: 'Rámy kolem oken a dveří', t: 'chk', full: true },
    { t: 'note', l: 'Skladba stěny zleva doprava při pohledu zvenku: <b>O</b> okno · <b>D</b> dveře · <b>B</b> podstávkový oblouk s oknem · <b>A</b> oblouk bez okna · <b>–</b> mezera. Číslo opakuje: <b>2O D 3O</b>.' },
    { k: 'predniSkladba', l: 'Přední stěna (okapová)', t: 'seq' },
    { k: 'zadniSkladba', l: 'Zadní stěna', t: 'seq' },
    { k: 'levySkladba', l: 'Levý štít (přízemí)', t: 'seq' },
    { k: 'pravySkladba', l: 'Pravý štít (přízemí)', t: 'seq' },
    { k: 'stitOkna', l: 'Okna ve štítu (podkroví)', t: 'num', min: 0, max: 4, step: 1, show: isGableRoof },
    { k: 'stitOknaVyska', l: 'Výška řady ve štítu (0–1)', t: 'num', min: 0, max: 0.8, step: 0.02, show: P => isGableRoof(P) && P.stitOkna > 0 },
    { k: 'stitOknaStrana', l: 'Štítová okna na', t: 'sel', opts: [['oba', 'obou štítech'], ['levy', 'levém štítu'], ['pravy', 'pravém štítu']], show: P => isGableRoof(P) && P.stitOkna > 0 },
    { k: 'dvereS', l: 'Šířka dveří [m]', t: 'num', min: 0.6, max: 4, step: 0.05 },
    { k: 'dvereV', l: 'Výška dveří [m]', t: 'num', min: 1.5, max: 4, step: 0.05 },
  ] },
  { t: 'Vikýře, střešní okna, komín', f: [
    { k: 'vikyre', l: 'Ležaté vikýře', t: 'num', min: 0, max: 2, step: 1 },
    { k: 'vikyrStrana', l: 'Strana střechy', t: 'sel', opts: [['predni', 'přední'], ['zadni', 'zadní']], show: P => P.vikyre > 0 },
    { k: 'vikyrS', l: 'Šířka vikýře [m]', t: 'num', min: 1, max: 12, step: 0.1, show: P => P.vikyre > 0 },
    { k: 'vikyrV', l: 'Výška čela [m]', t: 'num', min: 0.6, max: 3, step: 0.05, show: P => P.vikyre > 0 },
    { k: 'vikyrOkna', l: 'Okna ve vikýři', t: 'num', min: 1, max: 6, step: 1, show: P => P.vikyre > 0 },
    { k: 'vikyrOdsazeni', l: 'Odsazení od okapu [m]', t: 'num', min: 0.2, max: 4, step: 0.1, show: P => P.vikyre > 0 },
    { k: 'vikyrPozice', l: 'Poloha podél střechy (0–1)', t: 'num', min: 0, max: 1, step: 0.01, show: P => P.vikyre > 0 },
    { k: 'stresniOkna', l: 'Střešní okna', t: 'num', min: 0, max: 6, step: 1 },
    { k: 'stresniOknaStrana', l: 'Na straně', t: 'sel', opts: [['predni', 'přední'], ['zadni', 'zadní']], show: P => P.stresniOkna > 0 },
    { k: 'komin', l: 'Komíny', t: 'num', min: 0, max: 2, step: 1 },
    { k: 'kominPozice', l: 'Poloha komínu (0–1)', t: 'num', min: 0.1, max: 0.9, step: 0.01, show: P => P.komin > 0 },
    { k: 'kominVyska', l: 'Komín nad hřebenem [m]', t: 'num', min: 0.2, max: 3, step: 0.1, show: P => P.komin > 0 },
  ] },
  ...['p1', 'p2'].map((pk, i) => ({ t: `Přístřešek / přístavek ${i + 1}`, f: [
    { k: pk + 'Strana', l: 'Strana', t: 'sel', opts: [['zadny', 'žádný'], ...SIDES] },
    { k: pk + 'Typ', l: 'Typ', t: 'sel', opts: [['otevreny', 'otevřený – sloupky'], ['uzavreny', 'uzavřený přístavek']], show: P => P[pk + 'Strana'] !== 'zadny' },
    { k: pk + 'Hloubka', l: 'Hloubka [m]', t: 'num', min: 0.5, max: 8, step: 0.1, show: P => P[pk + 'Strana'] !== 'zadny' },
    { k: pk + 'Sirka', l: 'Šířka (podíl stěny)', t: 'num', min: 0.05, max: 1.2, step: 0.01, show: P => P[pk + 'Strana'] !== 'zadny' },
    { k: pk + 'Pozice', l: 'Poloha (0–1)', t: 'num', min: 0, max: 1, step: 0.01, show: P => P[pk + 'Strana'] !== 'zadny' },
    { k: pk + 'Napojeni', l: 'Výška u stěny [m]', t: 'num', min: 1, max: 8, step: 0.05, show: P => P[pk + 'Strana'] !== 'zadny' },
    { k: pk + 'Okraj', l: 'Výška na okraji [m]', t: 'num', min: 0.8, max: 8, step: 0.05, show: P => P[pk + 'Strana'] !== 'zadny' },
    { k: pk + 'Sloupky', l: 'Počet sloupků', t: 'num', min: 2, max: 8, step: 1, show: P => P[pk + 'Strana'] !== 'zadny' && P[pk + 'Typ'] === 'otevreny' },
    { k: pk + 'Zabradli', l: 'Zábradlí', t: 'chk', show: P => P[pk + 'Strana'] !== 'zadny' && P[pk + 'Typ'] === 'otevreny' },
  ] })),
  { t: 'Koule, svíčka, stromky', f: [
    { k: 'kouleD', l: 'Průměr koule [mm]', t: 'num', min: 80, max: 180, step: 1 },
    { k: 'kouleStena', l: 'Stěna koule [mm]', t: 'num', min: 1.6, max: 4, step: 0.1 },
    { k: 'rezOdstup', l: 'Řez – odstup od středu [% poloměru] (menší = větší otvor)', t: 'range', min: 20, max: 75, step: 1, full: true },
    { k: 'rezSklon', l: 'Řez – sklon dozadu [°]', t: 'range', min: 0, max: 35, step: 1, full: true },
    { k: 'svickaD', l: 'Otvor na svíčku Ø [mm]', t: 'num', min: 20, max: 60, step: 0.1 },
    { k: 'svickaH', l: 'Výška válcové části [mm]', t: 'num', min: 8, max: 60, step: 0.5 },
    { k: 'dutyPodstavec', l: 'Dutý podstavec (úspora filamentu)', t: 'chk', full: true },
    { k: 'stromky', l: 'Stromky za domem', t: 'num', min: 0, max: 2, step: 1 },
    { k: 'stromkyStrana', l: 'Stromek na straně', t: 'sel', opts: [['vlevo', 'vlevo'], ['vpravo', 'vpravo']], show: P => P.stromky === 1 },
    { k: 'stromkyVelikost', l: 'Velikost stromků [%]', t: 'range', min: 30, max: 100, step: 1, full: true, show: P => P.stromky > 0 },
    { k: 'rezim', l: 'Tisk', t: 'sel', opts: [['vcelku', 'vcelku (jako originál)'], ['zvlast', 'domek zvlášť']], full: true },
  ] },
];

let P = { ...DEFAULTS };
const inputs = {};
const form = document.getElementById('form');

function buildForm() {
  form.innerHTML = '';
  for (const g of SCHEMA) {
    const d = document.createElement('details');
    d.className = 'grp'; if (g.open) d.open = true;
    d.innerHTML = `<summary>${g.t}</summary>`;
    const box = document.createElement('div'); box.className = 'fields';
    for (const f of g.f) {
      if (f.t === 'note') { const nEl = document.createElement('p'); nEl.className = 'hint full'; nEl.innerHTML = f.l; box.appendChild(nEl); continue; }
      const w = document.createElement('label');
      w.className = 'f' + (f.full ? ' full' : '') + (f.t === 'chk' ? ' cb' : '');
      let el;
      if (f.t === 'sel') {
        el = document.createElement('select');
        for (const [v, l] of f.opts) { const o = document.createElement('option'); o.value = v; o.textContent = l; el.appendChild(o); }
        w.append(f.l, el);
      } else if (f.t === 'chk') {
        el = document.createElement('input'); el.type = 'checkbox';
        w.append(el, f.l);
      } else if (f.t === 'seq') {
        w.classList.add('full');
        el = document.createElement('input'); el.type = 'text'; el.placeholder = 'prázdné = bez oken';
        el.className = 'seq';
        const bar = document.createElement('div'); bar.className = 'seqbar';
        const set = v => { el.value = v; onChange(f, v); };
        for (const [lab, tok, tip] of [['+ okno', 'O', 'okno'], ['+ dveře', 'D', 'dveře'], ['+ oblouk', 'B', 'podstávkový oblouk s oknem'], ['+ oblouk prázdný', 'A', 'oblouk bez okna'], ['+ mezera', '-', 'mezera']]) {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = lab; b.title = tip;
          b.onclick = (e) => { e.preventDefault(); set((el.value.trim() + ' ' + tok).trim()); };
          bar.appendChild(b);
        }
        const del = document.createElement('button'); del.type = 'button'; del.textContent = '⌫'; del.title = 'smazat poslední';
        del.onclick = (e) => { e.preventDefault(); const parts = el.value.trim().split(/\s+/); parts.pop(); set(parts.join(' ')); };
        const clr = document.createElement('button'); clr.type = 'button'; clr.textContent = '✕'; clr.title = 'vymazat';
        clr.onclick = (e) => { e.preventDefault(); set(''); };
        bar.append(del, clr);
        w.append(f.l, el, bar);
        el.addEventListener('input', () => onChange(f, el.value));
      } else if (f.t === 'txt') {
        el = document.createElement('input'); el.type = 'text'; el.placeholder = f.ph || '';
        w.append(f.l, el);
      } else if (f.t === 'range') {
        const r = document.createElement('div'); r.className = 'rng';
        el = document.createElement('input'); el.type = 'range';
        const num = document.createElement('input'); num.type = 'number';
        for (const x of [el, num]) { x.min = f.min; x.max = f.max; x.step = f.step; }
        el.addEventListener('input', () => { num.value = el.value; onChange(f, el.value); });
        num.addEventListener('change', () => { el.value = num.value; onChange(f, num.value); });
        el._num = num;
        r.append(el, num); w.append(f.l, r);
      } else {
        el = document.createElement('input'); el.type = 'number'; el.min = f.min; el.max = f.max; el.step = f.step;
        w.append(f.l, el);
      }
      if (f.t !== 'range' && f.t !== 'seq') el.addEventListener(f.t === 'txt' ? 'change' : 'input', () => onChange(f, f.t === 'chk' ? el.checked : el.value));
      inputs[f.k] = { el, f, wrap: w };
      box.appendChild(w);
    }
    d.appendChild(box);
    form.appendChild(d);
  }
}

function coerce(f, v) {
  if (f.t === 'chk') return !!v;
  if (f.t === 'num' || f.t === 'range') { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : P[f.k]; }
  return v;
}
function onChange(f, v) { P[f.k] = coerce(f, v); refreshVisibility(); schedule(); }

function syncForm() {
  for (const k in inputs) {
    const { el, f } = inputs[k];
    if (f.t === 'chk') el.checked = !!P[k];
    else { el.value = P[k]; if (el._num) el._num.value = P[k]; }
  }
  refreshVisibility();
}
function refreshVisibility() {
  for (const k in inputs) { const { f, wrap } = inputs[k]; wrap.classList.toggle('hidden', !!f.show && !f.show(P)); }
}

// ------------------------------------------------------------------ předlohy, uložení
const presetSel = document.getElementById('preset');
for (const pr of PRESETS) { const o = document.createElement('option'); o.value = pr.id; o.textContent = pr.nazev; presetSel.appendChild(o); }
presetSel.value = 'jednoduchy';
presetSel.addEventListener('change', () => {
  const pr = PRESETS.find(x => x.id === presetSel.value);
  P = { ...DEFAULTS, ...pr.p }; syncForm(); schedule(0);
});
document.getElementById('btnNew').onclick = () => { P = { ...DEFAULTS }; presetSel.value = 'jednoduchy'; syncForm(); schedule(0); };
document.getElementById('btnSave').onclick = () => {
  const name = (prompt('Název souboru:', 'chalupa') || 'chalupa').replace(/[^\w\-áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ ]+/g, '_');
  download(JSON.stringify({ app: 'chalupa-v-kouli', verze: 1, params: P }, null, 2), name + '.json', 'application/json');
};
document.getElementById('fileLoad').onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const j = JSON.parse(await file.text());
    const prm = j.params || j;
    for (const k of ['predniSkladba', 'zadniSkladba', 'levySkladba', 'pravySkladba']) if (!(k in prm)) prm[k] = '';
    P = { ...DEFAULTS, ...prm }; syncForm(); schedule(0);
  } catch (err) { alert('Soubor se nepodařilo načíst: ' + err.message); }
  e.target.value = '';
};

// ------------------------------------------------------------------ fotka
const photoBox = document.getElementById('photoBox');
const photo = document.getElementById('photo');
function showPhoto(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (photo.src) URL.revokeObjectURL(photo.src);
  photo.src = URL.createObjectURL(file);
  photoBox.classList.remove('hidden');
}
document.getElementById('filePhoto').onchange = e => showPhoto(e.target.files[0]);
document.getElementById('photoClose').onclick = () => photoBox.classList.add('hidden');
document.getElementById('photoSize').onclick = () => photoBox.classList.toggle('big');
document.getElementById('main').addEventListener('dragover', e => e.preventDefault());
document.getElementById('main').addEventListener('drop', e => { e.preventDefault(); showPhoto(e.dataTransfer.files[0]); });

// ------------------------------------------------------------------ 3D náhled
const viewerEl = document.getElementById('viewer');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.localClippingEnabled = true;
viewerEl.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f1ec);
const camera = new THREE.PerspectiveCamera(32, 1, 1, 5000);
camera.up.set(0, 0, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x9c9080, 1.05));
const sun = new THREE.DirectionalLight(0xffffff, 2.3); sun.position.set(-160, -200, 220); scene.add(sun);
const fill = new THREE.DirectionalLight(0xfff1e0, 0.55); fill.position.set(220, -60, 90); scene.add(fill);
camera.add(new THREE.PointLight(0xffffff, 0.35, 0, 0)); scene.add(camera);
const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 64), new THREE.MeshStandardMaterial({ color: 0xe9e3da, roughness: 1 }));
ground.position.z = -0.05; scene.add(ground);

const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const matShell = new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
const matHouse = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0, side: THREE.DoubleSide });
let group = new THREE.Group(); scene.add(group);
let lastRes = null;
let firstFit = true;

function setView(kind) {
  const L = lastRes ? lastRes.info.layout : { zc: 75, R: 60 };
  const tgt = new THREE.Vector3(0, 0, L.zc - L.R * 0.1);
  let d = L.R * 5.2;
  const dirs = { front: [0, -1, 0.22], iso: [-0.42, -1, 0.5], top: [0, -0.25, 1], side: [1, 0, 0.12], zoom: [-0.5, -1, 0.45], zoom2: [0.6, -1, 0.35] };
  if (kind.startsWith('zoom')) { d = L.R * 1.9; tgt.set(0, 0, L.zf + 12); }
  const v = new THREE.Vector3(...dirs[kind]).normalize().multiplyScalar(d);
  camera.position.copy(tgt).add(v); controls.target.copy(tgt); controls.update();
}
document.querySelectorAll('#toolbar [data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
const cutEl = document.getElementById('cut'), xrayEl = document.getElementById('xray');
function applyDisplay() {
  matShell.clippingPlanes = cutEl.checked ? [clipPlane] : [];
  matShell.transparent = xrayEl.checked; matShell.opacity = xrayEl.checked ? 0.28 : 1; matShell.depthWrite = !xrayEl.checked;
  matShell.needsUpdate = true;
  if (lastRes) showResult(lastRes);
}
cutEl.onchange = applyDisplay; xrayEl.onchange = applyDisplay;

function resize() {
  const w = viewerEl.clientWidth, h = viewerEl.clientHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
(function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

function geomOf(part) {
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(part.positions, 3));
  g.setIndex(new THREE.BufferAttribute(part.indices, 1));
  g = toCreasedNormals(g, THREE.MathUtils.degToRad(28));
  return g;
}

function showResult(res) {
  scene.remove(group);
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  group = new THREE.Group();
  // Pro náhled rozdělíme kouli a dům podle výšky? Jednodušší: celý díl jedním materiálem,
  // při řezu/průhlednosti zobrazíme dům zvlášť (vnitřek) – použijeme samostatný mesh domu z exportu, pokud existuje.
  for (const p of res.preview) {
    const isHouse = p.name === 'domek';
    const m = new THREE.Mesh(geomOf(p), isHouse ? matHouse : matShell);
    if (isHouse && P.rezim === 'zvlast') m.position.z = 0; // v náhledu je domek usazený v zahloubení
    group.add(m);
  }
  scene.add(group);
}

// ------------------------------------------------------------------ výpočet ve workeru
const statusEl = document.getElementById('status'), infoEl = document.getElementById('info');
let worker = null;
function startWorker() {
  if (worker) worker.terminate();
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = onWorkerMessage;
  worker.onerror = (e) => { busy = false; statusEl.textContent = 'Worker se nespustil: ' + e.message; };
}
let reqId = 0, pending = null, busy = false, timer = null;
function schedule(delay = 220) {
  clearTimeout(timer);
  timer = setTimeout(() => { pending = { ...P }; pump(); }, delay);
}
function pump() {
  if (busy || !pending) return;
  busy = true;
  statusEl.textContent = 'Počítám model…';
  worker.postMessage({ id: ++reqId, params: pending });
  pending = null;
}
function onWorkerMessage(ev) {
  busy = false;
  const { ok, res, error, ms, builds } = ev.data;
  if (builds >= 12) startWorker(); // uvolnit paměť WASM
  if (!ok) { statusEl.textContent = 'Chyba výpočtu – viz konzole'; console.error(error); pump(); return; }
  lastRes = res;
  showResult(res);
  if (firstFit) { setView('iso'); firstFit = false; }
  renderInfo(res, ms);
  statusEl.textContent = `Hotovo za ${Math.round(ms)} ms · ${res.parts.reduce((a, p) => a + p.indices.length / 3, 0).toLocaleString('cs-CZ')} trojúhelníků`;
  window.__lastResult = { info: res.info, warnings: res.warnings, parts: res.parts.map(p => ({ name: p.name, tri: p.indices.length / 3, volume: p.volume, genus: p.genus, status: p.status })) };
  window.__ready = true;
  pump();
}
startWorker();

function renderInfo(res) {
  const i = res.info;
  const f1 = v => v.toLocaleString('cs-CZ', { maximumFractionDigits: 1 });
  const vol = res.parts.reduce((a, p) => a + p.volume, 0) / 1000;
  infoEl.innerHTML = `
    Měřítko <b>1 : ${i.pomer}</b> (${f1(i.meritko)} mm na metr)<br>
    Domek <b>${i.domekMm.map(f1).join(' × ')} mm</b> · okno ${f1(i.oknoMm[0])} × ${f1(i.oknoMm[1])} mm<br>
    Koule <b>Ø ${f1(P.kouleD)} mm</b>, celkem ${f1(i.kouleMm[0])} × ${f1(i.kouleMm[1])} × ${f1(i.kouleMm[2])} mm · otvor svíčky Ø ${f1(P.svickaD)} mm<br>
    <span style="color:var(--muted)">Objem modelu ${f1(vol)} cm³ (bez výplně; slicer tiskne s řídkou výplní)</span>
    ${res.warnings.map(w => `<div class="warn">⚠ ${w}</div>`).join('')}`;
}

// ------------------------------------------------------------------ export
const fileBase = () => 'chalupa-v-kouli-' + new Date().toISOString().slice(0, 10);
document.getElementById('exp3mf').onclick = () => {
  if (!lastRes) return;
  download(make3MF(lastRes.parts), fileBase() + '.3mf', 'model/3mf');
};
document.getElementById('expStl').onclick = () => {
  if (!lastRes) return;
  for (const p of lastRes.parts) download(makeSTL(p), `${fileBase()}-${p.name}.stl`, 'model/stl');
};

// ------------------------------------------------------------------ start
buildForm();
const urlPreset = new URLSearchParams(location.search).get('preset');
if (urlPreset && PRESETS.find(x => x.id === urlPreset)) { presetSel.value = urlPreset; P = { ...DEFAULTS, ...PRESETS.find(x => x.id === urlPreset).p }; }
syncForm();
resize();
setView('iso');
schedule(0);
window.__setView = setView;
window.__setParams = (o) => { P = { ...P, ...o }; syncForm(); window.__ready = false; schedule(0); };
