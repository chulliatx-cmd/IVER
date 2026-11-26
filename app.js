// Journal du chiot — app sans build, à héberger sur GitHub Pages.
const CFG = window.CHIOT_CONFIG || {};
const PEOPLE = CFG.personnes || [];
const RAPPEL = CFG.rappelPipiMinutes || 90;

const TYPES = {
  pipi:   { label: "Pipi",   color: "#E0A100", bg: "#FFF4D4", ink: "#6B4C00" },
  caca:   { label: "Caca",   color: "#8A5A3C", bg: "#F3E8E0", ink: "#5A3820" },
  repas:  { label: "Repas",  color: "#2E8B57", bg: "#E3F3EA", ink: "#1F5C3A" },
  sieste: { label: "Sieste", color: "#6B4FC2", bg: "#ECE8FB", ink: "#3F2E8A" }
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
    async remove(id) { write(read().filter((e) => e.id !== id)); emit(); }
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
    async remove(id) { await fs.deleteDoc(fs.doc(col, id)); }
  };
}

let store;
let events = [];

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
  const s = Math.max(ev.time, from), e = Math.min(ev.end || ev.time, to);
  return Math.max(0, e - s);
}
function detail(ev) {
  const parts = [];
  if (ev.type === "pipi" || ev.type === "caca") parts.push(ev.place === "dedans" ? "Accident dedans" : "Dehors");
  if (ev.type === "repas") {
    if (ev.qty) parts.push(`${ev.qty} g`);
    if (ev.eaten) parts.push(MANGE[ev.eaten]);
  }
  if (ev.type === "sieste" && ev.end) parts.push(`${dureeTxt((ev.end - ev.time) / 60000)} · jusqu’à ${hhmm(ev.end)}`);
  if (ev.note) parts.push(ev.note);
  return parts.join(" · ");
}

const ICON_PAW = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9c-1.5 0-2.5-2-2-4 1.5 0 3 1 3.5 2.5"/><path d="M19 9c1.5 0 2.5-2 2-4-1.5 0-3 1-3.5 2.5"/><path d="M6.5 8.5C7.5 6.5 9.5 5.5 12 5.5s4.5 1 5.5 3c.8 1.6.5 4.5-.5 6.5-1.1 2.2-3 3.5-5 3.5s-3.9-1.3-5-3.5c-1-2-1.3-4.9-.5-6.5z"/><circle cx="9.7" cy="11" r="0.6" fill="currentColor"/><circle cx="14.3" cy="11" r="0.6" fill="currentColor"/><path d="M11 14.5h2l-1 1z"/></svg>`;
const ICON_CLOCK = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
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

/* ---------- Écran : Accueil ---------- */

function renderAccueil() {
  const now = Date.now();
  const today = startOfDay(now);
  const todays = events.filter((e) => e.time >= today).sort((a, b) => b.time - a.time);
  const of = (type) => todays.filter((e) => e.type === type);

  const pipis = of("pipi"), cacas = of("caca"), repas = of("repas");
  const accidents = pipis.filter((e) => e.place === "dedans").length + cacas.filter((e) => e.place === "dedans").length;
  const siestes = events.filter((e) => e.type === "sieste");
  const sleepMs = siestes.reduce((s, e) => s + sleepOverlap(e, today, now), 0);
  const nbSiestes = siestes.filter((e) => sleepOverlap(e, today, now) > 0).length;

  const lastPipi = events.filter((e) => e.type === "pipi").sort((a, b) => b.time - a.time)[0];
  let lastHtml;
  if (lastPipi) {
    const late = (now - lastPipi.time) / 60000 >= RAPPEL;
    lastHtml = `<span class="val">${ilYa(lastPipi.time)} · ${hfr(lastPipi.time)}</span>`;
    lastHtml += `</div><span class="badge ${late ? "warn" : "ok"}">${late ? "Sortir bientôt" : "Tout va bien"}</span>`;
  } else {
    lastHtml = `<span class="val">Pas encore noté</span></div>`;
  }

  const lastCaca = cacas[0];
  const lastRepas = repas[0];
  const stats = [
    { k: "Pipis", c: TYPES.pipi.color, v: pipis.length, s: `${pipis.filter((e) => e.place !== "dedans").length} dehors · ${pipis.filter((e) => e.place === "dedans").length} accident${pipis.filter((e) => e.place === "dedans").length > 1 ? "s" : ""}` },
    { k: "Cacas", c: TYPES.caca.color, v: cacas.length, s: lastCaca ? `dernier à ${hfr(lastCaca.time)}` : "aucun aujourd’hui" },
    { k: "Repas", c: TYPES.repas.color, v: repas.length, s: lastRepas ? `dernier à ${hfr(lastRepas.time)}` : "aucun aujourd’hui" },
    { k: "Sommeil", c: TYPES.sieste.color, v: sleepMs ? dureeTxt(sleepMs / 60000) : "0 h", s: `${nbSiestes} sieste${nbSiestes > 1 ? "s" : ""}` }
  ];

  // Semaine : 7 derniers jours
  const jours = ["D", "L", "M", "M", "J", "V", "S"];
  const week = [];
  let weekAcc = 0;
  for (let i = 6; i >= 0; i--) {
    const d0 = today - i * DAY, d1 = d0 + DAY;
    const dayP = events.filter((e) => e.type === "pipi" && e.time >= d0 && e.time < d1);
    weekAcc += dayP.filter((e) => e.place === "dedans").length;
    week.push({ n: dayP.length, d: jours[new Date(d0).getDay()], today: i === 0 });
  }
  const max = Math.max(1, ...week.map((w) => w.n));

  const dateTxt = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  $("#view").innerHTML = `
    <div class="head">
      <div class="left">
        <span class="eyebrow">${esc(dateTxt)}</span>
        <h1 class="title">La journée de ${esc(CFG.nomChiot || "mon chiot")}</h1>
        <span class="sync ${store.online ? "" : "off"}">${store.online ? "Synchronisé" : "Mode local (non partagé)"}</span>
      </div>
      <div class="avatar">${ICON_PAW}</div>
    </div>

    <div class="card last">
      <div class="ico">${ICON_CLOCK}</div>
      <div class="txt"><span class="lbl">Dernier pipi</span>${lastHtml}
    </div>

    <div class="stats">
      ${stats.map((s) => `<div class="card stat">
        <div class="k"><span class="dot" style="background:${s.c}"></span>${s.k}</div>
        <span class="v">${s.v}</span><span class="s">${s.s}</span>
      </div>`).join("")}
    </div>

    <div class="card">
      <div class="row-between">
        <h2 class="h2">Pipis sur 7 jours</h2>
        <span class="small-ok">${weekAcc} accident${weekAcc > 1 ? "s" : ""}</span>
      </div>
      <div class="bars">
        ${week.map((w) => `<div class="bar">
          <span class="n">${w.n || ""}</span>
          <div class="b ${w.n ? (w.today ? "today" : "") : "empty"}" style="height:${w.n ? Math.round((w.n / max) * 60) : 4}px"></div>
          <span class="d">${w.d}</span>
        </div>`).join("")}
      </div>
    </div>

    <div class="list">
      <div class="row-between">
        <h2 class="h2">Aujourd’hui</h2>
        <a href="#/historique" style="font-size:13px;font-weight:700">Tout voir</a>
      </div>
      ${todays.length ? todays.map((e) => eventRow(e, false)).join("") : `<div class="empty-msg">Rien de noté aujourd’hui. Appuyez sur « Ajouter ».</div>`}
    </div>`;
}

/* ---------- Écran : Historique ---------- */

function renderHistorique() {
  const sorted = [...events].sort((a, b) => b.time - a.time);
  const groups = new Map();
  for (const e of sorted.slice(0, 500)) {
    const k = startOfDay(e.time);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  }
  const today = startOfDay(Date.now());
  const label = (k) => k === today ? "Aujourd’hui" : k === today - DAY ? "Hier" :
    new Date(k).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const summary = (list) => {
    const c = (t) => list.filter((e) => e.type === t).length;
    return `${c("pipi")} pipis · ${c("caca")} cacas · ${c("repas")} repas`;
  };

  $("#view").innerHTML = `
    <h1 class="title">Historique</h1>
    ${groups.size ? [...groups].map(([k, list]) => `
      <div class="list">
        <div class="row-between"><span class="day-title">${esc(label(k))}</span><span class="sync">${summary(list)}</span></div>
        ${list.map((e) => eventRow(e, true)).join("")}
      </div>`).join("") : `<div class="empty-msg">Aucune entrée pour l’instant.</div>`}`;

  $("#view").querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await store.remove(b.dataset.del);
    toast("Entrée supprimée");
  }));
}

/* ---------- Écran : Ajouter ---------- */

const form = { type: "pipi", place: "dehors", eaten: "tout" };

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

      ${t === "sieste" ? `
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
        Enregistrer ${t === "sieste" ? "la sieste" : `le ${TYPES[t].label.toLowerCase()}`}
      </button>
    </form>`;

  // Garde les valeurs saisies quand on change de type
  const keep = () => {
    form.heure = $("#heure")?.value ?? form.heure;
    form.debut = $("#debut")?.value ?? form.debut;
    form.fin = $("#fin")?.value ?? form.fin;
    form.qty = $("#qte")?.value ?? form.qty;
    form.note = $("#note")?.value ?? form.note;
  };
  const bind = (attr, key) => $("#view").querySelectorAll(`[data-${attr}]`).forEach((b) =>
    b.addEventListener("click", () => {
      keep();
      form[key] = b.dataset[attr];
      if (key === "who") { try { localStorage.setItem("chiot-who", form.who); } catch {} }
      renderAjouter();
    }));
  bind("type", "type"); bind("place", "place"); bind("eaten", "eaten"); bind("who", "who");

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
    if (form.type === "sieste") {
      ev.time = hhmmToMs(form.debut);
      let end = hhmmToMs(form.fin, ev.time);
      if (end < ev.time) end += DAY;
      ev.end = end;
    } else {
      ev.time = hhmmToMs(form.heure);
    }
    if (form.type === "pipi" || form.type === "caca") ev.place = form.place;
    if (form.type === "repas") { ev.qty = form.qty ? Number(form.qty) : null; ev.eaten = form.eaten; }

    $("#save").disabled = true;
    try {
      await store.add(ev);
      toast(`${TYPES[form.type].label} enregistré${form.type === "sieste" ? "e" : ""}`);
      form.heure = form.debut = form.fin = form.note = form.qty = undefined;
      location.hash = "#/";
    } catch (err) {
      console.error(err);
      toast("Échec de l’enregistrement");
      $("#save").disabled = false;
    }
  });
}

/* ---------- Routeur ---------- */

function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const tab = h === "ajouter" ? "ajouter" : h === "historique" ? "historique" : "accueil";
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  $("#fab").classList.toggle("hidden", tab === "ajouter");
  if (tab === "ajouter") renderAjouter();
  else if (tab === "historique") renderHistorique();
  else renderAccueil();
  if (route.lastTab !== tab) window.scrollTo(0, 0);
  route.lastTab = tab;
}

async function start() {
  if (CFG.firebase) {
    try { store = await firebaseStore(); }
    catch (err) { console.error(err); toast("Firebase indisponible : mode local"); store = localStore(); }
  } else {
    store = localStore();
  }
  store.subscribe((list) => {
    events = list.filter((e) => typeof e.time === "number");
    // Ne pas effacer un formulaire en cours de saisie
    if (route.lastTab !== "ajouter") route();
  });
  window.addEventListener("hashchange", route);
  route();
  // Rafraîchit "il y a X min" chaque minute
  setInterval(() => { if (route.lastTab === "accueil") renderAccueil(); }, 60000);
}

start();
