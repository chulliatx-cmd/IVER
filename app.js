// Journal du chiot — app sans build, à héberger sur GitHub Pages.
const CFG = window.CHIOT_CONFIG || {};
const PEOPLE = CFG.personnes || [];
const RAPPEL = CFG.rappelPipiMinutes || 90;

const TYPES = {
  pipi:   { label: "Pipi",   color: "#E0A100", bg: "#FFF4D4", ink: "#6B4C00" },
  caca:   { label: "Caca",   color: "#8A5A3C", bg: "#F3E8E0", ink: "#5A3820" },
  repas:  { label: "Repas",  color: "#2E8B57", bg: "#E3F3EA", ink: "#1F5C3A" },
  sieste: { label: "Sieste", color: "#6B4FC2", bg: "#ECE8FB", ink: "#3F2E8A" },
  balade: { label: "Balade", color: "#C2552B", bg: "#FDE9DF", ink: "#7A2E10" }
};
const FEMININ = { sieste: true, balade: true };
const RDV = {
  veto:       { label: "Vétérinaire", color: "#C23B5A" },
  toiletteur: { label: "Toiletteur",  color: "#1F7F92" },
  vaccin:     { label: "Vaccin",      color: "#2F5BC4" },
  autre:      { label: "Autre",       color: "#5C6B62" }
};
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

/* ---------- Utilitaires ---------- */

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hfr = (ms) => { const d = new Date(ms); return `${d.getHours()} h ${pad(d.getMinutes())}`; };
const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const DAY = 86400000;
const person = (id) => PEOPLE.find((p) => p.id === id) || { initiale: "?", couleur: "#5C6B62", nom: "" };

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

const ICON_PAW = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9c-1.5 0-2.5-2-2-4 1.5 0 3 1 3.5 2.5"/><path d="M19 9c1.5 0 2.5-2 2-4-1.5 0-3 1-3.5 2.5"/><path d="M6.5 8.5C7.5 6.5 9.5 5.5 12 5.5s4.5 1 5.5 3c.8 1.6.5 4.5-.5 6.5-1.1 2.2-3 3.5-5 3.5s-3.9-1.3-5-3.5c-1-2-1.3-4.9-.5-6.5z"/><circle cx="9.7" cy="11" r="0.6" fill="currentColor"/><circle cx="14.3" cy="11" r="0.6" fill="currentColor"/><path d="M11 14.5h2l-1 1z"/></svg>`;
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
  return `<div class="ev">
    <span class="t">${hhmm(ev.time)}</span>
    <span class="dot" style="background:${t.color}"></span>
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
    { k: "Pipis", c: TYPES.pipi.color, v: st.pipis.length, s: `${st.pipis.length - st.pipiAcc} dehors · ${st.pipiAcc} ${plur(st.pipiAcc, "accident")}` },
    { k: "Cacas", c: TYPES.caca.color, v: st.cacas.length, s: st.cacas[0] ? `dernier à ${hfr(st.cacas[0].time)}` : rien("aucun") },
    { k: "Repas", c: TYPES.repas.color, v: st.repas.length, s: st.repas[0] ? `dernier à ${hfr(st.repas[0].time)}` : rien("aucun") },
    { k: "Sommeil", c: TYPES.sieste.color, v: st.sleepMin ? dureeTxt(st.sleepMin) : "0 h", s: `${st.nbSiestes} ${plur(st.nbSiestes, "sieste")}` },
    { k: "Balades", c: TYPES.balade.color, wide: true,
      v: st.balades.length ? dureeTxt(st.baladeMin) : "0 min",
      s: st.balades.length ? `${st.balades.length} ${plur(st.balades.length, "balade")} · dernière à ${hfr(st.balades[0].time)}` : rien("aucune") }
  ];
  return `<div class="stats">
    ${tiles.map((s) => `<div class="card stat${s.wide ? " wide" : ""}">
      <div class="k"><span class="dot" style="background:${s.c}"></span>${s.k}</div>
      <span class="v">${s.v}</span><span class="s">${s.s}</span>
    </div>`).join("")}
  </div>`;
}

// Moyennes par jour de la semaine en cours (jours terminés, lundi → hier).
// Le lundi, on affiche la semaine dernière.
function weekAverages(today) {
  const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY;
  let from = monday, to = today, titre = "Cette semaine";
  if (monday === today) { from = monday - 7 * DAY; to = monday; titre = "Semaine dernière"; }
  const days = [];
  for (let d = from; d < to; d += DAY) {
    const st = dayStats(d);
    if (st.list.length || st.sleepMin) days.push(st);
  }
  if (!days.length) {
    return `<div class="card"><h2 class="h2">${titre} · moyennes</h2>
      <p class="empty-msg" style="padding:12px 0 0;text-align:left">Les moyennes apparaîtront dès qu’une journée complète aura été notée.</p></div>`;
  }
  const n = days.length;
  const avg = (f) => days.reduce((s, st) => s + f(st), 0) / n;
  const items = [
    { k: "Pipis", c: TYPES.pipi.color, v: nf(avg((s) => s.pipis.length)) },
    { k: "Accidents", c: "#C23B5A", v: nf(avg((s) => s.pipiAcc + s.cacaAcc)) },
    { k: "Cacas", c: TYPES.caca.color, v: nf(avg((s) => s.cacas.length)) },
    { k: "Repas", c: TYPES.repas.color, v: nf(avg((s) => s.repas.length)) },
    { k: "Balade", c: TYPES.balade.color, v: dureeTxt(avg((s) => s.baladeMin)) },
    { k: "Sommeil", c: TYPES.sieste.color, v: dureeTxt(avg((s) => s.sleepMin)) }
  ];
  return `<div class="card">
    <div class="row-between">
      <h2 class="h2">${titre} · moyenne par jour</h2>
    </div>
    <span class="sync">Sur ${n} ${plur(n, "journée")} ${plur(n, "complète")} notée${n > 1 ? "s" : ""}</span>
    <div class="avg">
      ${items.map((i) => `<div class="avg-i">
        <span class="k"><span class="dot" style="background:${i.c}"></span>${i.k}</span>
        <span class="v">${i.v}</span>
      </div>`).join("")}
    </div>
  </div>`;
}

function bindDelete() {
  $("#view").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await store.remove(b.dataset.del);
    toast("Entrée supprimée");
  }));
}

/* ---------- Sieste en cours ---------- */

const ICON_MOON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>`;
const siesteEnCours = () => events.filter((e) => e.type === "sieste" && e.end == null).sort((a, b) => b.time - a.time)[0];

function sleepNowCard(ev) {
  const nom = esc(CFG.nomChiot || "Le chiot");
  return `<div class="card sleep-now">
    <div class="row-top">
      <div class="ico">${ICON_MOON}</div>
      <div class="txt">
        <span class="lbl">Sieste en cours · endormie à ${hfr(ev.time)}</span>
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
      toast(`Sieste terminée · ${dureeTxt((end - ev.time) / 60000)}`);
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
    if (lastPipi) {
      const late = (now - lastPipi.time) / 60000 >= RAPPEL;
      lastHtml = `<span class="val">${ilYa(lastPipi.time)} · ${hfr(lastPipi.time)}</span></div>
        <span class="badge ${late ? "warn" : "ok"}">${late ? "Sortir bientôt" : "Tout va bien"}</span>`;
    } else {
      lastHtml = `<span class="val">Pas encore noté</span></div>`;
    }
    const nextRdv = rdvs.filter((r) => r.time >= now - 3600000).sort((a, b) => a.time - b.time)[0];
    const dort = siesteEnCours();
    top = `
    <div class="head">
      <div class="left">
        <span class="eyebrow">${esc(dateTxt)}</span>
        <h1 class="title">La journée de ${esc(CFG.nomChiot || "mon chiot")}</h1>
        <span class="sync ${store.online ? "" : "off"}">${store.online ? "Synchronisé" : "Mode local (non partagé)"}</span>
        <button type="button" class="share" id="share">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/></svg>
          Partager le lien
        </button>
      </div>
      <div class="avatar">${ICON_PAW}</div>
    </div>

    ${dort ? sleepNowCard(dort) : ""}

    <div class="card last">
      <div class="ico">${ICON_CLOCK}</div>
      <div class="txt"><span class="lbl">Dernier pipi</span>${lastHtml}
    </div>

    ${nextRdv ? `<a href="#/calendrier" class="card rdv-next">
      <div class="ico" style="background:${RDV[nextRdv.rdvType]?.color || "#5C6B62"}">${ICON_CAL}</div>
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
        <span class="eyebrow">Journée passée</span>
        <h1 class="title day-h">${esc(dateTxt)}</h1>
      </div>
    </div>
    <div class="daynav">
      <a href="#/jour/${prev}" class="btn-soft">‹ Veille</a>
      ${next < today ? `<a href="#/jour/${next}" class="btn-soft">Lendemain ›</a>` : `<a href="#/" class="btn-soft">Aujourd’hui ›</a>`}
    </div>`;
  }

  $("#view").innerHTML = `
    ${top}
    ${statTiles(st, isToday)}
    ${isToday ? weekAverages(today) : ""}
    <div class="list">
      <div class="row-between">
        <h2 class="h2">Détail de la journée</h2>
        ${isToday ? `<a href="#/historique" style="font-size:13px;font-weight:700">Jours passés</a>` : ""}
      </div>
      ${st.list.length ? st.list.map((e) => eventRow(e, true)).join("") : `<div class="empty-msg">${isToday ? "Rien de noté aujourd’hui. Appuyez sur « Ajouter »." : "Rien de noté ce jour-là."}</div>`}
    </div>`;

  $("#share")?.addEventListener("click", partagerLien);
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
  const chip = (c, txt) => `<span class="chip"><i style="background:${c}"></i>${txt}</span>`;

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
            ${chip(TYPES.pipi.color, `${st.pipis.length} ${plur(st.pipis.length, "pipi")}`)}
            ${acc ? chip("#C23B5A", `${acc} ${plur(acc, "accident")}`) : ""}
            ${chip(TYPES.caca.color, `${st.cacas.length} ${plur(st.cacas.length, "caca")}`)}
            ${chip(TYPES.repas.color, `${st.repas.length} repas`)}
            ${st.baladeMin ? chip(TYPES.balade.color, `${dureeTxt(st.baladeMin)} de balade`) : ""}
            ${st.sleepMin ? chip(TYPES.sieste.color, `${dureeTxt(st.sleepMin)} de sommeil`) : ""}
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

function renderAjouter() {
  form.who = form.who || (() => { try { return localStorage.getItem("chiot-who"); } catch { return null; } })() || PEOPLE[0]?.id;
  const t = form.type;
  const pressed = (b) => (b ? "true" : "false");
  const dort = siesteEnCours();
  const sMode = dort ? "terminee" : (form.sMode || "encours");

  $("#view").innerHTML = `
    <div class="formhead">
      <a href="#/" class="back" aria-label="Retour à l’accueil"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></a>
      <h1 class="title">Nouvelle entrée</h1>
    </div>

    <form id="f" style="display:flex;flex-direction:column;gap:18px">
      <div class="field">
        <span class="eyebrow">Quoi ?</span>
        <div class="types">
          ${Object.entries(TYPES).map(([id, v]) => {
            const on = id === t;
            return `<button type="button" class="type" data-type="${id}" aria-pressed="${pressed(on)}"
              style="${on ? `border-color:${v.color};background:${v.bg};color:${v.ink}` : ""}">
              <span class="sq" style="background:${v.color}"></span>${v.label}</button>`;
          }).join("")}
        </div>
      </div>

      ${t === "sieste" && dort ? sleepNowCard(dort) : ""}

      ${t === "sieste" && !dort ? `
        <div class="field">
          <span class="eyebrow">La sieste…</span>
          <div class="choices">
            <button type="button" class="choice" data-smode="encours" aria-pressed="${pressed(sMode === "encours")}">Commence</button>
            <button type="button" class="choice" data-smode="terminee" aria-pressed="${pressed(sMode === "terminee")}">Est terminée</button>
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
        ${dort ? `<span class="eyebrow">Ou noter une autre sieste déjà terminée</span>` : ""}
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
        ${t === "sieste" && sMode === "encours" ? "Commencer la sieste" : `Enregistrer ${FEMININ[t] ? "la" : "le"} ${TYPES[t].label.toLowerCase()}`}
      </button>
    </form>`;

  // Garde les valeurs saisies quand on change de type
  const keep = () => {
    form.heure = $("#heure")?.value ?? form.heure;
    form.debut = $("#debut")?.value ?? form.debut;
    form.fin = $("#fin")?.value ?? form.fin;
    form.qty = $("#qte")?.value ?? form.qty;
    form.dur = $("#dur")?.value ?? form.dur;
    form.note = $("#note")?.value ?? form.note;
  };
  const bind = (attr, key) => $("#view").querySelectorAll(`[data-${attr}]`).forEach((b) =>
    b.addEventListener("click", () => {
      keep();
      form[key] = b.dataset[attr];
      if (key === "who") { try { localStorage.setItem("chiot-who", form.who); } catch {} }
      renderAjouter();
    }));
  bind("type", "type"); bind("place", "place"); bind("eaten", "eaten"); bind("who", "who"); bind("dur", "dur"); bind("smode", "sMode");
  bindWake();
  $("#nowDebut")?.addEventListener("click", () => { $("#debut").value = nowHHMM(); });

  $("#now")?.addEventListener("click", () => { $("#heure").value = nowHHMM(); });

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
    const ev = { type: form.type, who: form.who || null, note: (form.note || "").trim(), createdAt: Date.now() };
    if (form.type === "sieste" && sMode === "encours") {
      ev.time = hhmmToMs(form.debut);
      ev.end = null;
    } else if (form.type === "sieste") {
      ev.time = hhmmToMs(form.debut);
      let end = hhmmToMs(form.fin, ev.time);
      if (end < ev.time) end += DAY;
      ev.end = end;
    } else {
      ev.time = hhmmToMs(form.heure);
    }
    if (form.type === "pipi" || form.type === "caca") ev.place = form.place;
    if (form.type === "balade") {
      const m = Math.max(1, Number(form.dur) || 30);
      ev.end = ev.time + m * 60000;
    }
    if (form.type === "repas") { ev.qty = form.qty ? Number(form.qty) : null; ev.eaten = form.eaten; }

    $("#save").disabled = true;
    try {
      await store.add(ev);
      toast(ev.type === "sieste" && ev.end == null ? "Bonne sieste ! Notez le réveil depuis l’accueil" : `${TYPES[form.type].label} enregistré${FEMININ[form.type] ? "e" : ""}`);
      form.heure = form.debut = form.fin = form.note = form.qty = undefined;
      location.hash = "#/";
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
  return `<div class="ev">
    <span class="dot" style="background:${t.color}"></span>
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
      <h2 class="h2">Nouveau rendez-vous</h2>
      <div class="field">
        <span class="eyebrow">Type</span>
        <div class="choices">
          ${Object.entries(RDV).map(([k, v]) => `<button type="button" class="choice" data-rdvtype="${k}" aria-pressed="${pressed(cal.rdvType === k)}">
            <span class="dot" style="background:${v.color}"></span>${v.label}</button>`).join("")}
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
  $("#radd")?.addEventListener("click", () => { cal.adding = true; renderCalendrier(); $("#rdvf").scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("#rcancel")?.addEventListener("click", () => { cal.adding = false; cal.titre = cal.note = undefined; renderCalendrier(); });
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
    const r = { type: "rdv", rdvType: cal.rdvType, time, title: (cal.titre || "").trim(), note: (cal.note || "").trim(), who: cal.who || null, createdAt: Date.now() };
    $("#rsave").disabled = true;
    try {
      await store.add(r);
      cal.adding = false; cal.titre = cal.note = undefined;
      cal.sel = startOfDay(time); cal.month = new Date(yy, mm - 1, 1).getTime();
      toast("Rendez-vous ajouté");
      renderCalendrier();
    } catch (err) {
      console.error(err); toast("Échec de l’enregistrement"); $("#rsave").disabled = false;
    }
  });
}

/* ---------- Routeur ---------- */

function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const jour = h.startsWith("jour/") ? Number(h.slice(5)) : null;
  const tab = jour ? "historique" : ["ajouter", "historique", "calendrier"].includes(h) ? h : "accueil";
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  $("#fab").classList.toggle("hidden", tab === "ajouter" || tab === "calendrier");
  if (tab === "ajouter") renderAjouter();
  else if (tab === "calendrier") renderCalendrier();
  else if (jour) renderJour(startOfDay(jour));
  else if (tab === "historique") renderHistorique();
  else renderAccueil();
  if (route.lastHash !== h) window.scrollTo(0, 0);
  route.lastTab = tab; route.lastHash = h;
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
    events = all.filter((e) => e.type !== "rdv");
    rdvs = all.filter((e) => e.type === "rdv");
    // Ne pas effacer un formulaire en cours de saisie
    // Ne pas effacer un formulaire en cours de saisie
    if (route.lastTab !== "ajouter" && !(route.lastTab === "calendrier" && cal.adding) && !enSaisie()) route();
  });
  window.addEventListener("hashchange", route);
  route();
  verifierMiseAJour();
  // Rafraîchit "il y a X min" chaque minute
  setInterval(() => { if (route.lastTab === "accueil" && !enSaisie()) renderAccueil(); }, 60000);
}

start();
