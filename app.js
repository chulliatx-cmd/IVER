// Journal du chiot — app sans build, à héberger sur GitHub Pages.
const CFG = window.CHIOT_CONFIG || {};
const PEOPLE = CFG.personnes || [];
const RAPPEL = CFG.rappelPipiMinutes || 90;

/* ---------- Repères selon l'âge ----------
   Repères généraux couramment donnés par les vétérinaires et éducateurs (ex. American Kennel Club) :
   - un chiot se retient au maximum environ « âge en mois + 1 » heures (plafonné à ~8 h) ;
   - en journée, on le sort bien plus souvent : ~toutes les heures avant 3 mois, puis on espace ;
   - et toujours au réveil, 10–30 min après un repas, après le jeu ;
   - repas : 4 par jour jusqu'à ~3 mois, 3 jusqu'à ~6 mois, puis 2.
   Ce sont des moyennes : chaque chiot est différent, le vétérinaire reste la référence. */
const NAISSANCE = CFG.naissance ? new Date(CFG.naissance + "T00:00:00").getTime() : null;
function repereAge(now = Date.now()) {
  if (!NAISSANCE || now < NAISSANCE) return null;
  const jours = Math.floor((now - NAISSANCE) / 86400000);
  const sem = Math.floor(jours / 7);
  const mois = jours / 30.44;
  let sortie, repas;
  if (sem < 12) { sortie = 60; repas = 4; }
  else if (sem < 16) { sortie = 120; repas = 3; }
  else if (mois < 6) { sortie = 180; repas = 3; }
  else if (mois < 12) { sortie = 240; repas = 2; }
  else { sortie = 360; repas = 2; }
  const maxH = Math.min(Math.floor(mois) + 1, 8);
  const ageTxt = sem < 16 ? `${sem} semaines` : mois < 24 ? `${Math.floor(mois)} mois` : `${Math.floor(mois / 12)} ans`;
  return { jours, sem, mois, sortie, repas, maxH, ageTxt };
}
// Intervalle conseillé entre 2 sorties (minutes)
const intervalleSortie = () => repereAge()?.sortie ?? RAPPEL;

const TYPES = {
  pipi:   { label: "Pipi",   color: "var(--pipi)",   bg: "var(--pipi-bg)",   ink: "var(--pipi-ink)" },
  caca:   { label: "Caca",   color: "var(--caca)",   bg: "var(--caca-bg)",   ink: "var(--caca-ink)" },
  repas:  { label: "Repas",  color: "var(--repas)",  bg: "var(--repas-bg)",  ink: "var(--repas-ink)" },
  sieste: { label: "Dodo", color: "var(--sieste)", bg: "var(--sieste-bg)", ink: "var(--sieste-ink)" },
  balade: { label: "Balade", color: "var(--balade)", bg: "var(--balade-bg)", ink: "var(--balade-ink)" }
};
const FEMININ = { balade: true };
const RDV = {
  veto:       { label: "Vétérinaire", color: "#FF5F7E", bg: "#FF5F7E29" },
  toiletteur: { label: "Toiletteur",  color: "#5FD3E6", bg: "#5FD3E629" },
  vaccin:     { label: "Vaccin",      color: "#8FA8FF", bg: "#8FA8FF29" },
  autre:      { label: "Autre",       color: "#9B98A6", bg: "#9B98A629" }
};
/* ---------- Icônes (24×24, trait) ---------- */
const ICONS = {
  // goutte (+ reflet)
  pipi: '<path d="M12 3.2c3.2 4.1 6.2 7.4 6.2 11a6.2 6.2 0 0 1-12.4 0c0-3.6 3-6.9 6.2-11z"/><path class="reflet" d="M9.3 14.6a2.8 2.8 0 0 0 2.4 2.6"/>',
  // petit tas en trois étages
  caca: '<path d="M4.8 19.6h14.4a2.4 2.4 0 0 0 0-4.8H4.8a2.4 2.4 0 0 0 0 4.8z"/><path d="M6.9 14.8a2.3 2.3 0 0 1 0-4.6h10.2a2.3 2.3 0 0 1 0 4.6"/><path class="pointe" d="M9 10.2a2.4 2.4 0 0 1 2.4-2.7c1.2 0 1.8-.9 1.6-2.6 1.9.6 2.7 2 2.6 3.2a2.2 2.2 0 0 1-.6 2.1"/><path class="odeur odeur1" stroke-width="1.5" d="M5 8.8c-1.3-1.1 1.3-1.9 0-3s1.3-1.9 0-3"/><path class="odeur odeur2" stroke-width="1.5" d="M19.4 8.8c-1.3-1.1 1.3-1.9 0-3s1.3-1.9 0-3"/>',
  // gamelle + croquettes
  repas: '<path d="M3 13h18l-1.5 5a2.6 2.6 0 0 1-2.5 1.9H7a2.6 2.6 0 0 1-2.5-1.9z"/><circle class="k k1" cx="8.6" cy="10.6" r="1.3"/><circle class="k k2" cx="12.2" cy="9.7" r="1.3"/><circle class="k k3" cx="15.6" cy="10.8" r="1.3"/><path class="odeur odeur1" stroke-width="1.4" d="M10.2 7c-1.1-.9 1.1-1.5 0-2.4s1.1-1.5 0-2.4"/><path class="odeur odeur2" stroke-width="1.4" d="M14.4 7c-1.1-.9 1.1-1.5 0-2.4s1.1-1.5 0-2.4"/>',
  // lune + z
  sieste: '<path class="lune" d="M18.5 15.2A7.5 7.5 0 1 1 9 5a6 6 0 0 0 9.5 10.2z"/><path class="z" d="M15 3.5h3.5L15 7.5h3.5"/>',
  // empreinte de patte
  balade: '<g class="corps"><path d="M3.9 13.2a3.2 3.2 0 0 1 3.2-3.2h7.6a2.7 2.7 0 0 1 2.7 2.7v.6a2.4 2.4 0 0 1-2.4 2.4H6.3a2.4 2.4 0 0 1-2.4-2.4z"/><path d="M15.6 10.4V8a3.4 3.4 0 0 1 3.4-3.4h.2a2.2 2.2 0 0 1 2.1 1.6l.3 1h.4a.9.9 0 0 1 .9.9v.3a1.9 1.9 0 0 1-1.9 1.9h-1.7"/><path d="M16.8 5.2c-1.2.6-1.6 2.2-.9 3.7" fill="currentColor"/><circle cx="19" cy="7.3" r=".85" fill="currentColor" stroke="none"/><path class="queue" d="M4.2 11.6c-1.5-.5-2.4-1.9-2.2-3.6"/></g><path class="patte pA" style="transform-origin:6px 15.7px" d="M6 15.7v4.8"/><path class="patte pB" style="transform-origin:8.6px 15.7px" d="M8.6 15.7v4.8"/><path class="patte pB" style="transform-origin:12.8px 15.7px" d="M12.8 15.7v4.8"/><path class="patte pA" style="transform-origin:15.4px 15.7px" d="M15.4 15.7v4.8"/>',
  // goutte barrée (accident)
  accident: '<path d="M12 3.2c3.2 4.1 6.2 7.4 6.2 11a6.2 6.2 0 0 1-12.4 0c0-3.6 3-6.9 6.2-11z"/><path d="M4 4l16 16"/>',
  // stéthoscope
  veto: '<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M10 12v2.5a4.5 4.5 0 0 0 9 0V12"/><circle class="pavillon" cx="19" cy="10" r="2"/>',
  // ciseaux (deux lames qui pivotent)
  toiletteur: '<g class="lame lameA"><circle cx="6" cy="17" r="2.6"/><path d="M8.2 15.6 20 7"/></g><g class="lame lameB"><circle cx="6" cy="7" r="2.6"/><path d="M8.2 8.4 20 17"/></g>',
  // seringue (le piston s'enfonce)
  vaccin: '<g transform="rotate(-45 12 12)"><rect x="6" y="8.6" width="11.4" height="6.8" rx="1.6"/><path d="M0.8 12H6M9.6 8.6v2.6M12.8 8.6v2.6"/><path class="piston" d="M17.4 12h3.6M21 8.4v7.2"/></g>',
  // calendrier
  autre: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17"/><path class="anneau" d="M8 3v4M16 3v4"/>'
};
const ACCIDENT = { label: "Accident", color: "var(--pink)", bg: "var(--pink-soft)" };
const svgIcon = (k, size = 22) =>
  `<svg class="ic ic-${k}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.autre}</svg>`;
// Icône dans une pastille teintée. taille : xs (pastilles), sm (stats), md (liste), lg (boutons de type)
function tIcon(k, taille = "md") {
  const t = TYPES[k] || RDV[k] || (k === "accident" ? ACCIDENT : RDV.autre);
  const px = { xs: 16, sm: 16, md: 20, lg: 24 }[taille];
  return `<span class="ti ti-${taille}" style="color:${t.color};background:${t.bg || "transparent"}">${svgIcon(k, px)}</span>`;
}

const MANGE = { tout: "tout mangé", moitie: "la moitié", rien: "rien mangé" };

/* ---------- Stockage (Firebase si configuré, sinon local) ---------- */

function localStore() {
  const KEY = "chiot-events";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {} };
  let subs = [];
  const emit = () => subs.forEach((cb) => cb(read()));
  window.addEventListener("storage", (e) => { if (e.key === KEY) emit(); });
  return {
    online: false,
    subscribe(cb) { subs.push(cb); cb(read()); },
    async add(ev) { const l = read(); l.push({ ...ev, id: crypto.randomUUID() }); write(l); emit(); },
    async remove(id) { write(read().filter((e) => e.id !== id)); emit(); },
    async update(id, patch) { write(read().map((e) => (e.id === id ? { ...e, ...patch } : e))); emit(); }
  };
}

async function firebaseStore() {
  const v = "10.12.2";
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`);
  const fs = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore.js`);
  const app = initializeApp(CFG.firebase);
  const db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache() });
  const col = fs.collection(db, "journals", CFG.journalId || "journal", "events");
  return {
    online: true,
    subscribe(cb) {
      const q = fs.query(col, fs.orderBy("time", "desc"), fs.limit(2000));
      fs.onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
        (err) => { console.error(err); toast("Erreur de synchronisation"); });
    },
    async add(ev) { await fs.addDoc(col, ev); },
    async remove(id) { await fs.deleteDoc(fs.doc(col, id)); },
    async update(id, patch) { await fs.updateDoc(fs.doc(col, id), patch); }
  };
}

let store;
let events = [];
let rdvs = [];
let mots = [];
let humeurs = [];

/* ---------- Humeur du jour ---------- */
const HUMEURS = {
  joyeuse:  { e: "😄", label: "Joyeuse" },
  joueuse:  { e: "🎾", label: "Joueuse" },
  caline:   { e: "🥰", label: "Câline" },
  zen:      { e: "😌", label: "Zen" },
  fatiguee: { e: "😴", label: "Fatiguée" },
  coquine:  { e: "😈", label: "Coquine" },
  grognon:  { e: "😤", label: "Grognon" },
  malade:   { e: "🤒", label: "Pas en forme" }
};
const humeurDu = (d0) => humeurs.filter((h) => h.time >= d0 && h.time < d0 + DAY && HUMEURS[h.mood]).sort((a, b) => b.time - a.time)[0];
let humeurOuverte = false;

/* ---------- Utilitaires ---------- */

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hfr = (ms) => { const d = new Date(ms); return `${d.getHours()} h ${pad(d.getMinutes())}`; };
const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const DAY = 86400000;
const person = (id) => PEOPLE.find((p) => p.id === id) || { initiale: "?", couleur: "#55525F", nom: "" };

function dureeTxt(min) {
  min = Math.round(min);
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${pad(m)}` : `${h} h`;
}
function ilYa(ms) {
  const min = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (min < 1) return "à l’instant";
  return "il y a " + dureeTxt(min);
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}
function sleepOverlap(ev, from, to) {
  if (ev.type !== "sieste") return 0;
  const s = Math.max(ev.time, from), e = Math.min(ev.end ?? Date.now(), to);
  return Math.max(0, e - s);
}
function detail(ev) {
  const parts = [];
  if (ev.type === "pipi" || ev.type === "caca") parts.push(ev.place === "dedans" ? "Accident dedans" : "Dehors");
  if (ev.type === "repas") {
    if (ev.qty) parts.push(`${ev.qty} g`);
    if (ev.eaten) parts.push(MANGE[ev.eaten]);
  }
  if (ev.type === "balade" && ev.end) parts.push(dureeTxt((ev.end - ev.time) / 60000));
  if (ev.type === "sieste" && ev.end == null) parts.push(`En cours · depuis ${dureeTxt((Date.now() - ev.time) / 60000)}`);
  if (ev.type === "sieste" && ev.end) parts.push(`${dureeTxt((ev.end - ev.time) / 60000)} · jusqu’à ${hhmm(ev.end)}`);
  if (ev.note) parts.push(ev.note);
  return parts.join(" · ");
}

const PATTE = '<circle cx="6.4" cy="10.2" r="2.1"/><circle cx="9.9" cy="6.2" r="2.1"/><circle cx="14.1" cy="6.2" r="2.1"/><circle cx="17.6" cy="10.2" r="2.1"/><path d="M12 11.4c2.6 0 5.6 3.5 5.6 5.9 0 1.8-1.4 2.8-2.9 2.8-1.1 0-1.8-.7-2.7-.7s-1.6.7-2.7.7c-1.5 0-2.9-1-2.9-2.8 0-2.4 3-5.9 5.6-5.9z"/>';
const ICON_PAW = `<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style="transform:rotate(12deg)">${PATTE}</svg>`;
const ICON_CLOCK = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
const ICON_CAL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
const dateLongue = (ms) => {
  const d0 = startOfDay(ms), t0 = startOfDay(Date.now());
  if (d0 === t0) return "Aujourd’hui";
  if (d0 === t0 + DAY) return "Demain";
  return new Date(ms).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
const ICON_TRASH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`;

function eventRow(ev, withDelete) {
  const t = TYPES[ev.type] || TYPES.pipi;
  const p = person(ev.who);
  return `<div class="ev t-${ev.type in TYPES ? ev.type : "pipi"} editable" data-edit="${esc(ev.id)}" tabindex="0" role="button" aria-label="Modifier ${t.label} de ${hhmm(ev.time)}">
    <span class="t">${hhmm(ev.time)}</span>
    ${tIcon(ev.type, "md")}
    <div class="m"><b>${t.label}</b><span>${esc(detail(ev))}</span></div>
    <span class="who" style="background:${p.couleur}" title="${esc(p.nom)}">${esc(p.initiale)}</span>
    ${withDelete ? `<button class="del" data-del="${esc(ev.id)}" aria-label="Supprimer ${t.label} de ${hhmm(ev.time)}">${ICON_TRASH}</button>` : ""}
  </div>`;
}

/* ---------- Statistiques d'une journée ---------- */

const nf = (x) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const plur = (n, s) => `${s}${n > 1 ? "s" : ""}`;

function dayStats(d0) {
  const d1 = d0 + DAY;
  const until = Math.min(d1, Date.now());
  const list = events.filter((e) => e.time >= d0 && e.time < d1).sort((a, b) => b.time - a.time);
  const of = (t) => list.filter((e) => e.type === t);
  const pipis = of("pipi"), cacas = of("caca"), repas = of("repas"), balades = of("balade");
  const siestes = events.filter((e) => e.type === "sieste" && sleepOverlap(e, d0, until) > 0);
  return {
    list, pipis, cacas, repas, balades,
    pipiAcc: pipis.filter((e) => e.place === "dedans").length,
    cacaAcc: cacas.filter((e) => e.place === "dedans").length,
    baladeMin: balades.reduce((m, e) => m + ((e.end || e.time) - e.time) / 60000, 0),
    sleepMin: siestes.reduce((m, e) => m + sleepOverlap(e, d0, until) / 60000, 0),
    nbSiestes: siestes.length
  };
}

function statTiles(st, isToday) {
  const rien = (f) => isToday ? `${f} aujourd’hui` : `${f} ce jour-là`;
  const tiles = [
    { k: "Pipis", c: "pipi", v: st.pipis.length, s: `${st.pipis.length - st.pipiAcc} dehors · ${st.pipiAcc} ${plur(st.pipiAcc, "accident")}` },
    { k: "Cacas", c: "caca", v: st.cacas.length, s: st.cacas[0] ? `dernier à ${hfr(st.cacas[0].time)}` : rien("aucun") },
    { k: "Repas", c: "repas", v: (() => { const R = repereAge(isToday ? Date.now() : st.list[0]?.time); return R ? `${st.repas.length}<small>/${R.repas}</small>` : st.repas.length; })(), s: (() => {
      const R = repereAge();
      if (isToday && R) {
        if (st.repas.length >= R.repas) return "tous les repas du jour sont donnés";
        const ecart = (12 * 60) / (R.repas - 1);
        const prochain = st.repas[0] ? st.repas[0].time + ecart * 60000 : startOfDay(Date.now()) + 7 * 3600000;
        return `${R.repas} repas/jour à son âge · prochain vers ${hfr(prochain)}`;
      }
      return st.repas[0] ? `dernier à ${hfr(st.repas[0].time)}` : rien("aucun");
    })() },
    { k: "Sommeil", c: "sieste", v: st.sleepMin ? dureeTxt(st.sleepMin) : "0 h", s: `${st.nbSiestes} ${plur(st.nbSiestes, "dodo")}` },
    { k: "Balades", c: "balade", wide: true,
      v: st.balades.length ? dureeTxt(st.baladeMin) : "0 min",
      s: st.balades.length ? `${st.balades.length} ${plur(st.balades.length, "balade")} · dernière à ${hfr(st.balades[0].time)}` : rien("aucune") }
  ];
  return `<div class="stats live">
    ${tiles.map((s) => `<div class="card stat t-${s.c}${s.wide ? " wide" : ""}">
      <div class="k">${tIcon(s.c, "sm")}${s.k}</div>
      <span class="v">${s.v}</span><span class="s">${s.s}</span>
    </div>`).join("")}
  </div>`;
}

// Barres des pipis de la semaine en cours (lundi → dimanche), accidents en rose.
function weekBars(today) {
  const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY;
  const jours = ["L", "M", "M", "J", "V", "S", "D"];
  const data = jours.map((d, i) => {
    const d0 = monday + i * DAY;
    if (d0 > today) return { d, future: true, n: 0, acc: 0 };
    const st = dayStats(d0);
    return { d, today: d0 === today, n: st.pipis.length, acc: st.pipiAcc };
  });
  const total = data.reduce((s, x) => s + x.n, 0), acc = data.reduce((s, x) => s + x.acc, 0);
  const max = Math.max(6, ...data.map((x) => x.n));
  return `<div class="row-between">
      <h2 class="h2">Pipis de la semaine</h2>
      <span class="vol-total">${total} <small>/ ${acc} ${plur(acc, "accident")}</small></span>
    </div>
    <div class="wbars" role="img" aria-label="${total} pipis cette semaine dont ${acc} accidents">
      ${data.map((x) => `<div class="wbar${x.today ? " today" : ""}${x.future ? " future" : ""}">
        <div class="track" style="height:${x.future ? 30 : Math.max(10, Math.round((x.n / max) * 64))}px">
          ${x.n ? `<div class="fill" style="height:100%"></div>` : ""}
          ${x.acc ? `<div class="acc" style="height:${Math.round((x.acc / x.n) * 100)}%"></div>` : ""}
        </div>
        <span class="d">${x.d}</span>
      </div>`).join("")}
    </div>
    <div class="wlegend"><span><i style="background:var(--yellow)"></i>Dehors</span><span><i style="background:var(--pink)"></i>Accident</span></div>`;
}

// Moyennes par jour de la semaine en cours (jours terminés, lundi → hier).
// Le lundi, on affiche la semaine dernière.
function weekAverages(today) {
  const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY;
  // Moyenne sur les jours remplis de la semaine en cours, sans la journée en cours (incomplète).
  // Le lundi, aucun jour n'est encore terminé : on affiche la semaine dernière.
  let from = monday, to = today, titre = "Cette semaine";
  if (monday === today) { from = monday - 7 * DAY; to = monday; titre = "Semaine dernière"; }
  const days = [];
  for (let d = from; d < to; d += DAY) {
    const st = dayStats(d);
    if (st.list.length || st.sleepMin) days.push(st);
  }
  if (!days.length) {
    return `<div class="card">${weekBars(today)}<h2 class="h2" style="margin-top:14px">${titre} · moyennes</h2>
      <p class="empty-msg" style="padding:12px 0 0;text-align:left">Les moyennes apparaîtront dès qu’une journée complète aura été notée.</p></div>`;
  }
  const n = days.length;
  const avg = (f) => days.reduce((s, st) => s + f(st), 0) / n;
  const items = [
    { k: "Pipis", c: "pipi", v: nf(avg((s) => s.pipis.length)) },
    { k: "Accidents", c: "accident", v: nf(avg((s) => s.pipiAcc + s.cacaAcc)) },
    { k: "Cacas", c: "caca", v: nf(avg((s) => s.cacas.length)) },
    { k: "Repas", c: "repas", v: nf(avg((s) => s.repas.length)) },
    { k: "Balade", c: "balade", v: dureeTxt(avg((s) => s.baladeMin)) },
    { k: "Sommeil", c: "sieste", v: dureeTxt(avg((s) => s.sleepMin)) }
  ];
  return `<div class="card">
    ${weekBars(today)}
    <div class="row-between" style="margin-top:14px">
      <h2 class="h2">${titre} · moyenne / jour</h2>
    </div>
    <span class="hint">Sur ${n} ${plur(n, "jour")} ${plur(n, "noté")}, sans aujourd’hui (journée en cours)</span>
    <div class="avg">
      ${items.map((i) => `<div class="avg-i">
        <span class="k">${tIcon(i.c, "xs")}${i.k}</span>
        <span class="v">${i.v}</span>
      </div>`).join("")}
    </div>
  </div>`;
}

function bindEdit() {
  $("#view").querySelectorAll("[data-edit]").forEach((el) => {
    el.addEventListener("click", (e) => { if (!e.target.closest(".del")) ouvrirEdition(el.dataset.edit); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === el) ouvrirEdition(el.dataset.edit); });
  });
}

function bindDelete() {
  $("#view").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await store.remove(b.dataset.del);
    toast("Entrée supprimée");
  }));
}

/* ---------- Dodo en cours ---------- */

const ICON_MOON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>`;
const siesteEnCours = () => events.filter((e) => e.type === "sieste" && e.end == null).sort((a, b) => b.time - a.time)[0];

function sleepNowCard(ev) {
  const nom = esc(CFG.nomChiot || "Le chiot");
  return `<div class="card sleep-now live">
    <div class="row-top">
      <div class="ico">${svgIcon("sieste", 24)}</div>
      <div class="txt">
        <span class="lbl">Dodo en cours · endormie à ${hfr(ev.time)}</span>
        <span class="val">${nom} dort depuis ${dureeTxt((Date.now() - ev.time) / 60000)}</span>
      </div>
    </div>
    <div class="inline">
      <label class="sr" for="wake">Heure du réveil</label>
      <input id="wake" class="input" type="time" value="${nowHHMM()}" aria-label="Heure du réveil">
      <button type="button" class="wake-btn" id="wakeBtn" data-id="${esc(ev.id)}">Elle s’est réveillée</button>
    </div>
  </div>`;
}

function bindWake() {
  const b = $("#wakeBtn");
  if (!b) return;
  b.addEventListener("click", async () => {
    const ev = events.find((e) => e.id === b.dataset.id);
    if (!ev) return;
    const end = hhmmToMs($("#wake").value || nowHHMM());
    if (end <= ev.time) { toast("Le réveil doit être après l’endormissement"); return; }
    b.disabled = true;
    try {
      await store.update(ev.id, { end });
      toast(`Dodo terminé · ${dureeTxt((end - ev.time) / 60000)}`);
      if (route.lastTab === "ajouter") location.hash = "#/";
    } catch (err) { console.error(err); toast("Échec de l’enregistrement"); b.disabled = false; }
  });
}

/* ---------- Écran : Accueil (aujourd'hui) et détail d'un jour passé ---------- */

function renderJour(d0) {
  const now = Date.now();
  const today = startOfDay(now);
  const isToday = d0 === today;
  const st = dayStats(d0);
  const dateTxt = new Date(d0).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: isToday ? undefined : "numeric" });

  let top;
  if (isToday) {
    const lastPipi = events.filter((e) => e.type === "pipi").sort((a, b) => b.time - a.time)[0];
    let lastHtml;
    const R = repereAge(now);
    const repere = R ? `<span class="repere">Repère à ${R.ageTxt} : sortie toutes les ~${dureeTxt(R.sortie)} en journée, et après repas, dodo ou jeu</span>` : "";
    const enDodo = siesteEnCours();
    let badge = null;
    if (lastPipi) {
      const depuis = (now - lastPipi.time) / 60000;
      const reveil = events.filter((e) => e.type === "sieste" && e.end && e.end <= now).sort((a, b) => b.end - a.end)[0];
      const repasApres = events.filter((e) => e.type === "repas" && e.time > lastPipi.time && e.time <= now).sort((a, b) => b.time - a.time)[0];
      if (enDodo) badge = ["ok", "Elle dort"];
      else if (reveil && reveil.end > lastPipi.time && now - reveil.end < 3 * 3600000) badge = ["warn", "Sortir : réveil"];
      else if (repasApres && now - repasApres.time >= 10 * 60000) badge = ["warn", "Sortir : repas"];
      else if (R && depuis >= R.maxH * 60) badge = ["warn", "Sortir vite !"];
      else if (depuis >= intervalleSortie()) badge = ["warn", "Sortir bientôt"];
      else badge = ["ok", `Sortie vers ${hfr(lastPipi.time + intervalleSortie() * 60000)}`];
      lastHtml = `<span class="val">${ilYa(lastPipi.time)} · ${hfr(lastPipi.time)}</span>${repere}</div>
        <span class="badge ${badge[0]}">${badge[1]}</span>`;
    } else {
      lastHtml = `<span class="val">Pas encore noté</span>${repere}</div>`;
    }
    const nextRdv = rdvs.filter((r) => r.time >= now - 3600000).sort((a, b) => a.time - b.time)[0];
    const dort = siesteEnCours();
    top = `
    <div class="head">
      <div class="brand">
        <div class="logo">
          <div class="mark">${ICON_PAW}</div>
          <div class="sub">
            <div class="name-row">
              <h1 class="name">${esc(CFG.nomChiot || "Mon chiot")}</h1>
              ${(() => { const h = humeurDu(today); const m = h && HUMEURS[h.mood];
                return `<button type="button" class="mood${m ? "" : " vide"}" id="mood" aria-expanded="${humeurOuverte}" aria-label="${m ? `Humeur du jour : ${m.label}. Changer` : "Choisir l’humeur du jour"}">
                  <span class="mood-e" aria-hidden="true">${m ? m.e : "🙂"}</span><span class="mood-l">${m ? esc(m.label) : "Humeur ?"}</span></button>`; })()}
            </div>
            <span class="sync ${store.online ? "" : "off"}">${store.online ? "Synchronisé" : "Mode local (non partagé)"}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
        <button type="button" class="share icon-only" id="aide" aria-expanded="${aideOuverte}" aria-label="Aide et guide">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.2 9a2.9 2.9 0 0 1 5.6 1c0 2-2.8 2.4-2.8 4.2"/><circle cx="12" cy="18" r=".6" fill="currentColor"/></svg>
        </button>
        <button type="button" class="share icon-only" id="theme" aria-label="${theme() === "light" ? "Passer en thème sombre" : "Passer en thème clair"}">
          ${theme() === "light"
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>'}
        </button>
        </div>
      </div>
      <div class="pills live" aria-label="Ajout rapide">
        ${Object.entries(TYPES).map(([id, v]) => `<a class="pill" href="#/ajouter/${id}">${tIcon(id, "xs")}${v.label}</a>`).join("")}
      </div>
      <span class="eyebrow">${esc(dateTxt)}</span>
    </div>

    ${aideOuverte ? `<div class="card mood-picker aide-menu">
      <span class="eyebrow">Aide</span>
      <button type="button" class="save" id="gRevoir">Revoir le guide</button>
      <button type="button" class="btn-soft" id="share" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/></svg>
        Partager le lien de l’app</button>
      ${(() => { const R = repereAge(); return R ? `<div class="reperes">
        <b>Repères pour ${esc(CFG.nomChiot || "le chiot")} · ${R.ageTxt}</b>
        <ul>
          <li>Sortie conseillée en journée : toutes les ~${dureeTxt(R.sortie)}</li>
          <li>Se retient au maximum ~${R.maxH} h (règle « âge en mois + 1 »)</li>
          <li>Toujours sortir au réveil, 10 à 30 min après un repas et après le jeu</li>
          <li>${R.repas} repas par jour à son âge</li>
          <li>Sommeil : 18 à 20 h par jour, c’est normal</li>
        </ul>
        <small>Repères généraux de vétérinaires et éducateurs (ex. American Kennel Club). Ils s’adaptent tout seuls à son âge ; votre véto reste la référence.</small>
      </div>` : ""; })()}
      <label class="switch-row">
        <span><b>Guide automatique</b><small>Se lance à la première ouverture et après les grosses mises à jour</small></span>
        <input type="checkbox" id="gAuto" class="switch" ${guideOff() ? "" : "checked"}>
      </label>
    </div>` : ""}

    ${humeurOuverte ? `<div class="card mood-picker" role="group" aria-label="Humeur du jour">
      <span class="eyebrow">Comment va ${esc(CFG.nomChiot || "le chiot")} aujourd’hui ?</span>
      <div class="mood-grid">
        ${Object.entries(HUMEURS).map(([k, v]) => `<button type="button" class="mood-opt" data-mood="${k}" aria-pressed="${humeurDu(today)?.mood === k}">
          <span class="mood-e" aria-hidden="true">${v.e}</span><span>${v.label}</span></button>`).join("")}
      </div>
    </div>` : ""}

    ${mots.length ? apercuMot() : ""}

    ${dort ? sleepNowCard(dort) : ""}

    <div class="card last live t-pipi">
      <div class="ico">${svgIcon("pipi", 24)}</div>
      <div class="txt"><span class="lbl">Dernier pipi</span>${lastHtml}
    </div>

    ${nextRdv ? `<a href="#/calendrier" class="card rdv-next live t-rdv">
      <div class="ico" style="background:${RDV[nextRdv.rdvType]?.color || "#9B98A6"};color:#0A0A0F">${svgIcon(nextRdv.rdvType in RDV ? nextRdv.rdvType : "autre", 24)}</div>
      <div class="txt"><span class="lbl">Prochain rendez-vous</span>
        <span class="val">${esc(RDV[nextRdv.rdvType]?.label || "Rendez-vous")}${nextRdv.title ? " · " + esc(nextRdv.title) : ""}</span>
        <span class="lbl">${esc(dateLongue(nextRdv.time))} à ${hfr(nextRdv.time)}</span></div>
    </a>` : ""}`;
  } else {
    const prev = d0 - DAY, next = d0 + DAY;
    top = `
    <div class="formhead">
      <a href="#/historique" class="back" aria-label="Retour aux jours passés"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a>
      <div class="left" style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="eyebrow">Journée passée${(() => { const h = humeurDu(d0); return h ? ` · ${HUMEURS[h.mood].e} ${HUMEURS[h.mood].label}` : ""; })()}</span>
        <h1 class="title day-h">${esc(dateTxt)}</h1>
      </div>
    </div>
    <div class="daynav">
      <a href="#/jour/${prev}" class="btn-soft">‹ Veille</a>
      ${next < today ? `<a href="#/jour/${next}" class="btn-soft">Lendemain ›</a>` : `<a href="#/" class="btn-soft">Aujourd’hui ›</a>`}
    </div>
    <a href="#/ajouter" class="save" style="text-decoration:none">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      Ajouter un oubli ce jour-là</a>
    <div style="display:none">
    </div>`;
  }

  $("#view").innerHTML = `
    ${top}
    ${statTiles(st, isToday)}
    ${isToday ? weekAverages(today) : ""}
    <div class="list">
      <div class="row-between">
        <h2 class="h2">Détail de la journée</h2>
        ${st.list.length ? `<span class="hint" style="font-size:12px">Touchez pour modifier</span>` : ""}
        ${isToday ? `<a href="#/historique" style="font-size:13px;font-weight:700">Jours passés</a>` : ""}
      </div>
      ${st.list.length ? st.list.map((e) => eventRow(e, true)).join("") : `<div class="empty-msg">${isToday ? "Rien de noté aujourd’hui. Appuyez sur « Ajouter »." : "Rien de noté ce jour-là."}</div>`}
    </div>`;

  $("#share")?.addEventListener("click", partagerLien);
  $("#mood")?.addEventListener("click", () => { humeurOuverte = !humeurOuverte; aideOuverte = false; renderAccueil(); });
  $("#aide")?.addEventListener("click", () => { aideOuverte = !aideOuverte; humeurOuverte = false; renderAccueil(); });
  $("#gRevoir")?.addEventListener("click", lancerGuide);
  $("#gAuto")?.addEventListener("change", (e) => {
    setGuideOff(!e.target.checked);
    toast(e.target.checked ? "Guide automatique réactivé" : "Guide automatique désactivé");
  });
  $("#view").querySelectorAll("[data-mood]").forEach((b) => b.addEventListener("click", async () => {
    const r = b.getBoundingClientRect();
    const actuelle = humeurDu(startOfDay(Date.now()));
    humeurOuverte = false;
    try {
      if (actuelle) await store.update(actuelle.id, { mood: b.dataset.mood, who: moi() || null, time: Date.now() });
      else await store.add({ type: "humeur", mood: b.dataset.mood, who: moi() || null, time: Date.now(), createdAt: Date.now() });
      eclat(r.left + r.width / 2, r.top + r.height / 2, "patte");
      toast(`${HUMEURS[b.dataset.mood].e} ${CFG.nomChiot || "Le chiot"} est ${HUMEURS[b.dataset.mood].label.toLowerCase()} aujourd’hui`);
    } catch (err) { console.error(err); toast("Échec de l’enregistrement"); }
    renderAccueil();
  }));
  bindEdit();
  $("#theme")?.addEventListener("click", () => { setTheme(theme() === "light" ? "dark" : "light"); renderAccueil(); });
  bindWake();
  bindDelete();
}

function renderAccueil() { renderJour(startOfDay(Date.now())); }

async function partagerLien() {
  const url = location.origin + location.pathname;
  if (navigator.share) {
    try { await navigator.share({ title: "Journal du chiot", url }); } catch {}
    return;
  }
  try { await navigator.clipboard.writeText(url); toast("Lien copié"); }
  catch { prompt("Copiez ce lien :", url); }
}

/* ---------- Écran : Jours passés ---------- */

function renderHistorique() {
  const today = startOfDay(Date.now());
  const days = [...new Set(events.map((e) => startOfDay(e.time)))].filter((d) => d <= today).sort((a, b) => b - a).slice(0, 120);
  const label = (k) => k === today ? "Aujourd’hui" : k === today - DAY ? "Hier" :
    new Date(k).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const chip = (k, txt) => `<span class="chip">${tIcon(k, "xs")}${txt}</span>`;

  $("#view").innerHTML = `
    <h1 class="title">Jours passés</h1>
    <div class="list">
      ${days.length ? days.map((d) => {
        const st = dayStats(d);
        const acc = st.pipiAcc + st.cacaAcc;
        return `<a href="${d === today ? "#/" : `#/jour/${d}`}" class="card daycard">
          <div class="row-between">
            <span class="h2 cap">${esc(label(d))}</span>
            <span class="chev" aria-hidden="true">›</span>
          </div>
          <div class="chips">
            ${chip("pipi", `${st.pipis.length} ${plur(st.pipis.length, "pipi")}`)}
            ${acc ? chip("accident", `${acc} ${plur(acc, "accident")}`) : ""}
            ${chip("caca", `${st.cacas.length} ${plur(st.cacas.length, "caca")}`)}
            ${chip("repas", `${st.repas.length} repas`)}
            ${st.baladeMin ? chip("balade", `${dureeTxt(st.baladeMin)} de balade`) : ""}
            ${st.sleepMin ? chip("sieste", `${dureeTxt(st.sleepMin)} de sommeil`) : ""}
            ${(() => { const h = humeurDu(d); return h ? `<span class="chip"><span aria-hidden="true">${HUMEURS[h.mood].e}</span>${HUMEURS[h.mood].label}</span>` : ""; })()}
          </div>
        </a>`;
      }).join("") : `<div class="empty-msg">Aucune journée notée pour l’instant.</div>`}
    </div>`;
}

/* ---------- Écran : Ajouter ---------- */

const form = { type: "pipi", place: "dehors", eaten: "tout", dur: 30 };

function nowHHMM() { return hhmm(Date.now()); }
// Convertit "HH:MM" en timestamp d'aujourd'hui (ou d'hier si l'heure est dans le futur).
function hhmmToMs(v, ref = Date.now()) {
  const [h, m] = v.split(":").map(Number);
  const d = new Date(ref); d.setHours(h, m, 0, 0);
  let ms = d.getTime();
  if (ms > Date.now() + 5 * 60000) ms -= DAY;
  return ms;
}

function resetForm() {
  delete form.editId; delete form.retour; delete form.date;
  form.heure = form.debut = form.fin = form.note = form.qty = form.sMode = undefined;
  form.dur = 30; form.place = "dehors"; form.eaten = "tout";
}
// Ouvre le formulaire pré-rempli pour corriger une entrée
function ouvrirEdition(id) {
  const ev = events.find((e) => e.id === id);
  if (!ev) return;
  Object.assign(form, {
    editId: id, retour: location.hash || "#/", type: ev.type in TYPES ? ev.type : "pipi",
    who: ev.who || form.who, note: ev.note || "", date: ymd(ev.time),
    heure: hhmm(ev.time), debut: hhmm(ev.time), fin: ev.end ? hhmm(ev.end) : undefined,
    sMode: ev.type === "sieste" && ev.end == null ? "encours" : "terminee",
    place: ev.place || "dehors", qty: ev.qty ?? "", eaten: ev.eaten || "tout",
    dur: ev.type === "balade" && ev.end ? Math.round((ev.end - ev.time) / 60000) : 30
  });
  location.hash = "#/modifier";
}
// "AAAA-MM-JJ" + "HH:MM" -> timestamp
function msDe(date, hm) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = (hm || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, h, mi).getTime();
}

function renderAjouter() {
  form.who = form.who || (() => { try { return localStorage.getItem("chiot-who"); } catch { return null; } })() || PEOPLE[0]?.id;
  const t = form.type;
  const pressed = (b) => (b ? "true" : "false");
  const edit = !!form.editId;
  if (!form.date) form.date = ymd(Date.now());
  const passe = form.date !== ymd(Date.now());
  const dort = edit || passe ? null : siesteEnCours();
  const sMode = dort || passe ? "terminee" : (form.sMode || "encours");

  $("#view").innerHTML = `
    <div class="formhead">
      <a href="${edit ? esc(form.retour) : esc(form.retourJour || "#/")}" class="back" id="fback" aria-label="Retour"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a>
      <h1 class="title">${edit ? "Modifier" : "Nouvelle entrée"}</h1>
    </div>

    <form id="f" style="display:flex;flex-direction:column;gap:18px">
      <div class="field">
        <span class="eyebrow">Quoi ?</span>
        <div class="types">
          ${Object.entries(TYPES).map(([id, v]) => {
            const on = id === t;
            return `<button type="button" class="type${on ? " live" : ""}" data-type="${id}" aria-pressed="${pressed(on)}"
              style="${on ? `border-color:${v.color};background:${v.bg};color:${v.ink}` : ""}">
              ${svgIcon(id, 26)}${v.label}</button>`;
          }).join("")}
        </div>
      </div>

      <div class="field">
        <label for="date" class="eyebrow">Quel jour ?</label>
        <input id="date" class="input" type="date" value="${esc(form.date)}" max="${ymd(Date.now())}" required>
        ${passe && !edit ? `<span class="hint">Ajout pour un jour passé : ${esc(dateLongue(msDe(form.date, "12:00")))}</span>` : ""}
      </div>

      ${t === "sieste" && dort ? sleepNowCard(dort) : ""}

      ${t === "sieste" && !dort && !passe ? `
        <div class="field">
          <span class="eyebrow">Le dodo…</span>
          <div class="choices">
            <button type="button" class="choice" data-smode="encours" aria-pressed="${pressed(sMode === "encours")}">Commence</button>
            <button type="button" class="choice" data-smode="terminee" aria-pressed="${pressed(sMode === "terminee")}">Est terminé</button>
          </div>
        </div>` : ""}

      ${t === "sieste" && sMode === "encours" ? `
        <div class="field">
          <label for="debut" class="eyebrow">Endormie à</label>
          <div class="inline">
            <input id="debut" class="input" type="time" value="${form.debut || nowHHMM()}" required>
            <button type="button" class="btn-soft" id="nowDebut">Maintenant</button>
          </div>
          <span class="hint">Vous pourrez noter le réveil plus tard depuis l’accueil.</span>
        </div>
      ` : t === "sieste" ? `
        ${dort ? `<span class="eyebrow">Ou noter un autre dodo déjà terminé</span>` : ""}
        <div class="grid2">
          <label>Endormie à<input class="input" type="time" id="debut" value="${form.debut || nowHHMM()}" required></label>
          <label>Réveillée à<input class="input" type="time" id="fin" value="${form.fin || nowHHMM()}" required></label>
        </div>
        <span class="duree" id="duree"></span>
      ` : `
        <div class="field">
          <label for="heure" class="eyebrow">À quelle heure ?</label>
          <div class="inline">
            <input id="heure" class="input" type="time" value="${form.heure || nowHHMM()}" required>
            <button type="button" class="btn-soft" id="now">Maintenant</button>
          </div>
        </div>
      `}

      ${t === "pipi" || t === "caca" ? `
        <div class="field">
          <span class="eyebrow">Où ?</span>
          <div class="choices">
            <button type="button" class="choice" data-place="dehors" aria-pressed="${pressed(form.place === "dehors")}">Dehors</button>
            <button type="button" class="choice" data-place="dedans" aria-pressed="${pressed(form.place === "dedans")}">Accident dedans</button>
          </div>
        </div>` : ""}

      ${t === "balade" ? `
        <div class="field">
          <span class="eyebrow">Durée de la balade</span>
          <div class="choices four">
            ${[15, 30, 45, 60].map((m) => `<button type="button" class="choice" data-dur="${m}" aria-pressed="${pressed(String(form.dur) === String(m))}">${m} min</button>`).join("")}
          </div>
          <div class="inline">
            <input id="dur" class="input" type="number" inputmode="numeric" min="1" max="600" value="${esc(form.dur ?? "")}" aria-label="Durée en minutes">
            <span class="unit">minutes</span>
          </div>
        </div>` : ""}

      ${t === "repas" ? `
        <div class="field">
          <label for="qte" class="eyebrow">Quantité (g)</label>
          <input id="qte" class="input" type="number" inputmode="numeric" min="0" value="${esc(form.qty ?? "")}" placeholder="ex. 80">
        </div>
        <div class="field">
          <span class="eyebrow">A-t-elle tout mangé ?</span>
          <div class="choices three">
            ${Object.entries({ tout: "Tout", moitie: "La moitié", rien: "Rien" }).map(([k, l]) =>
              `<button type="button" class="choice" data-eaten="${k}" aria-pressed="${pressed(form.eaten === k)}">${l}</button>`).join("")}
          </div>
        </div>` : ""}

      <div class="field">
        <span class="eyebrow">Qui note ?</span>
        <div class="choices">
          ${PEOPLE.map((p) => `<button type="button" class="choice" data-who="${esc(p.id)}" aria-pressed="${pressed(form.who === p.id)}">
            <span class="who" style="background:${p.couleur}">${esc(p.initiale)}</span>${esc(p.nom)}</button>`).join("")}
        </div>
      </div>

      <div class="field">
        <label for="note" class="eyebrow">Note (facultatif)</label>
        <textarea id="note" class="input" rows="2" placeholder="Ex. a joué avec la balle juste avant">${esc(form.note || "")}</textarea>
      </div>

      <button type="submit" class="save" id="save">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>
        ${edit ? "Enregistrer les modifications" : t === "sieste" && sMode === "encours" ? "Commencer le dodo" : `Enregistrer ${FEMININ[t] ? "la" : "le"} ${TYPES[t].label.toLowerCase()}`}
      </button>
      ${edit ? `<button type="button" class="btn-soft danger" id="fdel">Supprimer cette entrée</button>` : ""}
    </form>`;

  // Garde les valeurs saisies quand on change de type
  const keep = () => {
    form.heure = $("#heure")?.value ?? form.heure;
    form.debut = $("#debut")?.value ?? form.debut;
    form.fin = $("#fin")?.value ?? form.fin;
    form.qty = $("#qte")?.value ?? form.qty;
    form.dur = $("#dur")?.value ?? form.dur;
    form.note = $("#note")?.value ?? form.note;
    form.date = $("#date")?.value ?? form.date;
  };
  const bind = (attr, key) => $("#view").querySelectorAll(`[data-${attr}]`).forEach((b) =>
    b.addEventListener("click", () => {
      keep();
      form[key] = b.dataset[attr];
      if (key === "who") { try { localStorage.setItem("chiot-who", form.who); } catch {} }
      renderAjouter();
    }));
  $("#view").querySelectorAll("[data-type]").forEach((b) => b.addEventListener("click", () => {
    const r = b.getBoundingClientRect();
    if (b.dataset.type !== form.type) eclat(r.left + r.width / 2, r.top + r.height / 2, b.dataset.type);
  }));
  bind("type", "type"); bind("place", "place"); bind("eaten", "eaten"); bind("who", "who"); bind("dur", "dur"); bind("smode", "sMode");
  bindWake();
  $("#nowDebut")?.addEventListener("click", () => { $("#debut").value = nowHHMM(); });

  $("#now")?.addEventListener("click", () => { $("#heure").value = nowHHMM(); if ($("#date")) $("#date").value = ymd(Date.now()); });
  $("#fback")?.addEventListener("click", () => { if (edit) setTimeout(resetForm, 0); else { form.date = undefined; form.retourJour = undefined; } });
  $("#date")?.addEventListener("change", () => { keep(); renderAjouter(); });
  $("#fdel")?.addEventListener("click", async () => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await store.remove(form.editId);
    toast("Entrée supprimée");
    const retour = form.retour; resetForm(); location.hash = retour;
  });

  const updDuree = () => {
    const d = $("#debut"), f = $("#fin");
    if (!d || !f || !d.value || !f.value) return;
    const s = hhmmToMs(d.value);
    let e = hhmmToMs(f.value, s);
    if (e < s) e += DAY;
    $("#duree").textContent = "Durée : " + dureeTxt((e - s) / 60000);
  };
  $("#debut")?.addEventListener("input", updDuree);
  $("#fin")?.addEventListener("input", updDuree);
  updDuree();

  $("#f").addEventListener("submit", async (e) => {
    e.preventDefault();
    keep();
    const ev = { type: form.type, who: form.who || null, note: (form.note || "").trim() };
    if (!edit) ev.createdAt = Date.now();
    // En modification, l'heure s'applique au jour choisi ; sinon aujourd'hui (ou hier si l'heure est à venir)
    const T = (hm, ref) => (edit || passe ? msDe(form.date, hm) : hhmmToMs(hm, ref));
    if (form.type === "sieste" && sMode === "encours") {
      ev.time = T(form.debut);
      ev.end = null;
    } else if (form.type === "sieste") {
      ev.time = T(form.debut);
      let end = T(form.fin, ev.time);
      if (end < ev.time) end += DAY;
      ev.end = end;
    } else {
      ev.time = T(form.heure);
      if (edit) ev.end = null;
    }
    if (form.type === "pipi" || form.type === "caca") ev.place = form.place;
    if (form.type === "balade") {
      const m = Math.max(1, Number(form.dur) || 30);
      ev.end = ev.time + m * 60000;
    }
    if (form.type === "repas") { ev.qty = form.qty ? Number(form.qty) : null; ev.eaten = form.eaten; }

    $("#save").disabled = true;
    if (edit) {
      try {
        await store.update(form.editId, ev);
        toast("Modifications enregistrées");
        const retour = form.retour; resetForm(); location.hash = retour;
      } catch (err) { console.error(err); toast("Échec de l’enregistrement"); $("#save").disabled = false; }
      return;
    }
    try {
      await store.add(ev);
      toast(ev.type === "sieste" && ev.end == null ? "Bon dodo ! Notez le réveil depuis l’accueil" : `${TYPES[form.type].label} enregistré${FEMININ[form.type] ? "e" : ""}`);
      form.heure = form.debut = form.fin = form.note = form.qty = undefined;
      const jourAjout = startOfDay(ev.time);
      form.date = undefined; form.retourJour = undefined;
      location.hash = jourAjout === startOfDay(Date.now()) ? "#/" : `#/jour/${jourAjout}`;
    } catch (err) {
      console.error(err);
      toast("Échec de l’enregistrement");
      $("#save").disabled = false;
    }
  });
}

/* ---------- Écran : Calendrier ---------- */

const cal = { month: null, sel: null, adding: false, rdvType: "veto" };
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const ymd = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

function rdvRow(r) {
  const t = RDV[r.rdvType] || RDV.autre;
  const p = person(r.who);
  const sub = [dateLongue(r.time) + " à " + hfr(r.time), r.note].filter(Boolean).join(" · ");
  return `<div class="ev t-rdv editable" data-editrdv="${esc(r.id)}" tabindex="0" role="button" aria-label="Modifier ce rendez-vous">
    ${tIcon(r.rdvType in RDV ? r.rdvType : "autre", "md")}
    <div class="m"><b>${esc(t.label)}${r.title ? " · " + esc(r.title) : ""}</b><span>${esc(sub)}</span></div>
    <span class="who" style="background:${p.couleur}" title="${esc(p.nom)}">${esc(p.initiale)}</span>
    <button class="del" data-delrdv="${esc(r.id)}" aria-label="Supprimer ce rendez-vous">${ICON_TRASH}</button>
  </div>`;
}

function renderCalendrier() {
  const now = Date.now();
  if (cal.month == null) { const d = new Date(); cal.month = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }
  if (cal.sel == null) cal.sel = startOfDay(now);
  const m0 = new Date(cal.month);
  const y = m0.getFullYear(), mo = m0.getMonth();
  const first = new Date(y, mo, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const nbDays = new Date(y, mo + 1, 0).getDate();
  const today = startOfDay(now);

  const byDay = new Map();
  for (const r of rdvs) {
    const k = startOfDay(r.time);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(r);
  }

  let cells = "";
  for (let i = 0; i < offset; i++) cells += `<span></span>`;
  for (let d = 1; d <= nbDays; d++) {
    const k = new Date(y, mo, d).getTime();
    const list = byDay.get(k) || [];
    const cls = ["day", k === today ? "today" : "", k === cal.sel ? "sel" : ""].join(" ");
    cells += `<button type="button" class="${cls}" data-day="${k}" aria-pressed="${k === cal.sel}" aria-label="${d} ${MOIS[mo]}${list.length ? `, ${list.length} rendez-vous` : ""}">
      <span>${d}</span>
      <span class="dots">${list.slice(0, 3).map((r) => `<i style="background:${(RDV[r.rdvType] || RDV.autre).color}"></i>`).join("")}</span>
    </button>`;
  }

  const selList = (byDay.get(cal.sel) || []).sort((a, b) => a.time - b.time);
  const upcoming = rdvs.filter((r) => r.time >= today).sort((a, b) => a.time - b.time).slice(0, 10);
  const pressed = (b) => (b ? "true" : "false");
  cal.who = cal.who || form.who || (() => { try { return localStorage.getItem("chiot-who"); } catch { return null; } })() || PEOPLE[0]?.id;

  const formHtml = cal.adding ? `
    <form id="rdvf" class="card" style="display:flex;flex-direction:column;gap:16px">
      <h2 class="h2">${cal.editId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</h2>
      <div class="field">
        <span class="eyebrow">Type</span>
        <div class="choices">
          ${Object.entries(RDV).map(([k, v]) => `<button type="button" class="choice" data-rdvtype="${k}" aria-pressed="${pressed(cal.rdvType === k)}">
            <span style="color:${v.color};display:flex">${svgIcon(k, 20)}</span>${v.label}</button>`).join("")}
        </div>
      </div>
      <div class="grid2">
        <label>Date<input class="input" type="date" id="rdate" value="${ymd(cal.sel)}" required></label>
        <label>Heure<input class="input" type="time" id="rheure" value="${esc(cal.heure || "10:00")}" required></label>
      </div>
      <div class="field">
        <label for="rtitre" class="eyebrow">Précision (facultatif)</label>
        <input id="rtitre" class="input" type="text" maxlength="60" placeholder="Ex. Dr Martin, rappel vaccin…" value="${esc(cal.titre || "")}" style="font-size:16px">
      </div>
      <div class="field">
        <label for="rnote" class="eyebrow">Note (facultatif)</label>
        <textarea id="rnote" class="input" rows="2" placeholder="Ex. apporter le carnet de santé">${esc(cal.note || "")}</textarea>
      </div>
      <div class="field">
        <span class="eyebrow">Qui ajoute ?</span>
        <div class="choices">
          ${PEOPLE.map((p) => `<button type="button" class="choice" data-rwho="${esc(p.id)}" aria-pressed="${pressed(cal.who === p.id)}">
            <span class="who" style="background:${p.couleur}">${esc(p.initiale)}</span>${esc(p.nom)}</button>`).join("")}
        </div>
      </div>
      <div class="inline">
        <button type="button" class="btn-soft" id="rcancel">Annuler</button>
        <button type="submit" class="save" id="rsave" style="flex:1">Enregistrer</button>
      </div>
      ${cal.editId ? `<button type="button" class="btn-soft danger" id="rdel">Supprimer ce rendez-vous</button>` : ""}
    </form>` : `
    <button type="button" class="save" id="radd">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      Ajouter un rendez-vous
    </button>`;

  $("#view").innerHTML = `
    <h1 class="title">Calendrier</h1>

    <div class="card">
      <div class="cal-head">
        <button type="button" class="back" id="prev" aria-label="Mois précédent"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
        <h2 class="h2" style="text-transform:capitalize">${MOIS[mo]} ${y}</h2>
        <button type="button" class="back" id="next" aria-label="Mois suivant"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
      <div class="cal-grid wd">${["L", "M", "M", "J", "V", "S", "D"].map((d) => `<span>${d}</span>`).join("")}</div>
      <div class="cal-grid">${cells}</div>
      <div class="legend">${Object.values(RDV).map((v) => `<span><i style="background:${v.color}"></i>${v.label}</span>`).join("")}</div>
    </div>

    <div class="list">
      <span class="day-title">${esc(dateLongue(cal.sel))}</span>
      ${selList.length ? selList.map(rdvRow).join("") : `<div class="empty-msg">Aucun rendez-vous ce jour-là.</div>`}
    </div>

    ${formHtml}

    <div class="list">
      <h2 class="h2">À venir</h2>
      ${upcoming.length ? upcoming.map(rdvRow).join("") : `<div class="empty-msg">Aucun rendez-vous prévu.</div>`}
    </div>`;

  const keep = () => {
    if (!$("#rdvf")) return;
    cal.heure = $("#rheure").value; cal.titre = $("#rtitre").value; cal.note = $("#rnote").value;
    const v = $("#rdate").value;
    if (v) { const [yy, mm, dd] = v.split("-").map(Number); cal.sel = new Date(yy, mm - 1, dd).getTime(); }
  };
  $("#prev").addEventListener("click", () => { keep(); cal.month = new Date(y, mo - 1, 1).getTime(); renderCalendrier(); });
  $("#next").addEventListener("click", () => { keep(); cal.month = new Date(y, mo + 1, 1).getTime(); renderCalendrier(); });
  $("#view").querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => {
    keep(); cal.sel = Number(b.dataset.day); renderCalendrier();
  }));
  $("#radd")?.addEventListener("click", () => { cal.adding = true; cal.editId = null; cal.titre = cal.note = undefined; renderCalendrier(); $("#rdvf").scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("#rcancel")?.addEventListener("click", () => { cal.adding = false; cal.editId = null; cal.titre = cal.note = undefined; renderCalendrier(); });
  const ouvrirRdv = (id) => {
    const r = rdvs.find((x) => x.id === id);
    if (!r) return;
    const d = new Date(r.time);
    Object.assign(cal, { adding: true, editId: id, rdvType: r.rdvType in RDV ? r.rdvType : "autre", sel: startOfDay(r.time),
      month: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), heure: hhmm(r.time), titre: r.title || "", note: r.note || "", who: r.who || cal.who });
    renderCalendrier();
    $("#rdvf").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  $("#view").querySelectorAll("[data-editrdv]").forEach((el) => {
    el.addEventListener("click", (e) => { if (!e.target.closest(".del")) ouvrirRdv(el.dataset.editrdv); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === el) ouvrirRdv(el.dataset.editrdv); });
  });
  $("#rdel")?.addEventListener("click", async () => {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    await store.remove(cal.editId);
    cal.adding = false; cal.editId = null; cal.titre = cal.note = undefined;
    toast("Rendez-vous supprimé");
    renderCalendrier();
  });
  $("#view").querySelectorAll("[data-rdvtype]").forEach((b) => b.addEventListener("click", () => { keep(); cal.rdvType = b.dataset.rdvtype; renderCalendrier(); }));
  $("#view").querySelectorAll("[data-rwho]").forEach((b) => b.addEventListener("click", () => { keep(); cal.who = b.dataset.rwho; renderCalendrier(); }));
  $("#view").querySelectorAll("[data-delrdv]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    await store.remove(b.dataset.delrdv);
    toast("Rendez-vous supprimé");
  }));
  $("#rdvf")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    keep();
    const [yy, mm, dd] = $("#rdate").value.split("-").map(Number);
    const [h, mi] = $("#rheure").value.split(":").map(Number);
    const time = new Date(yy, mm - 1, dd, h, mi).getTime();
    const r = { type: "rdv", rdvType: cal.rdvType, time, title: (cal.titre || "").trim(), note: (cal.note || "").trim(), who: cal.who || null };
    const modif = cal.editId;
    $("#rsave").disabled = true;
    try {
      if (modif) await store.update(modif, r);
      else await store.add({ ...r, createdAt: Date.now() });
      cal.adding = false; cal.editId = null; cal.titre = cal.note = undefined;
      cal.sel = startOfDay(time); cal.month = new Date(yy, mm - 1, 1).getTime();
      toast(modif ? "Rendez-vous modifié" : "Rendez-vous ajouté");
      renderCalendrier();
    } catch (err) {
      console.error(err); toast("Échec de l’enregistrement"); $("#rsave").disabled = false;
    }
  });
}

/* ---------- Écran : Mots (post-it entre nous) ---------- */

const moi = () => { try { return localStorage.getItem("chiot-who"); } catch { return null; } } ;
const vuMots = () => { try { return Number(localStorage.getItem("chiot-mots-vu")) || 0; } catch { return 0; } };
// Mots écrits par l'autre depuis la dernière visite de l'onglet
function motsNonLus() {
  const me = moi(), vu = vuMots();
  return mots.filter((m) => m.time > vu && (!me || m.who !== me)).sort((a, b) => b.time - a.time);
}
function majBadgeMots() {
  const a = document.querySelector('.tabbar a[data-tab="mots"]');
  if (!a) return;
  const n = route.lastTab === "mots" ? 0 : motsNonLus().length;
  let b = a.querySelector(".tab-badge");
  if (!n) { b?.remove(); return; }
  if (!b) { b = document.createElement("span"); b.className = "tab-badge"; a.appendChild(b); }
  b.textContent = n > 9 ? "9+" : String(n);
  b.setAttribute("aria-label", `${n} nouveau${n > 1 ? "x" : ""} mot${n > 1 ? "s" : ""}`);
}
const couleurMot = (who) => (PEOPLE.findIndex((p) => p.id === who) === 1 ? "rose" : "jaune");

// Sur l'accueil : toujours le dernier post-it ; « Nouveau » s'il vient de l'autre et n'est pas encore lu
function apercuMot() {
  const nonLus = motsNonLus();
  const m = nonLus[0] || [...mots].sort((a, b) => b.time - a.time)[0];
  const p = person(m.who);
  const n = nonLus.length;
  const quand = (Date.now() - m.time) / 60000 < 60 ? ilYa(m.time) : `${dateLongue(m.time).toLowerCase()} à ${hfr(m.time)}`;
  const titre = n ? `${n > 1 ? `${n} nouveaux mots` : "Nouveau mot"} de ${esc(p.nom || "l’autre")}` : `Dernier mot · ${esc(p.nom || "")} · ${esc(quand)}`;
  return `<a href="#/mots" class="postit-apercu ${couleurMot(m.who)}${n ? " neuf" : ""}">
    <span class="scotch" aria-hidden="true"></span>
    <span class="pa-top">${titre}</span>
    <span class="pa-txt">${esc(m.text.length > 120 ? m.text.slice(0, 120) + "…" : m.text)}</span>
  </a>`;
}

const brouillon = { text: "" };

function renderMots() {
  const me = moi() || PEOPLE[0]?.id;
  brouillon.who = brouillon.who || me;
  const liste = [...mots].sort((a, b) => b.time - a.time);
  const vuAvant = vuMots();
  try { localStorage.setItem("chiot-mots-vu", String(Date.now())); } catch {}
  majBadgeMots();
  const pressed = (b) => (b ? "true" : "false");
  const quand = (ms) => {
    const min = (Date.now() - ms) / 60000;
    if (min < 60) return ilYa(ms);
    if (startOfDay(ms) === startOfDay(Date.now())) return `aujourd’hui à ${hfr(ms)}`;
    if (startOfDay(ms) === startOfDay(Date.now()) - DAY) return `hier à ${hfr(ms)}`;
    return new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + ` à ${hfr(ms)}`;
  };

  $("#view").innerHTML = `
    <h1 class="title">Mots</h1>

    <form id="motf" class="card" style="display:flex;flex-direction:column;gap:14px">
      <label for="mot" class="eyebrow">Laisser un post-it</label>
      <textarea id="mot" class="input postit-input ${couleurMot(brouillon.who)}" rows="3" maxlength="280" placeholder="Ex. Iver a mangé à 12 h, pense à racheter des croquettes…">${esc(brouillon.text)}</textarea>
      <div class="choices">
        ${PEOPLE.map((p) => `<button type="button" class="choice" data-mwho="${esc(p.id)}" aria-pressed="${pressed(brouillon.who === p.id)}">
          <span class="who" style="background:${p.couleur}">${esc(p.initiale)}</span>${esc(p.nom)}</button>`).join("")}
      </div>
      <button type="submit" class="save" id="msave">Coller le post-it</button>
    </form>

    <div class="postits">
      ${liste.length ? liste.map((m, i) => {
        const p = person(m.who);
        const neuf = m.time > vuAvant && m.who !== me;
        const rot = [-2.2, 1.6, -1.2, 2.4, -1.8, 1.1][i % 6];
        return `<div class="postit ${couleurMot(m.who)}${neuf ? " neuf" : ""}" style="--rot:${rot}deg">
          <span class="scotch" aria-hidden="true"></span>
          <p>${esc(m.text)}</p>
          <div class="postit-pied">
            <span class="who" style="background:${p.couleur}" title="${esc(p.nom)}">${esc(p.initiale)}</span>
            <span>${esc(quand(m.time))}</span>
            <button class="del" data-delmot="${esc(m.id)}" aria-label="Décoller ce post-it">${ICON_TRASH}</button>
          </div>
        </div>`;
      }).join("") : `<div class="empty-msg" style="grid-column:1/-1">Aucun post-it pour l’instant. Laissez-vous un petit mot !</div>`}
    </div>`;

  const ta = $("#mot");
  ta.addEventListener("input", () => { brouillon.text = ta.value; });
  $("#view").querySelectorAll("[data-mwho]").forEach((b) => b.addEventListener("click", () => {
    brouillon.text = ta.value; brouillon.who = b.dataset.mwho;
    try { localStorage.setItem("chiot-who", brouillon.who); } catch {}
    renderMots();
  }));
  $("#view").querySelectorAll("[data-delmot]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Décoller ce post-it ?")) return;
    await store.remove(b.dataset.delmot);
    toast("Post-it décollé");
  }));
  $("#motf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    $("#msave").disabled = true;
    try {
      await store.add({ type: "mot", text, who: brouillon.who || null, time: Date.now(), createdAt: Date.now() });
      brouillon.text = "";
      try { localStorage.setItem("chiot-mots-vu", String(Date.now())); } catch {}
      toast("Post-it collé");
      renderMots();
    } catch (err) { console.error(err); toast("Échec de l’enregistrement"); $("#msave").disabled = false; }
  });
}

/* ---------- Guide de découverte ----------
   Met en lumière chaque élément de l'accueil avec une bulle d'explication.
   Se lance seul à la première ouverture et après les grosses mises à jour (GUIDE_V),
   sauf s'il a été désactivé depuis le bouton « ? ». */
const GUIDE_V = "2";
const guideOff = () => { try { return localStorage.getItem("chiot-guide-off") === "1"; } catch { return false; } };
const setGuideOff = (off) => { try { off ? localStorage.setItem("chiot-guide-off", "1") : localStorage.removeItem("chiot-guide-off"); } catch {} };
const marquerGuideVu = () => { try { localStorage.setItem("chiot-guide-vu", GUIDE_V); } catch {} };
const guideDejaVu = () => { try { return localStorage.getItem("chiot-guide-vu") === GUIDE_V; } catch { return true; } };
let aideOuverte = false;

function etapesGuide() {
  const nom = CFG.nomChiot || "votre chiot";
  return [
    { titre: `Bienvenue dans le journal ${/^[aeiouyhéèêàâîôû]/i.test(nom) ? "d’" : "de "}${nom} 🐾`, texte: "Petit tour rapide de l’app : une minute, promis. Vous pourrez le revoir à tout moment avec le bouton « ? » en haut." },
    { sel: "#mood", titre: "L’humeur du jour", texte: `Touchez la bulle pour dire comment va ${nom} aujourd’hui : joueuse, câline, fatiguée… C’est partagé entre vous deux.` },
    { sel: ".pills", titre: "Ajout rapide", texte: "Pipi, caca, repas, dodo, balade : touchez une pastille pour noter en deux secondes." },
    { sel: "#fab", titre: "Le gros +", texte: "Ouvre le formulaire complet : heure, dehors ou accident, quantité, durée, qui note, petite note…" },
    { sel: ".sleep-now", titre: "Dodo en cours", texte: `${nom} dort ! Le compteur tourne ; touchez « Elle s’est réveillée » au réveil.` },
    { sel: ".postit-apercu", titre: "Le dernier post-it", texte: "Le dernier mot laissé s’affiche ici. Touchez-le pour voir tous les post-it." },
    { sel: ".last", titre: "Dernier pipi", texte: "Depuis combien de temps, et quand la sortir selon son âge : après un repas, au réveil, ou quand ça fait trop longtemps." },
    { sel: ".stats", titre: "La journée en chiffres", texte: "Pipis (dehors / accidents), cacas, repas, sommeil et balades du jour." },
    { sel: ".wbars", carte: true, titre: "La semaine", texte: "Les pipis jour par jour (en rose : les accidents) et les moyennes sur les jours notés de la semaine." },
    { sel: ".ev.editable", titre: "Détail de la journée", texte: "Toutes les entrées du jour. Touchez une ligne pour la corriger ou la supprimer." },
    { sel: '.tabbar a[data-tab="calendrier"]', titre: "Calendrier", texte: "Vétérinaire, toiletteur, vaccins… Touchez un rendez-vous pour le modifier." },
    { sel: '.tabbar a[data-tab="mots"]', titre: "Mots", texte: "Laissez-vous des post-it. Une pastille rose signale les nouveaux mots de l’autre." },
    { sel: '.tabbar a[data-tab="historique"]', titre: "Historique", texte: "Chaque journée passée avec ses stats. Touchez un jour pour son détail complet." },
    { sel: "#theme", titre: "Clair ou sombre", texte: "Change le thème de l’app. Le choix est gardé sur chaque téléphone." },
    { sel: "#aide", titre: "Et voilà !", texte: "Touchez « ? » pour revoir le guide, le désactiver / réactiver, ou partager le lien de l’app.", fin: true }
  ];
}

const guide = { i: 0, etapes: [], el: null };

function lancerGuide() {
  if (!/^#?\/?$/.test(location.hash)) { location.hash = "#/"; setTimeout(lancerGuide, 350); return; }
  aideOuverte = false; humeurOuverte = false;
  renderAccueil();
  // On garde seulement les étapes dont l'élément est à l'écran
  guide.etapes = etapesGuide().filter((e) => !e.sel || document.querySelector(e.sel));
  guide.i = 0;
  if (!guide.el) {
    guide.el = document.createElement("div");
    guide.el.className = "guide";
    guide.el.innerHTML = `<div class="guide-voile"></div><div class="guide-spot"></div>
      <div class="guide-bulle" role="dialog" aria-modal="true" aria-labelledby="guide-titre"></div>`;
    document.body.appendChild(guide.el);
    window.addEventListener("resize", placerGuide);
    window.addEventListener("scroll", placerGuide, { passive: true });
    document.addEventListener("keydown", (e) => {
      if (!guide.el?.classList.contains("on")) return;
      if (e.key === "Escape") fermerGuide();
      if (e.key === "ArrowRight") etapeGuide(1);
      if (e.key === "ArrowLeft") etapeGuide(-1);
    });
  }
  guide.el.classList.add("on");
  afficherEtape();
}

function cibleGuide(e) {
  const el = e.sel && document.querySelector(e.sel);
  return el && e.carte ? el.closest(".card") : el;
}

function afficherEtape() {
  const e = guide.etapes[guide.i];
  const n = guide.etapes.length;
  const bulle = guide.el.querySelector(".guide-bulle");
  bulle.innerHTML = `
    <div class="guide-points" aria-hidden="true">${guide.etapes.map((_, k) => `<i class="${k === guide.i ? "on" : ""}"></i>`).join("")}</div>
    <h2 id="guide-titre" class="h2">${esc(e.titre)}</h2>
    <p>${esc(e.texte)}</p>
    <div class="guide-actions">
      ${e.fin ? "" : `<button type="button" class="guide-passer" id="gPasser">Passer</button>`}
      <span style="flex:1"></span>
      ${guide.i > 0 ? `<button type="button" class="btn-soft" id="gPrec">Précédent</button>` : ""}
      <button type="button" class="save" id="gSuiv">${e.fin ? "C’est parti !" : guide.i === 0 ? "Suivez le guide" : "Suivant"}</button>
    </div>
    ${guide.i === 0 ? `<button type="button" class="guide-off" id="gOff">Ne plus me proposer le guide</button>` : ""}
    <span class="sr" aria-live="polite">Étape ${guide.i + 1} sur ${n}</span>`;
  bulle.querySelector("#gSuiv").addEventListener("click", () => etapeGuide(1));
  bulle.querySelector("#gPrec")?.addEventListener("click", () => etapeGuide(-1));
  bulle.querySelector("#gPasser")?.addEventListener("click", fermerGuide);
  bulle.querySelector("#gOff")?.addEventListener("click", () => { setGuideOff(true); fermerGuide(); toast("Guide désactivé (réactivable avec « ? »)"); });
  const cible = cibleGuide(e);
  if (cible) {
    const r = cible.getBoundingClientRect();
    const fixe = getComputedStyle(cible).position === "fixed" || cible.closest(".dock");
    if (!fixe && (r.top < 90 || r.bottom > innerHeight - 260)) {
      window.scrollTo({ top: window.scrollY + r.top - Math.max(100, innerHeight * 0.22), behavior: mouvementReduit() ? "auto" : "smooth" });
    }
  }
  placerGuide();
  setTimeout(placerGuide, 380);
  bulle.querySelector("#gSuiv").focus({ preventScroll: true });
}

function placerGuide() {
  if (!guide.el?.classList.contains("on")) return;
  const e = guide.etapes[guide.i];
  const spot = guide.el.querySelector(".guide-spot");
  const bulle = guide.el.querySelector(".guide-bulle");
  const cible = cibleGuide(e);
  const W = innerWidth, H = innerHeight;
  const bw = Math.min(360, W - 32);
  bulle.style.width = bw + "px";
  if (!cible) {
    spot.style.cssText = `left:${W / 2}px;top:${H / 2}px;width:0;height:0;border-radius:50%`;
    bulle.style.left = (W - bw) / 2 + "px";
    bulle.style.top = Math.max(24, (H - bulle.offsetHeight) / 2) + "px";
    return;
  }
  const r = cible.getBoundingClientRect();
  const pad = 8;
  const rad = getComputedStyle(cible).borderRadius || "18px";
  spot.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;border-radius:${parseFloat(rad) > 60 ? "999px" : `calc(${rad} + ${pad}px)`}`;
  const bh = bulle.offsetHeight;
  const enDessous = r.top + r.height / 2 < H / 2;
  let top = enDessous ? r.bottom + pad + 14 : r.top - pad - 14 - bh;
  top = Math.min(Math.max(16, top), H - bh - 16);
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.min(Math.max(16, left), W - bw - 16);
  bulle.style.left = left + "px";
  bulle.style.top = top + "px";
  bulle.dataset.fleche = enDessous ? "haut" : "bas";
  bulle.style.setProperty("--fx", `${Math.min(Math.max(24, r.left + r.width / 2 - left), bw - 24)}px`);
}

function etapeGuide(d) {
  const j = guide.i + d;
  if (j >= guide.etapes.length) { fermerGuide(); eclat(innerWidth / 2, innerHeight / 2, "patte"); return; }
  if (j < 0) return;
  guide.i = j;
  afficherEtape();
}

function fermerGuide() {
  guide.el?.classList.remove("on");
  marquerGuideVu();
  window.scrollTo({ top: 0, behavior: mouvementReduit() ? "auto" : "smooth" });
}

/* ---------- Routeur ---------- */

function route() {
  let h = location.hash.replace(/^#\/?/, "");
  const jour = h.startsWith("jour/") ? Number(h.slice(5)) : null;
  if ((h === "ajouter" || h.startsWith("ajouter/")) && form.editId) resetForm();
  if ((h === "ajouter" || h.startsWith("ajouter/")) && route.lastHash !== "ajouter") {
    const prev = route.lastHash || "";
    if (prev.startsWith("jour/")) { form.date = ymd(Number(prev.slice(5))); form.retourJour = "#/" + prev; }
    else { form.date = undefined; form.retourJour = undefined; }
  }
  if (h === "modifier" && !form.editId) h = "ajouter";
  if (h !== "modifier" && form.editId) resetForm();
  if (h.startsWith("ajouter/")) {
    const ty = h.slice(8);
    if (TYPES[ty]) form.type = ty;
    history.replaceState(null, "", "#/ajouter");
    h = "ajouter";
  }
  const tab = jour ? "historique" : h === "modifier" ? "ajouter" : ["ajouter", "historique", "calendrier", "mots"].includes(h) ? h : "accueil";
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  $("#fab").classList.toggle("on", tab === "ajouter");
  if (tab === "ajouter") renderAjouter();
  else if (tab === "calendrier") renderCalendrier();
  else if (tab === "mots") renderMots();
  else if (jour) renderJour(startOfDay(jour));
  else if (tab === "historique") renderHistorique();
  else renderAccueil();
  if (route.lastHash !== h) window.scrollTo(0, 0);
  route.lastTab = tab; route.lastHash = h;
  majBadgeMots();
}

/* ---------- Transition « coup de patte » ----------
   La nouvelle page s'affiche tout de suite (fondu rapide) ; au point touché,
   une patte se tamponne et des gouttes giclent autour. Rien ne bloque l'écran. */
let dernierTap = null;
document.addEventListener("pointerdown", (e) => { dernierTap = { x: e.clientX, y: e.clientY, t: Date.now() }; }, { capture: true, passive: true });

function coupDePatte(afficher) {
  // Type visé (pastille « Pipi », « Caca »…) lu avant l'affichage, qui nettoie l'adresse
  const vise = (location.hash.match(/ajouter\/(\w+)/) || [])[1];
  afficher();
  const view = $("#view");
  if (mouvementReduit() || !view.animate) return;
  window.scrollTo(0, 0);
  view.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
    { duration: 200, easing: "cubic-bezier(.2,.7,.3,1)" });
  const tap = dernierTap && Date.now() - dernierTap.t < 1500 ? dernierTap : null;
  dernierTap = null;
  if (!tap) return;
  eclat(tap.x, tap.y, TYPES[vise] ? vise : (/ajouter/.test(location.hash) ? "patte-jaune" : "patte"));
}

const mouvementReduit = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasard = (a, b) => a + Math.random() * (b - a);

// Petites formes pleines pour les éclats
const FORMES = {
  goutte: '<path d="M12 2.5c3.6 4.6 7 8.2 7 12.2a7 7 0 0 1-14 0c0-4 3.4-7.6 7-12.2z"/>',
  pate: '<path d="M3.5 20h17a3 3 0 0 0 0-6h-1.2a3 3 0 0 0-1-5.6H16a2.6 2.6 0 0 0-2-4.4c.3 1.6-.6 2.4-1.9 2.4h-1A3 3 0 0 0 9.5 12H7.6a3 3 0 0 0-4.1 8z"/>',
  z: '<path d="M5 5h14L5 19h14" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>'
};
const formeSvg = (f) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${f === "patte" ? PATTE : FORMES[f]}</svg>`;

// Éclat au point touché : grosse icône tamponnée + particules adaptées au type
function eclat(x, y, kind) {
  if (mouvementReduit()) return;
  const fx = $("#fx");
  if (!fx || !fx.animate) return;
  const els = [];
  const cfg = {
    pipi:   { couleur: "var(--pipi)",   n: 13, forme: "goutte", taille: [13, 24], dist: [55, 120], gravite: 70 },
    caca:   { couleur: "var(--caca)",   n: 10, forme: "pate",   taille: [18, 30], dist: [50, 110], gravite: 90 },
    repas:  { couleur: "#C8873F",       n: 16, forme: "croquette", taille: [10, 16], dist: [45, 105], gravite: 140 },
    sieste: { couleur: "var(--sieste)", n: 8,  forme: "z",      taille: [14, 24], dist: [50, 105], gravite: -60 },
    balade: { couleur: "var(--balade)", n: 9,  forme: "patte",  taille: [16, 24], dist: [50, 105], gravite: 20 },
    "patte-jaune": { couleur: "var(--yellow)", n: 10, forme: "rond", taille: [6, 16], dist: [46, 100], gravite: 0 },
    patte:  { couleur: "var(--pink)",   n: 10, forme: "rond",   taille: [6, 16], dist: [46, 100], gravite: 0 }
  }[kind] || {};

  // le tampon central : l'icône du type, ou la patte
  const tampon = document.createElement("div");
  tampon.className = "fx-paw";
  tampon.style.cssText = `left:${x}px;top:${y}px;color:${cfg.couleur}`;
  tampon.innerHTML = TYPES[kind] ? svgIcon(kind, 78).replace('class="ic ', 'class="ic fx-ic ') : `<svg viewBox="0 0 24 24" aria-hidden="true">${PATTE}</svg>`;
  fx.appendChild(tampon); els.push(tampon);
  const rot = Math.round(hasard(-20, 20));
  tampon.animate([
    { transform: `translate(-50%,-50%) scale(.2) rotate(${rot}deg)`, opacity: 1 },
    { transform: `translate(-50%,-50%) scale(1.2) rotate(${rot}deg)`, opacity: 1, offset: .35 },
    { transform: `translate(-50%,-50%) scale(1) rotate(${rot}deg)`, opacity: .95, offset: .6 },
    { transform: `translate(-50%,-50%) scale(1.05) rotate(${rot}deg)`, opacity: 0 }
  ], { duration: 420, easing: "ease-out", fill: "forwards" });

  for (let i = 0; i < cfg.n; i++) {
    const g = document.createElement("i");
    const ang = (i / cfg.n) * Math.PI * 2 + hasard(0, .6);
    const dist = hasard(...cfg.dist);
    const t = hasard(...cfg.taille);
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    g.className = "fx-part";
    g.style.cssText = `left:${x}px;top:${y}px;width:${t}px;height:${t}px;color:${cfg.couleur}`;
    let rotation = 0, depart = "";
    if (cfg.forme === "rond") { g.style.background = cfg.couleur; g.style.borderRadius = "50%"; depart = `rotate(${ang * 57.3}deg) scale(1.8,.6)`; }
    else if (cfg.forme === "croquette") {
      g.style.background = cfg.couleur; g.style.borderRadius = "45% 55% 50% 50%";
      g.style.boxShadow = "inset -2px -2px 0 rgba(0,0,0,.25)"; g.style.height = `${t * .8}px`;
      rotation = hasard(-360, 360);
    } else {
      g.innerHTML = formeSvg(cfg.forme);
      // la goutte part la pointe vers l'arrière
      rotation = cfg.forme === "goutte" ? ang * 57.3 + 90 : hasard(-50, 50);
    }
    fx.appendChild(g); els.push(g);
    const base = `translate(-50%,-50%)`;
    const r0 = depart || `rotate(${cfg.forme === "goutte" ? rotation : 0}deg) scale(.5)`;
    g.animate([
      { transform: `${base} ${r0}`, opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * .75}px),calc(-50% + ${dy * .75 - Math.abs(cfg.gravite) * .15}px)) rotate(${rotation * .6}deg) scale(1)`, opacity: 1, offset: .5 },
      { opacity: 1, offset: .75 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy + cfg.gravite}px)) rotate(${rotation}deg) scale(.6)`, opacity: 0 }
    ], { duration: hasard(420, 560), easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
  }

  // un peu d'odeur pour le caca
  if (kind === "caca") {
    for (const dx of [-18, 0, 18]) {
      const o = document.createElement("i");
      o.className = "fx-part";
      o.style.cssText = `left:${x + dx}px;top:${y - 30}px;width:14px;height:26px;color:var(--caca)`;
      o.innerHTML = '<svg viewBox="0 0 10 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 22c-3-2.5 3-4.5 0-7s3-4.5 0-7 3-4.5 0-6"/></svg>';
      fx.appendChild(o); els.push(o);
      o.animate([{ transform: "translate(-50%,0)", opacity: 0 }, { transform: "translate(-50%,-14px)", opacity: .9, offset: .4 }, { transform: "translate(-50%,-34px)", opacity: 0 }],
        { duration: 650, delay: 80 + (dx + 18) * 4, easing: "ease-out", fill: "both" });
    }
  }
  setTimeout(() => els.forEach((e) => e.remove()), 900);
}

/* ---------- Thème clair / sombre (mémorisé sur chaque téléphone) ---------- */
function theme() { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("chiot-theme", t); } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#F6F3F1" : "#0A0A0F");
}

/* ---------- Mise à jour automatique ----------
   Chaque version de l'app porte un numéro (?v=… dans index.html, et version.json).
   Quand l'app revient au premier plan, on vérifie si une version plus récente est en ligne
   et on recharge la page si c'est le cas. */
const APP_VERSION = new URL(import.meta.url).searchParams.get("v");
async function verifierMiseAJour() {
  if (!APP_VERSION) return;
  try {
    const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
    const { v } = await r.json();
    if (v && v !== APP_VERSION) {
      // Une seule tentative par version, pour ne jamais boucler si le téléphone garde l'ancienne page.
      let deja = null;
      try { deja = sessionStorage.getItem("chiot-maj"); } catch {}
      if (deja === v) return;
      try { sessionStorage.setItem("chiot-maj", v); } catch {}
      await fetch("./", { cache: "reload" }).catch(() => {});
      await fetch("index.html", { cache: "reload" }).catch(() => {});
      location.reload();
    }
  } catch {}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") verifierMiseAJour(); });

const enSaisie = () => { const a = document.activeElement; return !!(a && a.closest && a.closest("#view") && /INPUT|TEXTAREA/.test(a.tagName)); };

async function start() {
  if (CFG.firebase) {
    try { store = await firebaseStore(); }
    catch (err) { console.error(err); toast("Firebase indisponible : mode local"); store = localStore(); }
  } else {
    store = localStore();
  }
  store.subscribe((list) => {
    const all = list.filter((e) => typeof e.time === "number");
    events = all.filter((e) => e.type !== "rdv" && e.type !== "mot" && e.type !== "parcours" && e.type !== "humeur");
    humeurs = all.filter((e) => e.type === "humeur");
    rdvs = all.filter((e) => e.type === "rdv");
    mots = all.filter((e) => e.type === "mot");
    majBadgeMots();
    // Ne pas effacer un formulaire en cours de saisie
    // Ne pas effacer un formulaire en cours de saisie
    if (route.lastTab !== "ajouter" && !(route.lastTab === "calendrier" && cal.adding) && !enSaisie()) route();
  });
  window.addEventListener("hashchange", () => coupDePatte(route));
  route();
  verifierMiseAJour();
  if (!guideOff() && !guideDejaVu()) setTimeout(lancerGuide, 900);
  // Rafraîchit "il y a X min" chaque minute
  setInterval(() => { if (route.lastTab === "accueil" && !enSaisie()) renderAccueil(); }, 60000);
}

start();
