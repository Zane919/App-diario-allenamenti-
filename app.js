'use strict';
/* Diario Allenamenti - PWA offline-first.
   Dati salvati solo sul telefono (localStorage). Nessun account, nessun server. */
(() => {
  const VERSION = '1.0.0';
  const KEY = 'diario-allenamenti.v1';
  const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  /* ---------- utilities ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayISO = () => iso(new Date());
  const shortDate = (s) => { const p = String(s).split('-'); return p[2] + '/' + p[1]; };
  const longDate = (s) => parseISO(s).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const fmt = (n) => (Number.isFinite(n) ? n : 0).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fmtIn = (n) => (Number.isFinite(n) ? String(+n.toFixed(2)).replace('.', ',') : '');
  const parseNum = (v) => { if (v == null) return null; const n = parseFloat(String(v).trim().replace(',', '.')); return Number.isFinite(n) ? n : null; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- dati iniziali dalla scheda Excel ---------- */
  const R3 = '3 min', RCL4 = '30s ogni 4 colpi + 90s a fine serie', RCL3 = '30s ogni 3 colpi + 3 min a fine serie', RDX = 'lato DX poi 90s', RLATO = '90s per lato';
  const mk = (sid, lid, name, sets, reps, rest, note, mono) => ({ id: sid + '_' + lid, lid, name, sets, reps, rest, note: note || '', mono: !!mono });
  function defaultPlan() {
    return { sessions: [
      { id: 's1', name: 'Sessione 1', day: 1, exercises: [
        mk('s1', 'croci', 'Croci cavi R F14 P75', 2, '6/8', R3),
        mk('s1', 'panca', 'Panca piana', 1, '5', R3),
        mk('s1', 'pulley', 'Pulley mono', 2, 'cluster da 4', RCL4),
        mk('s1', 'spinte', 'Spinte multipower P30', 2, 'cluster da 3', RCL3),
        mk('s1', 'lat', 'Lat machine P60 mono', 2, '6/8', RDX),
        mk('s1', 'facepull', 'Face pull su pulley', 2, '8/10', R3, '+ scrollate a cedimento'),
        mk('s1', 'pushdown', 'Push down mono R F12+1', 2, '5/7', RLATO),
        mk('s1', 'hamcurl', 'Ham curl mono CB', 2, '5/7', RLATO, '', true),
        mk('s1', 'crunch', 'Crunch cavo vedo F10', 3, 'MAX', R3)] },
      { id: 's2', name: 'Sessione 2', day: 2, exercises: [
        mk('s2', 'legext', 'Leg ext', 2, '6/8', R3, 'doppia'),
        mk('s2', 'affondo', 'Affondo mono press orizz F2', 2, '8', RLATO),
        mk('s2', 'adductor', 'Adductor machine F3', 2, 'MAX', R3),
        mk('s2', 'legcurl', 'Leg curl', 2, '6/8', R3),
        mk('s2', 'rdl', 'RDL bil', 1, 'MAX', R3),
        mk('s2', 'hipthrust', 'Hip thrust', 2, '6/8', R3),
        mk('s2', 'lento', 'Lento al multi P75', 2, '5/7', R3),
        mk('s2', 'alzlatman', 'Alz lat man P75', 2, '8/10', R3),
        mk('s2', 'calf', 'Calf raise press orizz', 2, 'MAX', R3)] },
      { id: 's3', name: 'Sessione 3', day: 4, exercises: [
        mk('s3', 'pectoral', 'Pectoral F2', 2, 'cluster da 4', R3),
        mk('s3', 'panca', 'Panca piana', 1, '5', R3),
        mk('s3', 'pulley', 'Pulley mono', 2, 'cluster da 4', RCL4),
        mk('s3', 'spinte', 'Spinte multipower P30', 2, 'cluster da 3', RCL3),
        mk('s3', 'lat', 'Lat machine P60 mono', 2, '6/8', RDX),
        mk('s3', 'facepull', 'Face pull su pulley', 2, '8/10', R3, '+ scrollate a cedimento'),
        mk('s3', 'pushdown', 'Push down mono R F12+1', 3, '5/7', RLATO),
        mk('s3', 'hamcurl', 'Ham curl mono CB', 3, '5/7', RLATO, '', true),
        mk('s3', 'crunch', 'Crunch cavo vedo F10', 3, 'MAX', R3)] },
      { id: 's4', name: 'Sessione 4', day: 5, exercises: [
        mk('s4', 'legext', 'Leg ext', 2, '6/8', R3, 'doppia'),
        mk('s4', 'affondo', 'Affondo mono press orizz F2', 2, '8', RLATO),
        mk('s4', 'adductor', 'Adductor machine F3', 2, 'MAX', R3),
        mk('s4', 'legcurl', 'Leg curl', 2, '6/8', R3),
        mk('s4', 'rdl', 'RDL bil', 1, 'MAX', R3),
        mk('s4', 'hipthrust', 'Hip thrust', 2, '6/8', R3),
        mk('s4', 'lento', 'Lento al multi P75', 2, '5/7', R3),
        mk('s4', 'alzlatcavo', 'Alz lat cavo di lato F10', 2, '8/10', RLATO),
        mk('s4', 'calf', 'Calf raise press orizz', 2, 'MAX', R3)] },
    ] };
  }
  /* [carico, ripetizioni, ripetizioni SX, nota]; null dove nel file c'era solo il carico */
  function seedLogs() {
    const plan = defaultPlan();
    const D = [
      ['seed1', '2026-10-26', 's1', [
        ['croci', [[25.75, 8], [25.75, 8]], 'aumentare carico'],
        ['panca', [[115, null]]],
        ['pulley', [[100, 12, null, '3 set cluster'], [100, 12, null, '3 set cluster']], 'aumentare carico'],
        ['spinte', [[40, 4, null, '2 set da 2'], [40, 2, null, '1 set da 2']]],
        ['lat', [[42.5, 8], [42.5, 6]]],
        ['facepull', [[110, null], [110, null]]],
        ['pushdown', [[32.25, 7], [32.25, 7]]],
        ['hamcurl', [[68.5, 4, 5], [68.5, 3, 4]]],
        ['crunch', [[43.75, 10], [43.75, 10], [43.75, 8]]]]],
      ['seed2', '2026-10-27', 's2', [
        ['legext', [[80, 8], [80, 8]]],
        ['affondo', [[110, 10], [110, null]]],
        ['adductor', [[70, 13, null, '+ viola + blu'], [70, 12, null, '+ viola + blu']]],
        ['legcurl', [[90, 8], [90, 8]]],
        ['rdl', [[65, 6]]],
        ['hipthrust', [[45, null], [45, null]]],
        ['lento', [[30, 7], [30, 5]]],
        ['alzlatman', [[22.5, 10], [22.5, 10]]],
        ['calf', [[170, 12], [170, null]]]]],
      ['seed3', '2026-10-29', 's3', [
        ['pectoral', [[100, 9, null, '3 set da 3'], [100, 6, null, '2 set da 3']]],
        ['panca', [[115, null]]],
        ['pulley', [[100, 6, null, '2 set da 3'], [100, 4, null, '2 set da 2']]],
        ['spinte', [[37.5, 4, null, '2 set da 2'], [37.5, 2, null, '1 set da 2']]],
        ['lat', [[40, 8], [40, 8]]],
        ['facepull', [[110, null], [110, null]]],
        ['pushdown', [[32.25, 7], [32.25, 7], [32.25, 7]]],
        ['hamcurl', [[68.5, 5, 6], [68.5, 4, 5], [68.5, 4, null]]],
        ['crunch', [[43.75, 12], [43.75, 12], [43.75, null]]]]],
      ['seed4', '2026-10-30', 's4', [
        ['legext', [[82.5, 8], [82.5, 8]]],
        ['affondo', [[110, 10], [110, null]]],
        ['adductor', [[70, 13, null, '+ viola + blu'], [70, 12, null, '+ viola + blu']]],
        ['legcurl', [[90, 8], [90, 8]]],
        ['rdl', [[65, 6]]],
        ['hipthrust', [[45, null], [45, null]]],
        ['lento', [[30, 7], [30, 5]]],
        ['alzlatcavo', [[16, 10], [16, 10]]],
        ['calf', [[170, 12], [170, null]]]]],
    ];
    return D.map((d) => {
      const sess = plan.sessions.find((s) => s.id === d[2]);
      return { id: d[0], date: d[1], sessionId: d[2], sessionName: sess.name, ts: Date.parse(d[1] + 'T12:00:00'),
        entries: d[3].map((e) => {
          const x = sess.exercises.find((z) => z.lid === e[0]);
          const o = { lid: e[0], name: x.name, mono: x.mono, sets: e[1].map((s) => { const r = { w: s[0], r: s[1], rl: s[2] == null ? null : s[2] }; if (s[3]) r.n = s[3]; return r; }) };
          if (e[2]) o.note = e[2];
          return o;
        }) };
    });
  }

  /* ---------- storage ---------- */
  let S = load();
  function load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY));
      if (r && r.plan && Array.isArray(r.plan.sessions) && Array.isArray(r.logs)) return { plan: r.plan, logs: r.logs, draft: r.draft || null };
    } catch (e) { /* dati corrotti: riparto dalla scheda iniziale */ }
    const fresh = { plan: defaultPlan(), logs: seedLogs(), draft: null };
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch (e) { /* ignora */ }
    return fresh;
  }
  function save() {
    clearTimeout(saveT); saveT = null;
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Impossibile salvare i dati: spazio esaurito?'); }
  }
  let saveT = null;
  function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
  function flush() { if (saveT !== null) save(); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg, act) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(msg)}</span>${act ? `<button type="button">${esc(act.label)}</button>` : ''}`;
    t.classList.add('show');
    if (act) t.querySelector('button').onclick = () => { act.fn(); t.classList.remove('show'); };
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), act ? 5500 : 2400);
  }

  /* ---------- modello ---------- */
  const sortedLogs = () => S.logs.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ts || 0) - (b.ts || 0)));
  const sessionById = (id) => S.plan.sessions.find((s) => s.id === id);
  const findPlanEx = (lid) => { for (const s of S.plan.sessions) { const x = s.exercises.find((e) => e.lid === lid); if (x) return x; } return null; };
  const setReps = (s) => { if (s.r == null && s.rl == null) return null; if (s.r != null && s.rl != null) return (s.r + s.rl) / 2; return s.r != null ? s.r : s.rl; };
  function metrics(e) {
    const ws = e.sets.map((s) => s.w).filter((v) => v != null);
    const rs = e.sets.map(setReps).filter((v) => v != null);
    return { w: ws.length ? Math.max(...ws) : null, r: rs.length ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10 : null, n: e.sets.length };
  }
  function fmtSet(s) {
    const w = s.w != null ? fmt(s.w) : '–';
    let r = '–';
    if (s.r != null && s.rl != null) r = s.r + '/' + s.rl; else if (s.r != null) r = String(s.r); else if (s.rl != null) r = '–/' + s.rl;
    return w + '×' + r + (s.n ? ' (' + s.n + ')' : '');
  }
  /* Stesso esercizio = stessa progressione: gli esercizi con lo stesso nome (anche in sedute diverse) vengono uniti */
  const nameKey = (n) => String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  function canonMap() {
    const byName = new Map(), m = new Map();
    const add = (lid, name) => {
      if (m.has(lid)) return;
      const k = nameKey(name);
      if (!byName.has(k)) byName.set(k, lid);
      m.set(lid, byName.get(k));
    };
    S.plan.sessions.forEach((s) => s.exercises.forEach((x) => add(x.lid, x.name)));
    sortedLogs().forEach((l) => l.entries.forEach((e) => add(e.lid, e.name)));
    return m;
  }
  function liftSeries(lid, cm) {
    cm = cm || canonMap();
    const c = cm.get(lid) || lid, out = [];
    sortedLogs().forEach((l) => l.entries.forEach((e) => { if ((cm.get(e.lid) || e.lid) === c) out.push({ date: l.date, e, m: metrics(e) }); }));
    return out;
  }
  function liftList() {
    const cm = canonMap(), seen = new Map();
    S.plan.sessions.forEach((s) => s.exercises.forEach((x) => { const c = cm.get(x.lid); if (!seen.has(c)) seen.set(c, x.name); }));
    sortedLogs().forEach((l) => l.entries.forEach((e) => { const c = cm.get(e.lid); if (!seen.has(c)) seen.set(c, e.name); }));
    return [...seen].map(([lid, name]) => ({ lid, name, count: liftSeries(lid, cm).length }));
  }
  function lastEntry(lid) {
    const cm = canonMap(), c = cm.get(lid) || lid, ls = sortedLogs();
    for (let i = ls.length - 1; i >= 0; i--) { const e = ls[i].entries.find((x) => (cm.get(x.lid) || x.lid) === c); if (e) return { date: ls[i].date, e }; }
    return null;
  }

  /* ---------- stato dell'interfaccia ---------- */
  const ui = { view: 'home', workout: false, editSession: null, openEx: null, progLid: null, openLog: null };
  let subOpen = false;   // il tasto "indietro" del telefono chiude allenamento / editor di sessione
  function openSub() { if (!subOpen) { subOpen = true; history.pushState({ sub: 1 }, ''); } }
  function leaveSub() { subOpen = false; ui.workout = false; ui.editSession = null; render(); window.scrollTo(0, 0); }
  function closeSub() { if (subOpen) history.back(); else leaveSub(); }
  window.addEventListener('popstate', () => { if (subOpen) leaveSub(); });

  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CHEV = '<svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  /* ================== ALLENATI ================== */
  function viewHome() {
    const today = new Date().getDay();
    let h = '';
    if (S.draft) {
      const done = S.draft.entries.reduce((a, e) => a + e.rows.filter((r) => r.done).length, 0);
      h += `<div class="banner"><span><b>${S.draft.editId ? 'Modifica in corso' : 'Allenamento in corso'}</b><br>${esc(S.draft.sessionName)} · ${done} serie fatte</span><button type="button" data-act="resume">Riprendi</button></div>`;
    }
    h += '<div class="sec-title">Sessioni della settimana</div>';
    if (!S.plan.sessions.length) h += '<p class="empty">Non c\'è nessuna sessione. Aggiungine una dalla sezione Scheda.</p>';
    const ls = sortedLogs();
    S.plan.sessions.forEach((s) => {
      let last = null; for (let i = ls.length - 1; i >= 0; i--) { if (ls[i].sessionId === s.id) { last = ls[i]; break; } }
      const bits = [];
      if (s.day != null) bits.push(DAYS[s.day]);
      bits.push(s.exercises.length + ' esercizi');
      if (last) bits.push('ultima volta ' + shortDate(last.date));
      h += `<button type="button" class="card" data-act="start" data-id="${esc(s.id)}"><div class="sess"><div><h3>${esc(s.name)}${s.day === today ? '<span class="tag">Oggi</span>' : ''}</h3><div class="meta">${esc(bits.join(' · '))}</div></div>${CHEV}</div></button>`;
    });
    return h;
  }

  function buildDraft(session) {
    return { sessionId: session.id, sessionName: session.name, date: todayISO(), editId: null,
      entries: session.exercises.map((x) => {
        const last = lastEntry(x.lid);
        const n = Math.max(1, x.sets || 1);
        const lastSets = last ? last.e.sets.map((s) => ({ w: s.w, r: s.r, rl: s.rl })) : [];
        const rows = [];
        for (let i = 0; i < n; i++) {
          const ls = lastSets.length ? (lastSets[i] || lastSets[lastSets.length - 1]) : null;
          rows.push({ w: ls && ls.w != null ? fmtIn(ls.w) : '', r: '', rl: '', done: false });
        }
        return { exId: x.id, lid: x.lid, name: x.name, sets: x.sets, reps: x.reps, rest: x.rest, note: x.note, mono: !!x.mono,
          lastDate: last ? last.date : null, last: lastSets, lastText: last ? last.e.sets.map(fmtSet).join(' · ') : '', rows };
      }) };
  }
  function draftFromLog(l) {
    return { sessionId: l.sessionId, sessionName: l.sessionName, date: l.date, editId: l.id, editTs: l.ts,
      entries: l.entries.map((e) => {
        const x = findPlanEx(e.lid);
        return { exId: x ? x.id : e.lid, lid: e.lid, name: e.name, sets: e.sets.length, reps: x ? x.reps : '', rest: x ? x.rest : '', note: x ? x.note : '', mono: !!e.mono, logNote: e.note || '',
          lastDate: null, last: [], lastText: '',
          rows: e.sets.map((s) => ({ w: s.w != null ? fmtIn(s.w) : '', r: s.r != null ? String(s.r) : '', rl: s.rl != null ? String(s.rl) : '', done: true, n: s.n || '' })) };
      }) };
  }

  const doneCount = () => S.draft.entries.reduce((a, e) => a + e.rows.filter((r) => r.done).length, 0);
  function saveLabel() { const n = doneCount(); return (S.draft.editId ? 'Salva modifiche' : 'Salva allenamento') + (n ? ' · ' + n + ' serie' : ''); }
  function viewWorkout() {
    const d = S.draft;
    let h = '<div class="wk-top"><button type="button" class="linkbtn" data-act="wk-back">‹ Indietro</button><button type="button" class="linkbtn" data-act="wk-discard" style="color:var(--warn)">' + (d.editId ? 'Annulla modifica' : 'Scarta') + '</button></div>';
    h += `<h1 class="page">${esc(d.sessionName)}</h1>`;
    h += `<div class="field" style="margin-top:12px"><label for="wk-date">Data</label><input class="in" type="date" id="wk-date" value="${esc(d.date)}" max="${esc(todayISO())}"></div>`;
    d.entries.forEach((e, i) => {
      const meta = [e.sets + ' × ' + e.reps, e.rest ? 'recupero ' + e.rest : ''].filter(Boolean).join(' · ');
      h += `<section class="card ex${e.mono ? ' mono' : ''}" data-ex="${i}"><h3>${esc(e.name)}</h3><div class="meta">${esc(meta)}</div>`;
      if (e.note) h += `<div class="meta">${esc(e.note)}</div>`;
      if (e.lastText) h += `<div class="meta">Ultima volta (${esc(shortDate(e.lastDate))}): ${esc(e.lastText)}</div>`;
      h += `<div class="sethead"><span></span><span>kg</span><span>${e.mono ? 'Rip DX' : 'Rip'}</span>${e.mono ? '<span>Rip SX</span>' : ''}<span></span></div>`;
      e.rows.forEach((r, j) => {
        const L = e.last && e.last.length ? (e.last[j] || e.last[e.last.length - 1]) : null;
        h += `<div class="setrow" data-row="${j}"><span class="setn">${j + 1}</span>` +
          `<input class="in" inputmode="decimal" data-f="w" placeholder="kg" aria-label="Carico serie ${j + 1}" value="${esc(r.w)}">` +
          `<input class="in" inputmode="decimal" data-f="r" placeholder="${esc(L && L.r != null ? L.r : 'rip')}" aria-label="Ripetizioni serie ${j + 1}${e.mono ? ' destra' : ''}" value="${esc(r.r)}">` +
          (e.mono ? `<input class="in" inputmode="decimal" data-f="rl" placeholder="${esc(L && L.rl != null ? L.rl : 'rip')}" aria-label="Ripetizioni serie ${j + 1} sinistra" value="${esc(r.rl)}">` : '') +
          `<button type="button" class="chk" data-act="done" aria-pressed="${r.done ? 'true' : 'false'}" aria-label="Serie ${j + 1} fatta">${CHECK}</button></div>`;
      });
      h += `<div class="exact"><button type="button" class="btn small" data-act="addset">+ Serie</button><button type="button" class="btn small" data-act="delset"${e.rows.length <= 1 ? ' disabled' : ''}>− Serie</button></div></section>`;
    });
    h += `<div class="savebar"><div><button type="button" id="savebtn" class="btn primary" data-act="wk-save">${esc(saveLabel())}</button></div></div>`;
    return h;
  }
  function wkSave() {
    const d = S.draft, entries = [];
    d.entries.forEach((e) => {
      const sets = [];
      e.rows.forEach((r) => { if (!r.done) return; const s = { w: parseNum(r.w), r: parseNum(r.r), rl: e.mono ? parseNum(r.rl) : null }; if (r.n) s.n = r.n; sets.push(s); });
      if (sets.length) { const o = { lid: e.lid, name: e.name, mono: e.mono, sets }; if (e.logNote) o.note = e.logNote; entries.push(o); }
    });
    if (!entries.length) return toast('Spunta almeno una serie per salvare.');
    const log = { id: d.editId || 'l' + uid(), date: d.date || todayISO(), sessionId: d.sessionId, sessionName: d.sessionName, ts: d.editTs || Date.now(), entries };
    const wasEdit = !!d.editId;
    if (wasEdit) S.logs = S.logs.filter((l) => l.id !== log.id);
    S.logs.push(log);
    S.draft = null; save();
    ui.view = wasEdit ? 'hist' : 'home';
    closeSub();
    toast(wasEdit ? 'Modifiche salvate' : 'Allenamento salvato');
  }

  /* ================== PROGRESSI ================== */
  function niceTicks(min, max, count, intOnly) {
    if (min === max) { const p = Math.abs(min) * 0.1 || 1; min -= p; max += p; }
    const raw = (max - min) / count, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    let step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    if (intOnly) step = Math.max(1, Math.round(step));
    const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
    const ticks = []; for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
    return { ticks, lo: ticks[0], hi: ticks[ticks.length - 1] };
  }
  const chartCfg = {};
  function chartHTML(id, kind, pts, color, W, label) {
    const H = 176, L = 40, R = 14, T = 18, B = 26, pw = W - L - R, ph = H - T - B, n = pts.length;
    const vals = pts.map((p) => p.v);
    const t = kind === 'bar' ? niceTicks(0, Math.max(...vals, 1), 4, true) : niceTicks(Math.min(...vals), Math.max(...vals), 4);
    const lo = t.lo, hi = t.hi, y = (v) => T + ph - ((v - lo) / (hi - lo)) * ph;
    const padX = kind === 'bar' ? 0 : 10, slot = pw / n;
    const xs = pts.map((p, i) => (kind === 'bar' ? L + slot * (i + 0.5) : (n === 1 ? L + pw / 2 : L + padX + (i * (pw - 2 * padX)) / (n - 1))));
    const ys = pts.map((p) => y(p.v));
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" tabindex="0" aria-label="${esc(label)}">`;
    t.ticks.forEach((v, i) => {
      s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${i === 0 ? 'var(--muted)' : 'var(--line)'}" stroke-width="1" ${i === 0 ? 'opacity=".5"' : ''}/>`;
      s += `<text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${esc(fmt(v))}</text>`;
    });
    const gap = Math.max(1, Math.ceil(46 / (n > 1 ? (kind === 'bar' ? slot : (pw - 2 * padX) / (n - 1)) : 46)));
    pts.forEach((p, i) => { if ((n - 1 - i) % gap === 0) s += `<text class="ax" x="${xs[i]}" y="${H - 7}" text-anchor="middle">${esc(p.lab)}</text>`; });
    if (kind === 'bar') {
      const bw = Math.min(24, slot * 0.6), yb = y(lo);
      pts.forEach((p, i) => {
        const x = xs[i] - bw / 2, top = ys[i], r = Math.min(4, yb - top);
        s += `<path d="M${x},${yb} V${top + r} a${r},${r} 0 0 1 ${r},-${r} H${x + bw - r} a${r},${r} 0 0 1 ${r},${r} V${yb} Z" fill="${color}"/>`;
      });
      s += `<text class="val" x="${xs[n - 1]}" y="${ys[n - 1] - 6}" text-anchor="middle">${esc(fmt(vals[n - 1]))}</text>`;
    } else {
      if (n > 1) s += `<path d="M${xs[0]},${y(lo)} ${xs.map((x, i) => 'L' + x + ',' + ys[i]).join(' ')} L${xs[n - 1]},${y(lo)} Z" fill="${color}" opacity=".10"/>`;
      if (n > 1) s += `<polyline points="${xs.map((x, i) => x + ',' + ys[i]).join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      xs.forEach((x, i) => { if (n <= 24 || i === n - 1) s += `<circle cx="${x}" cy="${ys[i]}" r="${i === n - 1 ? 5 : 4}" fill="${color}" stroke="var(--card)" stroke-width="2"/>`; });
      const ex = xs[n - 1], anchor = ex > W - 40 ? 'end' : 'middle';
      s += `<text class="val" x="${anchor === 'end' ? ex + 6 : ex}" y="${ys[n - 1] - 11}" text-anchor="${anchor}">${esc(fmt(vals[n - 1]))}</text>`;
    }
    s += `<line class="xh" x1="0" x2="0" y1="${T}" y2="${y(lo)}" stroke="var(--muted)" stroke-width="1" visibility="hidden"/>`;
    s += `<circle class="hl" r="5" fill="${color}" stroke="var(--card)" stroke-width="2" visibility="hidden"/>`;
    s += `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg><div class="tip" hidden></div>`;
    chartCfg[id] = { xs, ys, pts, color, W, kind };
    return `<div class="chart" data-chart="${id}">${s}</div>`;
  }
  function bindCharts() {
    document.querySelectorAll('.chart').forEach((el) => {
      const cfg = chartCfg[el.dataset.chart]; if (!cfg) return;
      const svg = el.querySelector('svg'), xh = el.querySelector('.xh'), hl = el.querySelector('.hl'), tip = el.querySelector('.tip');
      let cur = cfg.pts.length - 1;
      const show = (i) => {
        cur = i; const p = cfg.pts[i];
        xh.setAttribute('x1', cfg.xs[i]); xh.setAttribute('x2', cfg.xs[i]); xh.setAttribute('visibility', 'visible');
        hl.setAttribute('cx', cfg.xs[i]); hl.setAttribute('cy', cfg.ys[i]); hl.setAttribute('visibility', cfg.kind === 'bar' ? 'hidden' : 'visible');
        tip.textContent = '';
        const d1 = document.createElement('div'); d1.className = 'd'; d1.textContent = p.date; tip.appendChild(d1);
        const d2 = document.createElement('div'); d2.className = 'v';
        const k = document.createElement('span'); k.className = 'k'; k.style.background = cfg.color; d2.appendChild(k);
        d2.appendChild(document.createTextNode(p.text)); tip.appendChild(d2);
        if (p.extra) { const d3 = document.createElement('div'); d3.className = 'e'; d3.textContent = p.extra; tip.appendChild(d3); }
        tip.hidden = false;
        const w = tip.offsetWidth, h = tip.offsetHeight;
        tip.style.left = Math.max(0, Math.min(cfg.W - w, cfg.xs[i] - w / 2)) + 'px';
        tip.style.top = Math.max(0, cfg.ys[i] - h - 12) + 'px';
      };
      const hide = () => { xh.setAttribute('visibility', 'hidden'); hl.setAttribute('visibility', 'hidden'); tip.hidden = true; };
      const near = (ev) => { const r = svg.getBoundingClientRect(), x = ev.clientX - r.left; let b = 0, bd = 1e9; cfg.xs.forEach((v, i) => { const dd = Math.abs(v - x); if (dd < bd) { bd = dd; b = i; } }); return b; };
      svg.addEventListener('pointermove', (ev) => show(near(ev)));
      svg.addEventListener('pointerdown', (ev) => show(near(ev)));
      svg.addEventListener('pointerleave', hide);
      svg.addEventListener('blur', hide);
      svg.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowLeft') { show(Math.max(0, cur - 1)); ev.preventDefault(); }
        else if (ev.key === 'ArrowRight') { show(Math.min(cfg.pts.length - 1, cur + 1)); ev.preventDefault(); }
      });
    });
  }
  function viewProgress() {
    const lifts = liftList();
    let h = '';
    if (!lifts.length) return h + '<p class="empty">Aggiungi degli esercizi alla scheda per vedere i grafici.</p>';
    if (!lifts.some((l) => l.lid === ui.progLid)) { const f = lifts.find((l) => l.count) || lifts[0]; ui.progLid = f.lid; }
    const lid = ui.progLid, full = liftSeries(lid);
    const ser = full;
    h += `<div class="field"><label for="lift">Esercizio</label><select class="in" id="lift">${lifts.map((l) => `<option value="${esc(l.lid)}"${l.lid === lid ? ' selected' : ''}>${esc(l.name)} (${l.count})</option>`).join('')}</select></div>`;
    if (!full.length) return h + '<div class="card empty">Non hai ancora registrato questo esercizio. Dopo il primo allenamento qui compaiono i grafici.</div>';
    const W = Math.max(240, Math.min(560, document.documentElement.clientWidth) - 62);
    const wl = full.filter((x) => x.m.w != null);
    const maxW = wl.length ? Math.max(...wl.map((x) => x.m.w)) : null;
    let delta = '<div class="d flat">serve più di una seduta</div>', dv = '–';
    if (wl.length > 1) {
      const dd = wl[wl.length - 1].m.w - wl[0].m.w;
      dv = (dd > 0 ? '+' : dd < 0 ? '−' : '') + fmt(Math.abs(dd));
      delta = `<div class="d ${dd > 0 ? 'up' : dd < 0 ? 'down' : 'flat'}">${dd > 0 ? '▲ in aumento' : dd < 0 ? '▼ in calo' : '= invariato'}</div>`;
    }
    h += `<div class="tiles"><div class="tile"><div class="l">Carico massimo</div><div class="v">${maxW != null ? fmt(maxW) : '–'}${maxW != null ? '<small>kg</small>' : ''}</div></div>` +
      `<div class="tile"><div class="l">Ultima seduta</div><div class="v">${esc(shortDate(full[full.length - 1].date))}</div></div>` +
      `<div class="tile"><div class="l">Dal primo dato</div><div class="v">${dv}${dv === '–' ? '' : '<small>kg</small>'}</div>${delta}</div></div>`;
    const mkPts = (list, key) => list.filter((x) => x.m[key] != null).map((x) => ({ lab: shortDate(x.date), v: x.m[key], date: longDate(x.date), extra: x.e.sets.map(fmtSet).join(' · ') }));
    const pw = mkPts(ser, 'w').map((p) => { p.text = fmt(p.v) + ' kg'; return p; });
    const pr = mkPts(ser, 'r').map((p) => { p.text = fmt(p.v) + ' rip per serie'; return p; });
    const pn = ser.map((x) => ({ lab: shortDate(x.date), v: x.m.n, date: longDate(x.date), text: x.m.n + ' serie', extra: x.e.sets.map(fmtSet).join(' · ') }));
    h += `<div class="card"><div class="ct">Carico<span>kg, serie più pesante</span></div>${pw.length ? chartHTML('c1', 'line', pw, 'var(--accent)', W, 'Carico massimo per seduta') : '<p class="empty">Nessun carico registrato.</p>'}</div>`;
    h += `<div class="card"><div class="ct">Ripetizioni<span>media per serie</span></div>${pr.length ? chartHTML('c2', 'line', pr, 'var(--p)', W, 'Ripetizioni medie per serie') : '<p class="empty">Nessuna ripetizione registrata.</p>'}</div>`;
    h += `<div class="card"><div class="ct">Serie<span>fatte per seduta</span></div>${chartHTML('c3', 'bar', pn, 'var(--c)', W, 'Numero di serie per seduta')}</div>`;
    return h;
  }

  /* ================== SCHEDA ================== */
  function viewPlan() {
    let h = '';
    S.plan.sessions.forEach((s, i) => {
      h += `<div class="card"><button type="button" class="exhead" data-act="p-open" data-id="${esc(s.id)}"><div class="t"><b>${esc(s.name)}</b><span>${esc((s.day != null ? DAYS[s.day] + ' · ' : '') + s.exercises.length + ' esercizi')}</span></div>${CHEV}</button>` +
        `<div class="row" style="margin-top:10px"><button type="button" class="btn small" data-act="p-upsess" data-id="${esc(s.id)}"${i === 0 ? ' disabled' : ''} aria-label="Sposta su">↑</button><button type="button" class="btn small" data-act="p-downsess" data-id="${esc(s.id)}"${i === S.plan.sessions.length - 1 ? ' disabled' : ''} aria-label="Sposta giù">↓</button><button type="button" class="btn small danger" data-act="p-delsess" data-id="${esc(s.id)}">Elimina</button></div></div>`;
    });
    h += '<button type="button" class="btn block" data-act="p-addsess">+ Nuova sessione</button>';
    return h;
  }
  function viewSessionEdit() {
    const s = sessionById(ui.editSession);
    if (!s) { ui.editSession = null; return viewPlan(); }
    let h = '<div class="wk-top"><button type="button" class="linkbtn" data-act="p-back">‹ Scheda</button></div>';
    h += `<div class="card"><div class="field"><label for="sn">Nome sessione</label><input class="in" id="sn" data-pf="name" value="${esc(s.name)}"></div>` +
      `<div class="field" style="margin:0"><label for="sd">Giorno</label><select class="in" id="sd" data-pf="day"><option value="">Nessuno</option>${[1, 2, 3, 4, 5, 6, 0].map((d) => `<option value="${d}"${s.day === d ? ' selected' : ''}>${DAYS[d]}</option>`).join('')}</select></div></div>`;
    h += '<div class="sec-title">Esercizi</div>';
    if (!s.exercises.length) h += '<p class="empty">Nessun esercizio. Aggiungine uno.</p>';
    s.exercises.forEach((x, i) => {
      const open = ui.openEx === x.id;
      h += `<div class="card" data-x="${esc(x.id)}"><button type="button" class="exhead" data-act="p-toggleex" data-id="${esc(x.id)}" aria-expanded="${open}"><div class="t"><b data-sumn>${esc(x.name)}</b><span>${esc(x.sets + ' × ' + x.reps + (x.rest ? ' · ' + x.rest : ''))}</span></div>${CHEV}</button>`;
      if (open) {
        h += `<div style="margin-top:12px"><div class="field"><label for="xn${i}">Nome</label><input class="in" id="xn${i}" data-xf="name" data-xid="${esc(x.id)}" value="${esc(x.name)}"></div>` +
          `<div class="grid3"><div class="field"><label for="xs${i}">Serie</label><input class="in" id="xs${i}" inputmode="numeric" data-xf="sets" data-xid="${esc(x.id)}" value="${esc(x.sets)}"></div>` +
          `<div class="field"><label for="xr${i}">Ripetizioni</label><input class="in" id="xr${i}" data-xf="reps" data-xid="${esc(x.id)}" value="${esc(x.reps)}"></div>` +
          `<div class="field"><label for="xt${i}">Recupero</label><input class="in" id="xt${i}" data-xf="rest" data-xid="${esc(x.id)}" value="${esc(x.rest)}"></div></div>` +
          `<div class="field"><label for="xo${i}">Note</label><input class="in" id="xo${i}" data-xf="note" data-xid="${esc(x.id)}" value="${esc(x.note)}"></div>` +
          `<label class="check"><input type="checkbox" data-xf="mono" data-xid="${esc(x.id)}"${x.mono ? ' checked' : ''}> Registra destra e sinistra separate</label>` +
          `<div class="row" style="margin-top:8px"><button type="button" class="btn small" data-act="p-upex" data-id="${esc(x.id)}"${i === 0 ? ' disabled' : ''} aria-label="Sposta su">↑</button><button type="button" class="btn small" data-act="p-downex" data-id="${esc(x.id)}"${i === s.exercises.length - 1 ? ' disabled' : ''} aria-label="Sposta giù">↓</button><button type="button" class="btn small danger" data-act="p-delex" data-id="${esc(x.id)}">Elimina esercizio</button></div></div>`;
      }
      h += '</div>';
    });
    h += '<button type="button" class="btn block" data-act="p-addex">+ Nuovo esercizio</button>';
    h += '<p class="hint" style="margin-top:12px">Lo storico dei carichi resta salvato anche se elimini un esercizio o una sessione.</p>';
    return h;
  }

  /* ================== STORICO e backup ================== */
  function viewHistory() {
    const logs = sortedLogs().reverse();
    let h = '';
    if (!logs.length) h += '<p class="empty">Nessun allenamento registrato.</p>';
    logs.forEach((l) => {
      const open = ui.openLog === l.id;
      const nSets = l.entries.reduce((a, e) => a + e.sets.length, 0);
      h += `<div class="card log"><button type="button" class="exhead" data-act="h-toggle" data-id="${esc(l.id)}" aria-expanded="${open}"><div class="t"><h3 class="cap">${esc(longDate(l.date))}</h3><span>${esc(l.sessionName + ' · ' + l.entries.length + ' esercizi · ' + nSets + ' serie')}</span></div>${CHEV}</button>`;
      if (open) {
        h += '<ul>' + l.entries.map((e) => `<li><b>${esc(e.name)}</b><br><span>${esc(e.sets.map(fmtSet).join(' · ') + (e.note ? ' — ' + e.note : ''))}</span></li>`).join('') + '</ul>' +
          `<div class="row" style="margin-top:12px"><button type="button" class="btn small" data-act="h-edit" data-id="${esc(l.id)}">Modifica</button><button type="button" class="btn small danger" data-act="h-del" data-id="${esc(l.id)}">Elimina</button></div>`;
      }
      h += '</div>';
    });
    h += '<div class="sec-title">I tuoi dati</div><div class="card about"><p>Tutto è salvato solo su questo telefono, senza account. Se cancelli i dati del browser o disinstalli l\'app, i dati si perdono: fai ogni tanto un backup.</p>' +
      '<div class="row"><button type="button" class="btn" data-act="export">Esporta backup</button><button type="button" class="btn" data-act="import">Importa backup</button></div>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
      `<p style="margin-top:12px">Diario Allenamenti · versione ${VERSION}</p></div>`;
    return h;
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'diario-allenamenti', version: 1, exportedAt: new Date().toISOString(), data: { plan: S.plan, logs: S.logs } }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `diario-allenamenti-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Backup creato');
  }
  function importData(file) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(rd.result); const d = j && j.data ? j.data : j;
        if (!d || !d.plan || !Array.isArray(d.plan.sessions) || !Array.isArray(d.logs)) throw new Error('formato');
        if (!confirm(`Importare il backup (${d.plan.sessions.length} sessioni, ${d.logs.length} allenamenti)? I dati attuali verranno sostituiti.`)) return;
        S = { plan: d.plan, logs: d.logs, draft: null }; save(); ui.editSession = null; ui.workout = false; render(); toast('Backup importato');
      } catch (e) { toast('File di backup non valido'); }
    };
    rd.readAsText(file);
  }

  /* ================== azioni ================== */
  const keepScroll = (fn) => { const y = window.scrollY; fn(); window.scrollTo(0, y); };
  const handlers = {
    nav: (el) => {
      ui.view = el.dataset.view; ui.editSession = null;
      if (subOpen) { subOpen = false; history.back(); }
      render(); window.scrollTo(0, 0);
    },
    start: (el) => {
      const s = sessionById(el.dataset.id); if (!s) return;
      if (S.draft && (S.draft.sessionId !== s.id || S.draft.editId)) {
        if (!confirm(`C'è un allenamento non salvato (${S.draft.sessionName}). Vuoi scartarlo e iniziare "${s.name}"?`)) return;
        S.draft = null;
      }
      if (!S.draft) { S.draft = buildDraft(s); save(); }
      ui.workout = true; openSub(); render(); window.scrollTo(0, 0);
    },
    resume: () => { ui.workout = true; openSub(); render(); window.scrollTo(0, 0); },
    'wk-back': () => closeSub(),
    'wk-discard': () => {
      if (!confirm(S.draft.editId ? 'Annullare la modifica?' : 'Scartare l\'allenamento? Quello che hai inserito non verrà salvato.')) return;
      const wasEdit = !!S.draft.editId; S.draft = null; save(); if (wasEdit) ui.view = 'hist'; closeSub();
    },
    'wk-save': () => wkSave(),
    done: (el) => {
      const ex = el.closest('[data-ex]'), row = el.closest('[data-row]');
      const r = S.draft.entries[+ex.dataset.ex].rows[+row.dataset.row];
      r.done = !r.done; save();
      el.setAttribute('aria-pressed', r.done ? 'true' : 'false');
      const sb = $('#savebtn'); if (sb) sb.textContent = saveLabel();
    },
    addset: (el) => {
      const e = S.draft.entries[+el.closest('[data-ex]').dataset.ex], prev = e.rows[e.rows.length - 1];
      e.rows.push({ w: prev ? prev.w : '', r: '', rl: '', done: false }); save(); keepScroll(render);
    },
    delset: (el) => { const e = S.draft.entries[+el.closest('[data-ex]').dataset.ex]; if (e.rows.length > 1) { e.rows.pop(); save(); keepScroll(render); } },
    /* scheda */
    'p-open': (el) => { ui.editSession = el.dataset.id; ui.openEx = null; openSub(); render(); window.scrollTo(0, 0); },
    'p-back': () => closeSub(),
    'p-addsess': () => {
      const s = { id: 's' + uid(), name: 'Sessione ' + (S.plan.sessions.length + 1), day: null, exercises: [] };
      S.plan.sessions.push(s); save(); ui.editSession = s.id; ui.openEx = null; openSub(); render(); window.scrollTo(0, 0);
    },
    'p-delsess': (el) => {
      const i = S.plan.sessions.findIndex((z) => z.id === el.dataset.id); if (i < 0) return;
      const s = S.plan.sessions.splice(i, 1)[0]; save(); render();
      toast(`"${s.name}" eliminata`, { label: 'Annulla', fn: () => { S.plan.sessions.splice(i, 0, s); save(); render(); } });
    },
    'p-upsess': (el) => move(S.plan.sessions, el.dataset.id, -1),
    'p-downsess': (el) => move(S.plan.sessions, el.dataset.id, 1),
    'p-toggleex': (el) => { ui.openEx = ui.openEx === el.dataset.id ? null : el.dataset.id; keepScroll(render); },
    'p-addex': () => {
      const s = sessionById(ui.editSession); if (!s) return;
      const x = { id: 'x' + uid(), lid: 'l' + uid(), name: 'Nuovo esercizio', sets: 3, reps: '8/10', rest: '2 min', note: '', mono: false };
      s.exercises.push(x); save(); ui.openEx = x.id; render();
      const inp = document.querySelector(`[data-xid="${x.id}"][data-xf="name"]`); if (inp) { inp.scrollIntoView({ block: 'center' }); inp.focus(); inp.select(); }
    },
    'p-delex': (el) => {
      const s = sessionById(ui.editSession); if (!s) return;
      const i = s.exercises.findIndex((z) => z.id === el.dataset.id); if (i < 0) return;
      const x = s.exercises.splice(i, 1)[0]; save(); keepScroll(render);
      toast(`"${x.name}" eliminato`, { label: 'Annulla', fn: () => { s.exercises.splice(i, 0, x); save(); render(); } });
    },
    'p-upex': (el) => { const s = sessionById(ui.editSession); if (s) move(s.exercises, el.dataset.id, -1); },
    'p-downex': (el) => { const s = sessionById(ui.editSession); if (s) move(s.exercises, el.dataset.id, 1); },
    /* storico */
    'h-toggle': (el) => { ui.openLog = ui.openLog === el.dataset.id ? null : el.dataset.id; keepScroll(render); },
    'h-edit': (el) => {
      const l = S.logs.find((x) => x.id === el.dataset.id); if (!l) return;
      if (S.draft && !confirm(`Per modificare questo allenamento devo scartare quello non salvato (${S.draft.sessionName}). Continuare?`)) return;
      S.draft = draftFromLog(l); save(); ui.workout = true; openSub(); render(); window.scrollTo(0, 0);
    },
    'h-del': (el) => {
      const i = S.logs.findIndex((x) => x.id === el.dataset.id); if (i < 0) return;
      const l = S.logs.splice(i, 1)[0]; ui.openLog = null; save(); render();
      toast('Allenamento eliminato', { label: 'Annulla', fn: () => { S.logs.push(l); save(); render(); } });
    },
    export: () => exportData(),
    import: () => $('#importFile').click(),
  };
  function move(arr, id, d) {
    const i = arr.findIndex((z) => z.id === id), j = i + d;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; save(); keepScroll(render);
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const h = handlers[el.dataset.act]; if (h) h(el, e);
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.f) {
      const ex = t.closest('[data-ex]'), row = t.closest('[data-row]'); if (!ex || !row || !S.draft) return;
      S.draft.entries[+ex.dataset.ex].rows[+row.dataset.row][t.dataset.f] = t.value; saveSoon(); return;
    }
    if (t.dataset.xf) {
      const s = sessionById(ui.editSession); if (!s) return;
      const x = s.exercises.find((z) => z.id === t.dataset.xid); if (!x) return;
      const f = t.dataset.xf;
      if (f === 'mono') return;
      if (f === 'sets') { const n = parseInt(t.value, 10); if (n >= 1) x.sets = Math.min(n, 20); else return; }
      else x[f] = t.value;
      if (f === 'name') { const sn = t.closest('[data-x]').querySelector('[data-sumn]'); if (sn) sn.textContent = t.value; }
      saveSoon(); return;
    }
    if (t.dataset.pf === 'name') { const s = sessionById(ui.editSession); if (s) { s.name = t.value; saveSoon(); } }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'wk-date' && S.draft) { if (t.value) { S.draft.date = t.value; save(); } }
    else if (t.id === 'lift') { ui.progLid = t.value; render(); }
    else if (t.dataset.pf === 'day') { const s = sessionById(ui.editSession); if (s) { s.day = t.value === '' ? null : +t.value; save(); } }
    else if (t.dataset.xf === 'mono') { const s = sessionById(ui.editSession), x = s && s.exercises.find((z) => z.id === t.dataset.xid); if (x) { x.mono = t.checked; save(); } }
    else if (t.id === 'importFile' && t.files[0]) { importData(t.files[0]); t.value = ''; }
  });

  /* ---------- render ---------- */
  function render() {
    if (ui.workout && !S.draft) ui.workout = false;
    $('#nav').hidden = !!ui.workout;
    ['home', 'prog', 'plan', 'hist'].forEach((v) => {
      const b = $('#nav-' + v);
      b.classList.toggle('active', ui.view === v);
      b.setAttribute('aria-current', ui.view === v ? 'page' : 'false');
    });
    let html;
    if (ui.workout) html = viewWorkout();
    else if (ui.view === 'prog') html = viewProgress();
    else if (ui.view === 'plan') html = ui.editSession ? viewSessionEdit() : viewPlan();
    else if (ui.view === 'hist') html = viewHistory();
    else html = viewHome();
    $('#app').innerHTML = html;
    if (ui.view === 'prog' && !ui.workout) bindCharts();
  }
  render();

  let rzT = null;
  window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (ui.view === 'prog' && !ui.workout) render(); }, 200); });
  // il giorno cambia mentre l'app è aperta in background
  let lastDay = todayISO();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const t = todayISO();
      if (t !== lastDay) { lastDay = t; if (!ui.workout && !ui.editSession) render(); }
    }
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
