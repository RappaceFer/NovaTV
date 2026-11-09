'use strict';
/* NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT — https://github.com/RappaceFer/NovaTV
   Interface unique téléphone + Fire TV */

/* ================= utilitaires ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(t, a, ...kids) {
  const e = document.createElement(t);
  if (a) for (const [n, v] of Object.entries(a)) {
    if (v == null || v === false) continue;
    if (n === 'class') e.className = v;
    else if (n === 'html') e.innerHTML = v;
    else if (n.startsWith('on')) e.addEventListener(n.slice(2), v);
    else e.setAttribute(n, v === true ? '' : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
/* élément focalisable à la télécommande */
const F = (t, cls, a, ...k) => h(t, Object.assign({ class: 'f ' + (cls || ''), tabindex: '-1' }, a || {}), ...k);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get(k, d) { try { const v = localStorage.getItem('nv.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('nv.' + k, JSON.stringify(v)); } catch (e) { } }
};
function b64(s) {
  if (!s) return '';
  try { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new TextDecoder().decode(u); }
  catch (e) { return s; }
}
const p2 = n => String(n).padStart(2, '0');
const hm = t => { const d = new Date(t); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
function dur(s) { s = Math.max(0, Math.floor(s || 0)); const H = Math.floor(s / 3600), M = Math.floor(s % 3600 / 60), S = s % 60; return (H ? H + ':' + p2(M) : M) + ':' + p2(S); }
function durTxt(s) { s = Math.round((s || 0) / 60); if (!s) return ''; return s >= 60 ? Math.floor(s / 60) + ' h ' + p2(s % 60) : s + ' min'; }
const clean = n => String(n || '').replace(/^\s*(\[[^\]]{1,8}\]|\|[^|]{1,8}\||[A-Z0-9]{2,4}\s*[:|\-]\s)\s*/, '').trim() || String(n || '');
function initials(n) { const w = clean(n).replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean); return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 3)).toUpperCase(); }
const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const ADULT = /(adult|xxx|porn|18\s*\+|\+\s*18|for adults|erotic|érotique)/i;

const IC = {
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5v10h13v-10"/><path d="M10 19.5v-5h4v5"/>',
  live: '<rect x="3" y="6.5" width="18" height="13" rx="2.5"/><path d="m8.5 2.8 3.5 3.5 3.5-3.5"/>',
  guide: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8.5 9.5v11M8.5 15h12.5"/>',
  film: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M7.5 3.5v17M16.5 3.5v17M3.5 8.5h4M3.5 15.5h4M16.5 8.5h4M16.5 15.5h4"/>',
  series: '<rect x="3" y="7" width="18" height="13.5" rx="2.5"/><path d="M6.5 3.8h11"/><path d="m10.5 10.8 4.2 3-4.2 3z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  heartf: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" fill="currentColor"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>',
  play: '<path d="M7.5 4.8v14.4L19.5 12z" fill="currentColor"/>',
  pause: '<path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" fill="currentColor"/>',
  rew: '<path d="M11 6 4.5 12l6.5 6zM19.5 6 13 12l6.5 6z" fill="currentColor"/>',
  ffw: '<path d="M13 6l6.5 6-6.5 6zM4.5 6 11 12l-6.5 6z" fill="currentColor"/>',
  prev: '<path d="M18.5 5.5v13L9 12z" fill="currentColor"/><path d="M6 5.5v13"/>',
  next: '<path d="M5.5 5.5v13L15 12z" fill="currentColor"/><path d="M18 5.5v13"/>',
  up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.7v.1"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3"/>',
  server: '<rect x="3.5" y="4" width="17" height="7" rx="2"/><rect x="3.5" y="13" width="17" height="7" rx="2"/><path d="M7 7.5h.1M7 16.5h.1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l1 13h9l1-13"/>',
  out: '<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5"/>',
  stream: '<path d="M4 18.5a8 8 0 0 1 16 0"/><path d="M7.5 18.5a4.5 4.5 0 0 1 9 0"/><circle cx="12" cy="18.5" r="1"/>',
  skip: '<path d="M5 6v12l9-6z" fill="currentColor"/><path d="M17.5 6v12"/>',
  back: '<path d="M10 6 4 12l6 6M4.5 12h15"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
  tv: '<rect x="3" y="5" width="18" height="12.5" rx="2.2"/><path d="M8 20.5h8"/>',
  cc: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M10.6 10.2a2.4 2.4 0 1 0 0 3.6M17.1 10.2a2.4 2.4 0 1 0 0 3.6"/>',
  ext: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>',
  trailer: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10.2 9 5 3-5 3z" fill="currentColor"/>',
  hide: '<path d="M3.5 3.5l17 17"/><path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4M6.6 7.1A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5a9.2 9.2 0 0 0 4.5-1.1"/><path d="M9.9 10a3 3 0 0 0 4.2 4.2"/>'
};
const ic = (n, c) => h('span', { class: 'ic ' + (c || ''), html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>' });

const LOGO = '<svg class="logo" viewBox="0 0 240 70" aria-label="NovaTV"><defs><linearGradient id="lg1" x1="0" x2="1"><stop offset="0" stop-color="#6f9bff"/><stop offset="1" stop-color="#b56cff"/></linearGradient></defs>'
  + '<ellipse cx="124" cy="38" rx="112" ry="20" fill="none" stroke="url(#lg1)" stroke-width="2.2" transform="rotate(-9 124 38)" opacity=".9"/>'
  + '<g transform="skewX(-10)"><text x="22" y="52" font-family="Display,Inter,sans-serif" font-weight="800" font-size="46" letter-spacing="-1" fill="#fff">Nova<tspan fill="url(#lg1)">TV</tspan></text></g>'
  + '<path d="M222 10l2.2 5.6 5.8 2.2-5.8 2.2-2.2 5.6-2.2-5.6-5.8-2.2 5.8-2.2z" fill="#fff"/></svg>';
const MARK = '<svg viewBox="0 0 48 48"><defs><linearGradient id="lg2" x1="0" x2="1"><stop offset="0" stop-color="#6f9bff"/><stop offset="1" stop-color="#b56cff"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="13" fill="url(#lg2)"/><ellipse cx="24" cy="25" rx="18" ry="7.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" transform="rotate(-14 24 25)"/><text x="25.5" y="33" text-anchor="middle" font-family="Display,Inter,sans-serif" font-weight="800" font-size="26" fill="#fff" transform="skewX(-8) translate(3.5 0)">N</text><path d="M37.5 9l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#fff"/></svg>';

/* ================= état ================= */
const S = {
  acc: store.get('acc', null),
  info: null,
  set: Object.assign({ liveFmt: 'm3u8', autoNext: true, adult: false, pin: '' }, store.get('set', {})),
  favs: Object.assign({ live: [], vod: [], series: [] }, store.get('favs', {})),
  prog: store.get('prog', {}),
  seen: store.get('seen', {}),   /* films et épisodes vus jusqu'au bout */
  recent: store.get('recent', []),
  cache: {}
};
const saveSet = () => store.set('set', S.set);
S.set = Object.assign({ lang: 'fr', subs: 'auto', player: 'internal', trailer: 'auto', langFirst: true }, S.set);
S.hidden = Object.assign({ live: [], vod: [], series: [] }, store.get('hidden', {}));
S.ver = 1; /* incrémenté quand l'affichage des catégories change : les pages se reconstruisent */
const saveHidden = () => { store.set('hidden', S.hidden); S.ver++; };

/* ---- langues ---- */
const LANGS = {
  fr: { n: 'Français', c: ['fr', 'fre', 'fra', 'fra', 'french', 'francais', 'français', 'france', 'vf', 'vff', 'vfq', 'vfi', 'truefrench', 'vostfr', 'qc', 'be', 'ch'], q: 'bande annonce vf' },
  en: { n: 'English', c: ['en', 'eng', 'english', 'anglais', 'uk', 'us', 'usa', 'gb', 'vo', 'vost'], q: 'official trailer' },
  es: { n: 'Español', c: ['es', 'spa', 'esp', 'spanish', 'español', 'espanol', 'espagnol', 'latino', 'mx'], q: 'tráiler español' },
  de: { n: 'Deutsch', c: ['de', 'ger', 'deu', 'german', 'deutsch', 'allemand', 'at'], q: 'trailer deutsch' },
  it: { n: 'Italiano', c: ['it', 'ita', 'italian', 'italiano', 'italien'], q: 'trailer italiano' },
  pt: { n: 'Português', c: ['pt', 'por', 'portuguese', 'português', 'portugais', 'br'], q: 'trailer dublado' },
  ar: { n: 'العربية', c: ['ar', 'ara', 'arabic', 'arab', 'arabe', 'عربي'], q: 'trailer arabic' },
  tr: { n: 'Türkçe', c: ['tr', 'tur', 'turkish', 'türk', 'turk', 'turc'], q: 'fragman' }
};
const OTHER = /^(nl|pl|ru|ro|al|gr|in|pk|af|ex-?yu|se|sw|no|dk|fi|cz|hu|bg|ir|il|kr|jp|cn|ph|th|vn|ku|kurd|hr|rs|ba|mk|si|sk|ua|lt|lv|ee|latam|asia|africa|india|hindi|ru|rus|pol|nld|swe|nor|dan|fin|ces|hun|bul|per|heb|kor|jpn|chi|zho)$/;
/* langue d'une catégorie : préfixe « FR| », « [EN] », « UK: »… ou mot-clé (French, VOSTFR…) ; null si neutre */
function catLang(name) {
  const s = String(name || '').toLowerCase();
  const m = s.match(/^\s*[\[|(]?\s*([a-zà-ÿ-]{2,6})\s*[\]|):\-]/);
  const first = m ? m[1] : null;
  if (first) {
    for (const k in LANGS) if (LANGS[k].c.includes(first)) return k;
    if (OTHER.test(first)) return 'other';
  }
  const toks = s.split(/[^a-zà-ÿ\u0600-\u06ff]+/).filter(Boolean);
  for (const t of toks) if (t.length > 2 || t === 'vf' || t === 'vo') for (const k in LANGS) if (LANGS[k].c.includes(t)) return k;
  return null;
}
const langMatch = (code, lang) => { code = String(code || '').toLowerCase(); return !!code && LANGS[lang].c.some(c => code === c || code.startsWith(c + '-') || code.startsWith(c + '_')); };

/* ---- divers ---- */
const isTV = () => !('ontouchstart' in window) && !(navigator.maxTouchPoints > 0);
const ASSET = 'https://appassets.androidplatform.net/';
function ytId(s) { const m = String(s || '').match(/(?:v=|youtu\.be\/|embed\/|^)([A-Za-z0-9_-]{11})(?:$|[&?#\/])/); return m ? m[1] : null; }
/* langue d'une piste à partir de son nom (« Track 1 - [French] », « Piste 2 - [fre] »…) */
function nameLang(n) {
  const toks = String(n || '').toLowerCase().split(/[^a-zà-ÿ؀-ۿ]+/).filter(Boolean);
  for (const k in LANGS) if (toks.some(t => t.length > 2 ? LANGS[k].c.includes(t) : t === k)) return k;
  return null;
}
function trackLabel(t) {
  const g = nameLang(t.name);
  const raw = String(t.name || '').trim().replace(/\btrack\b/i, 'Piste').replace(/\bsubtitles?\b/i, 'Sous-titres');
  const rest = raw.replace(/\[[^\]]*\]/g, '').replace(/^\s*-\s*|\s*-\s*$/g, '').trim();
  if (g) return [LANGS[g].n, rest && rest.toLowerCase() !== LANGS[g].n.toLowerCase() ? rest : ''];
  return [rest || raw || 'Piste ' + t.id, ''];
}
/* Les fournisseurs IPTV mettent souvent chaque langue dans un fichier séparé
   (« Dune VF », « Dune VOSTFR », « Dune MULTI »…). On les regroupe par titre. */
const VTAG = /\b(vf|vff|vfq|vfi|vf2|vostfr|vost|vo|multi|truefrench|french|fr|en|eng|english|4k|uhd|fhd|hd|sd|hdr|hdr10|dv|3d|1080p|720p|2160p|x264|x265|hevc|web|webrip|bluray|remux|dub|dubbed|sub|subbed|latino|cam|ts)\b/g;
function titleKey(n) {
  return clean(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/[|:._\-–—,!?'’"]/g, ' ')
    .replace(VTAG, ' ').replace(/\b(19|20)\d{2}\b/g, ' ').replace(/\s+/g, ' ').trim();
}
async function versionsOf(it) {
  const kind = it.k === 'series' ? 'series' : 'vod';
  const key = titleKey(it.n);
  if (key.length < 2) return [];
  const idx = await cached('vidx:' + kind, async () => {
    const m = new Map();
    for (const x of await all(kind)) { const k = titleKey(x.n); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
    return m;
  });
  const names = new Map((await catsRaw(kind).catch(() => [])).map(c => [c.id, c.n]));
  const list = (idx.get(key) || []).filter(x => x.id !== it.id);
  const label = x => {
    const n = clean(x.n).toLowerCase(), cn = names.get(x.c) || '';
    if (/\bmulti\b/.test(n)) return 'MULTI (plusieurs langues)';
    if (/\bvostfr\b/.test(n) || /vostfr/i.test(cn)) return 'VOSTFR (sous-titré)';
    if (/\b(vf|vff|vfq|truefrench|french)\b/.test(n)) return 'VF (français)';
    if (/\bvo\b/.test(n)) return 'VO (version originale)';
    const g = catLang(cn) || catLang(x.n);
    if (g === 'fr') return 'VF (français)';
    if (g && g !== 'other') return LANGS[g].n;
    return null;   /* même titre dans une autre catégorie, langue inconnue : pas une autre langue */
  };
  const mine = label(it), seen = new Set([mine]);
  const out = list.map(x => Object.assign({}, x, { lab: label(x) })).filter(x => x.lab && !seen.has(x.lab) && seen.add(x.lab));
  out.mine = mine;
  return out;
}
function openVersion(x, from) {
  if (x.k === 'series') go('show', { it: x, autoSE: from && from.se }, true);
  else if (from && from.play) go('player', { kind: 'vod', it: x, start: from.t || 0 }, true);
  else go('movie', { it: x }, true);
}

if (!S.set.m42) { S.set.liveFmt = 'ts'; S.set.m42 = 1; saveSet(); }

/* ================= API Xtream ================= */
const base = () => S.acc.server.replace(/\/+$/, '');
async function api(params, opt) {
  opt = opt || {};
  const q = new URLSearchParams(Object.assign({ username: S.acc.user, password: S.acc.pass }, params || {}));
  const url = base() + '/player_api.php?' + q;
  const retries = opt.retries == null ? 2 : opt.retries;
  for (let a = 0; ; a++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), opt.timeout || 25000);
    try {
      const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const txt = await r.text();
      return txt ? JSON.parse(txt) : null;
    } catch (e) {
      if (a >= retries) throw e;
      await sleep(700 * (a + 1));
    } finally { clearTimeout(t); }
  }
}
function cached(key, fn) {
  if (!S.cache[key]) S.cache[key] = fn().catch(e => { delete S.cache[key]; throw e; });
  return S.cache[key];
}
const arr = d => Array.isArray(d) ? d : (d && typeof d === 'object' ? Object.values(d) : []);
const nLive = x => ({ k: 'live', id: +x.stream_id, n: x.name || '', i: x.stream_icon || '', c: String(x.category_id || ''), num: x.num });
const nVod = x => ({ k: 'vod', id: +x.stream_id, n: x.name || '', i: x.stream_icon || x.cover || '', c: String(x.category_id || ''), x: x.container_extension || 'mp4', r: +x.rating || 0, y: x.year || '' });
const nSer = x => ({ k: 'series', id: +x.series_id, n: x.name || '', i: x.cover || '', c: String(x.category_id || ''), r: +x.rating || 0, y: (x.releaseDate || x.release_date || '').slice(0, 4) });
const NORM = { live: nLive, vod: nVod, series: nSer };
const ACT = { live: ['get_live_categories', 'get_live_streams'], vod: ['get_vod_categories', 'get_vod_streams'], series: ['get_series_categories', 'get_series'] };
function catsRaw(kind) {
  return cached('cats:' + kind, () => api({ action: ACT[kind][0] }).then(d => arr(d).map(c => ({ id: String(c.category_id), n: c.category_name || '' }))))
    .then(l => S.set.adult ? l : l.filter(c => !ADULT.test(c.n)));
}
/* catégories affichées : sans les masquées, langue préférée en tête */
function cats(kind) {
  return catsRaw(kind).then(l => {
    const hid = new Set(S.hidden[kind]);
    l = l.filter(c => !hid.has(c.id));
    if (S.set.langFirst) {
      const pref = l.filter(c => catLang(c.n) === S.set.lang);
      if (pref.length) { const ps = new Set(pref); l = pref.concat(l.filter(c => !ps.has(c))); }
    }
    return l;
  });
}
function items(kind, cat) {
  if (cat === 'fav') return Promise.resolve(S.favs[kind].slice());
  if (cat === 'all') return all(kind);
  return cached('it:' + kind + ':' + cat, () => api({ action: ACT[kind][1], category_id: cat }).then(d => arr(d).map(NORM[kind])));
}
/* catalogue complet limité aux catégories visibles (recherche).
   Peu de catégories visibles : on ne télécharge que celles-là, c'est plus rapide. */
async function all(kind) {
  const vis = await cats(kind).catch(() => null);
  if (vis && S.hidden[kind].length && vis.length <= 25) {
    const out = []; let i = 0;
    await Promise.all([0, 1, 2, 3].map(async () => { while (i < vis.length) { const c = vis[i++]; out.push(...await items(kind, c.id).catch(() => [])); } }));
    return out;
  }
  const l = await cached('all:' + kind, () => api({ action: ACT[kind][1] }, { timeout: 90000 }).then(d => arr(d).map(NORM[kind])));
  if (!vis) return l;
  const ok = new Set(vis.map(c => c.id));
  return l.filter(x => !x.c || ok.has(x.c));
}
function hideCat(kind, c) {
  if (!c || c.id === 'fav') return;
  ask('Masquer « ' + clean(c.n) + ' » ?', 'Elle n’apparaîtra plus dans les listes, le guide, l’accueil ni la recherche.\nVous pourrez la réafficher dans Réglages › Catégories.',
    [{ t: 'Masquer', pri: true, act: () => { if (!S.hidden[kind].includes(c.id)) S.hidden[kind].push(c.id); saveHidden(); toast('Catégorie masquée'); sync(); } }, { t: 'Annuler' }]);
}
const urlLive = (id, fmt) => `${base()}/live/${encodeURIComponent(S.acc.user)}/${encodeURIComponent(S.acc.pass)}/${id}.${fmt || S.set.liveFmt}`;
const urlVod = it => `${base()}/movie/${encodeURIComponent(S.acc.user)}/${encodeURIComponent(S.acc.pass)}/${it.id}.${it.x || 'mp4'}`;
const urlEp = ep => `${base()}/series/${encodeURIComponent(S.acc.user)}/${encodeURIComponent(S.acc.pass)}/${ep.id}.${ep.x || 'mp4'}`;

/* EPG courte, file d'attente LIFO (les lignes visibles d'abord) */
const EPG = { m: new Map(), q: [], run: 0 };
function epg(sid) {
  const c = EPG.m.get(sid);
  if (c && Date.now() - c.at < 10 * 60e3) return c.p;
  const p = new Promise(res => { EPG.q.push({ sid, res }); pumpEpg(); });
  EPG.m.set(sid, { at: Date.now(), p });
  return p;
}
function pumpEpg() {
  while (EPG.run < 4 && EPG.q.length) {
    const j = EPG.q.pop(); EPG.run++;
    api({ action: 'get_short_epg', stream_id: j.sid, limit: 24 }, { retries: 1, timeout: 15000 })
      .then(d => (d && d.epg_listings || []).map(x => ({
        t: b64(x.title), d: b64(x.description),
        s: x.start_timestamp ? x.start_timestamp * 1000 : Date.parse(String(x.start).replace(' ', 'T')),
        e: x.stop_timestamp ? x.stop_timestamp * 1000 : Date.parse(String(x.end || x.stop).replace(' ', 'T'))
      })).filter(x => x.s && x.e && x.e > x.s).sort((a, b) => a.s - b.s))
      .catch(() => { EPG.m.delete(j.sid); return []; })
      .then(l => { EPG.run--; j.res(l); pumpEpg(); });
  }
}
const nowOf = l => { const t = Date.now(); const i = l.findIndex(p => p.s <= t && p.e > t); return i < 0 ? [null, l.find(p => p.s > t) || null] : [l[i], l[i + 1] || null]; };

/* favoris, progression, récents */
const isFav = it => S.favs[it.k].some(x => x.id === it.id);
function toggleFav(it) {
  const l = S.favs[it.k], i = l.findIndex(x => x.id === it.id);
  if (i >= 0) l.splice(i, 1); else l.unshift({ k: it.k, id: it.id, n: it.n, i: it.i, c: it.c, x: it.x, r: it.r, y: it.y });
  store.set('favs', S.favs);
  toast((i >= 0 ? '♡  Retiré des favoris : ' : '♥  Ajouté aux favoris : ') + clean(it.n));
  if (R.stack[0] && R.stack[0].view === 'home') R.stack[0].ver = -1;   /* l'accueil se met à jour au retour */
  return i < 0;
}
/* une seule reprise par série : l'épisode en cours, ou le suivant quand le précédent est fini */
function dropSeries(sid, except) { for (const k in S.prog) if (k !== except && S.prog[k].k === 'ep' && S.prog[k].sid === sid) delete S.prog[k]; }
function setProg(key, t, d, meta, next) {
  if (!d || d < 60) return;
  const done = t > d - 90 || t / d > 0.93;
  if (done) {
    delete S.prog[key];
    S.seen[key] = Date.now();
    if (meta.k === 'ep') {
      dropSeries(meta.sid);
      if (next) S.prog['ep:' + next.id] = Object.assign({}, meta, next.meta, { t: 0, d: next.d || 0, at: Date.now(), nx: 1 });
    }
  } else if (t >= 20) {
    if (meta.k === 'ep') dropSeries(meta.sid, key);
    S.prog[key] = Object.assign({}, meta, { t: Math.floor(t), d: Math.floor(d), at: Date.now() });
  } else return;
  const keys = Object.keys(S.prog).sort((a, b) => S.prog[b].at - S.prog[a].at);
  keys.slice(40).forEach(k => delete S.prog[k]);
  const sk = Object.keys(S.seen); if (sk.length > 4000) sk.sort((a, b) => S.seen[a] - S.seen[b]).slice(0, sk.length - 4000).forEach(k => delete S.seen[k]);
  store.set('prog', S.prog); store.set('seen', S.seen);
  if (R.stack[0] && R.stack[0].view === 'home') R.stack[0].ver = -1;
}
function setSeen(key, on) {
  if (on) { S.seen[key] = Date.now(); delete S.prog[key]; } else delete S.seen[key];
  store.set('seen', S.seen); store.set('prog', S.prog);
  if (R.stack[0] && R.stack[0].view === 'home') R.stack[0].ver = -1;
}
const homeDirty = () => { if (R.stack[0] && R.stack[0].view === 'home') R.stack[0].ver = -1; };
function addRecent(it) {
  S.recent = [{ k: 'live', id: it.id, n: it.n, i: it.i, c: it.c }].concat(S.recent.filter(x => x.id !== it.id)).slice(0, 15);
  store.set('recent', S.recent);
}

/* ================= toast, horloge ================= */
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
const clockTxt = () => hm(Date.now());
setInterval(() => $$('.clock').forEach(c => c.textContent = clockTxt()), 10000);

/* ================= navigation (pile + historique) ================= */
const V = {};
const R = { stack: [], seq: 0, guarded: false, repush: false, pending: null, after: null };
const topE = () => R.stack[R.stack.length - 1];

function go(view, params, replace) {
  const cur = topE();
  if (cur) remember(cur);
  const e = { view, params: params || {}, id: ++R.seq };
  if (replace && cur) { dispose(cur); R.stack[R.stack.length - 1] = e; history.replaceState({ i: R.stack.length - 1 }, ''); }
  else { R.stack.push(e); history.pushState({ i: R.stack.length - 1 }, ''); }
  sync();
}
function back() { if (R.stack.length > 1) history.back(); }
function closeThen(fn) { R.after = fn; back(); }
/* changement de rubrique : la pile reste [Accueil, rubrique] pour que Retour ramène toujours à l'Accueil */
function goTop(view) {
  const n = R.stack.length;
  if (view === 'home') { if (n > 1) history.go(-(n - 1)); return; }
  if (n === 1) return go(view);
  if (n === 2) { if (R.stack[1].view !== view) go(view, {}, true); return; }
  R.pending = { at: 1, view }; history.go(-(n - 2));
}
function resetTo(view) {
  const n = R.stack.length;
  if (n === 1) return go(view, {}, true);
  R.pending = { at: 0, view }; history.go(-(n - 1));
}
addEventListener('popstate', ev => {
  const i = ev.state && typeof ev.state.i === 'number' ? ev.state.i : -1;
  if (i < 0) { R.repush = true; toast('Appuyez encore sur Retour pour quitter'); return; }
  if (i >= R.stack.length) return;
  while (R.stack.length - 1 > i) dispose(R.stack.pop());
  if (R.pending && R.pending.at === i) {
    const p = R.pending; R.pending = null;
    dispose(R.stack[i]);
    R.stack[i] = { view: p.view, params: {}, id: ++R.seq };
    history.replaceState({ i }, '');
  }
  sync();
  if (R.after) { const f = R.after; R.after = null; setTimeout(f, 0); }
});
/* garde anti-sortie : posée au premier geste de l'utilisateur */
function guard() {
  if (R.repush) { R.repush = false; history.pushState({ i: 0 }, ''); return; }
  if (!R.guarded && R.stack.length === 1) { R.guarded = true; history.replaceState({ i: -1 }, ''); history.pushState({ i: 0 }, ''); }
}

function dispose(e) {
  if (!e) return;
  try { e.cleanup && e.cleanup(); } catch (x) { console.error(x); }
  e.dead = true;
  if (e.el) e.el.remove();
}
function sync() {
  let pi = R.stack.length - 1;
  while (pi > 0 && V[R.stack[pi].view].overlay) pi--;
  const page = R.stack[pi];
  R.stack.forEach((e, i) => { if (e.el) e.el.hidden = i < pi || (i !== pi && !V[e.view].overlay); });
  for (let i = pi; i < R.stack.length; i++) if (!R.stack[i].el) mount(R.stack[i]);
  const pv = V[page.view];
  if (page.el && page.ver !== S.ver && page === R.stack[pi] && pi === R.stack.length - 1 && !pv.keep) {
    try { page.cleanup && page.cleanup(); } catch (x) { }
    page.cleanup = null; page.el.remove(); page.el = null; mount(page);
  }
  $('#app').classList.toggle('bare', !!pv.bare);
  $$('.ni').forEach(n => n.classList.toggle('on', n.dataset.v === pv.sec));
  page.onShow && page.onShow();
  restore(topE());
  PL.update();
}
function mount(e) {
  const v = V[e.view];
  e.auto = true; e.ver = S.ver;
  e.el = h('div', { class: (v.overlay ? '' : 'page ') + (v.cls || '') });
  (v.overlay ? $('#layers') : $('#main')).append(e.el);
  try { v.render(e.el, e.params, e); } catch (x) { console.error(x); }
}

/* ================= focus & télécommande ================= */
const isF = el => el && el.classList && el.classList.contains('f');
function visible(el) {
  if (!el || !el.isConnected || el.closest('[hidden]')) return false;
  const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
}
function scope() { const t = topE(); return t && V[t.view].overlay ? t.el : $('#app'); }
function remember(e) { const a = document.activeElement; if (a && e.el && e.el.contains(a) && a.dataset.k) e.fk = a.dataset.k; }
function focusEl(el) { if (el) el.focus({ preventScroll: true }); }
function firstIn(root) { return $$('[data-first]', root).find(visible) || $$('.f', root).find(visible); }
function restore(e) {
  if (!e || !e.el) return;
  const want = e.fk;
  let el = want && $$('[data-k]', e.el).find(x => x.dataset.k === want);
  if (visible(el)) { focusEl(el); return; }
  el = firstIn(e.el);
  if (el) { focusEl(el); e.fk = want || e.fk; }   /* l'élément voulu arrive peut-être après chargement : on le garde en mémoire */
}
/* après un chargement asynchrone : redonner le focus si personne ne l'a */
function settle(e) {
  if (topE() !== e) return;
  const a = document.activeElement;
  if (!a || a === document.body || !visible(a) || !isF(a) || (e.auto && !e.el.contains(a))) restore(e);
  else if (e.fk && a.dataset.k !== e.fk && e.el.contains(a) && a.hasAttribute('data-first')) restore(e);
}
function clipRect(el) {
  const r = el.getBoundingClientRect();
  let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (p.classList.contains('gscroll') || p.classList.contains('row') || p.classList.contains('scroll')) {
      const q = p.getBoundingClientRect();
      x1 = Math.max(x1, q.left + (+p.dataset.ml || 0)); y1 = Math.max(y1, q.top + (+p.dataset.mt || 0)); x2 = Math.min(x2, q.right); y2 = Math.min(y2, q.bottom);
    }
  }
  if (x2 - x1 < 4 || y2 - y1 < 4) return r;
  return { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 };
}
function gapOf(a1, a2, b1, b2) { return a2 < b1 ? b1 - a2 : b2 < a1 ? a1 - b2 : 0; }
function findNext(cur, dir, sc) {
  const r = clipRect(cur), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
  /* haut/bas : on parcourt d'abord toute la liste défilante avant d'en sortir
     (sinon une ligne cachée sous un champ fixe, comme en recherche, est sautée) */
  const box = (dir === 'up' || dir === 'down') ? cur.closest('.scroll,.gscroll') : null;
  /* menu de gauche (vertical, sur TV) : haut/bas restent dans le menu ; seule la flèche droite en sort.
     Ouvert, le menu s'élargit par-dessus les affiches : sans cette règle, « bas » repartait dans le contenu. */
  const nav = cur.closest('#nav');
  const navLock = nav && (dir === 'up' || dir === 'down') && nav.offsetHeight > nav.offsetWidth;
  let best = null, bs = Infinity;
  for (const el of sc.querySelectorAll('.f')) {
    if (el === cur || el.closest('[hidden]')) continue;
    if (navLock && !nav.contains(el)) continue;
    const c = el.getBoundingClientRect();
    if (!c.width || !c.height) continue;
    let main, cross, off;
    if (dir === 'right') { if (c.left < r.right - 2 || c.right <= r.right) continue; main = c.left - r.right; cross = gapOf(c.top, c.bottom, r.top, r.bottom); off = Math.abs((c.top + c.bottom) / 2 - cy); }
    else if (dir === 'left') { if (c.right > r.left + 2 || c.left >= r.left) continue; main = r.left - c.right; cross = gapOf(c.top, c.bottom, r.top, r.bottom); off = Math.abs((c.top + c.bottom) / 2 - cy); }
    else if (dir === 'down') { if (c.top < r.bottom - 2 || c.bottom <= r.bottom) continue; main = c.top - r.bottom; cross = gapOf(c.left, c.right, r.left, r.right); off = Math.abs(Math.max(c.left, Math.min(cx, c.right)) - cx); }
    else { if (c.bottom > r.top + 2 || c.top >= r.top) continue; main = r.top - c.bottom; cross = gapOf(c.left, c.right, r.left, r.right); off = Math.abs(Math.max(c.left, Math.min(cx, c.right)) - cx); }
    const s = Math.max(0, main) + cross * 3 + (cross > 0 ? 200 : 0) + off * 0.05 + (box && !box.contains(el) ? 5000 : 0);
    if (s < bs) { bs = s; best = el; }
  }
  return best;
}
function move(dir) {
  const sc = scope(), cur = document.activeElement;
  if (topE()) topE().auto = false;
  if (!isF(cur) || !sc.contains(cur) || !visible(cur)) { restore(topE()); return; }
  if (cur._nav && cur._nav(dir)) return;
  let nx = findNext(cur, dir, sc);
  if (!nx) {
    const lz = cur.closest('[data-lazy]');
    if (lz && lz._lazy && lz._lazy.more()) nx = findNext(cur, dir, sc);
  }
  if (!nx) return;
  const z1 = cur.closest('[data-zone]'), z2 = nx.closest('[data-zone]');
  if (z2 && z1 !== z2) {
    if (z2.id === 'nav') nx = $('.ni.on') || nx;
    else if (z2._last && visible(z2._last) && z2.contains(z2._last)) nx = z2._last;
  }
  focusEl(nx);
}
function reveal(el) {
  const rp = remPx();
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const cs = getComputedStyle(p);
    const oy = /(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight;
    const ox = /(auto|scroll)/.test(cs.overflowX) && p.scrollWidth > p.clientWidth;
    if (!oy && !ox) continue;
    const pr = p.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (oy) {
      const mt = (+p.dataset.mt || 0) + Math.min(pr.height * .2, 4 * rp), mb = Math.min(pr.height * .2, 4 * rp);
      if (r.top < pr.top + mt) p.scrollTop -= pr.top + mt - r.top;
      else if (r.bottom > pr.bottom - mb) p.scrollTop += r.bottom - pr.bottom + mb;
      /* premier / dernier élément sélectionnable de la liste : on montre aussi ce qui est au-dessus / en dessous
         (textes non sélectionnables comme « À propos », sinon inaccessibles à la télécommande) */
      const fs = p.querySelectorAll('.f');
      if (fs.length && fs[fs.length - 1] === el && !(p.dataset.lazy && p._lazy && p._lazy.n < (p._lazy.total || 0))) p.scrollTop = p.scrollHeight;
      else if (fs.length && fs[0] === el) p.scrollTop = 0;
    }
    if (ox) {
      const ml = (+p.dataset.ml || 0) + 2.5 * rp, mr = 2.5 * rp;
      if (r.left < pr.left + ml) p.scrollLeft -= pr.left + ml - r.left;
      else if (r.right > pr.right - mr) p.scrollLeft += Math.min(r.right - pr.right + mr, r.left - pr.left - ml);
    }
  }
}
document.addEventListener('focusin', ev => {
  const el = ev.target;
  if (!isF(el)) return;
  if (document.body.classList.contains('kbd')) reveal(el);
  const z = el.closest('[data-zone]'); if (z) z._last = el;
  const lz = el.closest('[data-lazy]');
  if (lz && lz._lazy && +el.dataset.li > lz._lazy.n - 14) lz._lazy.more();
  const t = topE(); if (t && t.el && t.el.contains(el) && el.dataset.k) t.fk = el.dataset.k;
  el._focus && el._focus();
});
function activate(el) {
  if (el.tagName === 'INPUT') { el.blur(); el.readOnly = false; el.focus(); return; }
  el.click();
}
const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
/* La télécommande Fire TV peut transmettre chaque appui deux fois de suite :
   une même touche reçue à moins de 90 ms d'intervalle est ignorée. */
let lastKey = '', lastKeyAt = 0, press = null;
const OK_KEYS = { Enter: 1, ' ': 1, Select: 1 };
document.addEventListener('keydown', ev => {
  const nowK = performance.now();
  if ((KEYS[ev.key] || OK_KEYS[ev.key] || /^(Media|Channel|Page|Context|Menu|Escape|Backspace|BrowserBack|GoBack)/.test(ev.key))) {
    if (ev.key === lastKey && nowK - lastKeyAt < 90) { ev.preventDefault(); return; }
    lastKey = ev.key; lastKeyAt = nowK;
  }
  guard();
  document.body.classList.add('kbd');
  const t = topE(), a = document.activeElement;
  const editing = a && a.tagName === 'INPUT' && !a.readOnly;
  if (editing) {
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') { ev.preventDefault(); a.readOnly = true; move(KEYS[ev.key]); }
    else if (ev.key === 'Enter') { ev.preventDefault(); a.readOnly = true; a._submit && a._submit(); }
    else if (ev.key === 'Escape') { a.readOnly = true; }
    return;
  }
  if (t && t.onKey && t.onKey(ev) === true) { ev.preventDefault(); return; }
  if (KEYS[ev.key]) { ev.preventDefault(); move(KEYS[ev.key]); return; }
  switch (ev.key) {
    case 'Enter': case ' ': case 'Select':
      ev.preventDefault();
      if (ev.repeat) break;
      /* tant que OK n'est pas relâché, les signaux répétés de la télécommande sont ignorés
         (sinon, après l'appui long, le relâchement relançait le film) */
      if (press && nowK - press.at > 5000) press = null;   /* sécurité : relâchement jamais reçu */
      if (press) break;
      if (isF(a) && a._menu) {
        /* appui long sur OK : favori (contenus) ou masquage (catégories) ; appui court : ouvrir */
        const p = press = { el: a, at: nowK, done: false };
        p.t = setTimeout(() => { p.done = true; if (document.activeElement === p.el) p.el._menu(); }, 650);
      } else if (isF(a)) activate(a);
      else restore(t);
      break;
    case 'ContextMenu': case 'Menu':
      if (a && a._menu) { ev.preventDefault(); a._menu(); }
      break;
    case 'Escape': case 'Backspace': case 'BrowserBack': case 'GoBack':
      ev.preventDefault(); back(); break;
  }
});
document.addEventListener('keyup', ev => {
  if (!OK_KEYS[ev.key] || !press) return;
  ev.preventDefault();
  const p = press; press = null;
  clearTimeout(p.t);
  if (!p.done && document.activeElement === p.el) activate(p.el);
});
document.addEventListener('pointerdown', ev => {
  guard();
  if (topE()) topE().auto = false;
  document.body.classList.remove('kbd');
  if (ev.target.tagName === 'INPUT') ev.target.readOnly = false;
}, true);
document.addEventListener('contextmenu', ev => {
  ev.preventDefault();
  /* à la télécommande, l'appui long est déjà géré par la touche OK : la Fire TV envoie aussi
     un « menu contextuel » qu'il faut ignorer pour ne pas faire l'action deux fois */
  if (document.body.classList.contains('kbd') || press) return;
  const f = ev.target.closest && ev.target.closest('.f');
  if (f && f._menu) f._menu();
});
document.addEventListener('focusout', ev => { if (ev.target.tagName === 'INPUT') ev.target.readOnly = true; });

/* ================= composants ================= */
function art(src, name, cls) {
  const ph = h('div', { class: 'ph' }, initials(name));
  if (!src) return [ph];
  const im = h('img', { class: cls == null ? 'cv' : cls, loading: 'lazy', decoding: 'async', alt: '', src, style: 'position:relative;z-index:1', 'data-ini': initials(name) });
  im.onload = () => ph.remove();
  im.onerror = () => im.remove();
  return [ph, im];
}
function header(title, sub, extra) {
  return h('div', { class: 'hdr' }, h('div', { class: 'grow' }, h('h1', null, title), sub ? h('div', { class: 'sub' }, sub) : null), extra || null, h('div', { class: 'clock' }, clockTxt()));
}
function lazy(container, list, make, chunk) {
  chunk = chunk || 48;
  const st = { n: 0 };
  st.more = () => {
    if (st.n >= list.length) return false;
    const end = Math.min(list.length, st.n + chunk), fr = document.createDocumentFragment();
    for (; st.n < end; st.n++) { const el = make(list[st.n], st.n); el.dataset.li = st.n; fr.append(el); }
    container.append(fr);
    return true;
  };
  container.dataset.lazy = '1'; container._lazy = st; st.more();
  return st;
}
function empty(icn, title, txt) { return h('div', { class: 'empty' }, ic(icn), h('b', null, title), txt ? h('div', null, txt) : null); }
const spinner = () => h('div', { class: 'center' }, h('div', { class: 'spin' }));

function cardPoster(it, kp) {
  const pr = it.k === 'vod' ? S.prog['vod:' + it.id] : null;
  const c = F('div', 'card poster', { 'data-k': (kp || '') + it.k + ':' + it.id },
    h('div', { class: 'im' }, art(it.i, it.n), it.r ? h('span', { class: 'badge r' }, '★ ' + (+it.r).toFixed(1)) : null,
      S.seen[it.k + ':' + it.id] ? h('span', { class: 'badge seen' }, '✓ Vu') : null,
      pr ? h('div', { class: 'pbar' }, h('i', { style: 'width:' + Math.round(pr.t / pr.d * 100) + '%' })) : null),
    h('div', { class: 'ct' }, h('div', { class: 't' }, clean(it.n)), h('div', { class: 's' }, it.y || (it.k === 'series' ? 'Série' : 'Film'))));
  c.onclick = () => go(it.k === 'vod' ? 'movie' : 'show', { it });
  c._menu = () => toggleFav(it);
  return c;
}
function cardChan(it, list, idx, kp) {
  const c = F('div', 'card chan', { 'data-k': (kp || '') + 'live:' + it.id },
    h('div', { class: 'im' }, art(it.i, it.n, '')),
    h('div', { class: 'ct' }, h('div', { class: 't' }, clean(it.n)), h('div', { class: 's' }, 'En direct')));
  const s = $('.s', c);
  epg(it.id).then(l => { const [n] = nowOf(l); if (n) s.textContent = n.t; });
  c.onclick = () => play({ kind: 'live', list: list || [it], idx: idx || 0 });
  c._menu = () => toggleFav(it);
  return c;
}
function cardResume(p, key) {
  const pc = p.d ? Math.round(p.t / p.d * 100) : 0;
  const c = F('div', 'card land', { 'data-k': 'r:' + key },
    h('div', { class: 'im' }, art(p.bg || p.i, p.n), p.nx ? h('span', { class: 'badge' }, 'Épisode suivant') : null, pc ? h('div', { class: 'pbar' }, h('i', { style: 'width:' + pc + '%' })) : null),
    h('div', { class: 'ct' }, h('div', { class: 't' }, p.k === 'ep' ? clean(p.show) : clean(p.n)),
      h('div', { class: 's' }, (p.k === 'ep' ? p.n : '') + (p.nx ? '' : (p.k === 'ep' ? ' · ' : '') + 'reste ' + durTxt(p.d - p.t)))));
  c.onclick = () => resume(p);
  /* appui long : retirer de l'historique */
  c._menu = () => ask(p.k === 'ep' ? clean(p.show) : clean(p.n), 'Ce titre ne sera plus proposé dans « Reprendre la lecture ».', [
    { t: 'Retirer de l’historique', pri: true, act: () => { delete S.prog[key]; store.set('prog', S.prog); homeDirty(); toast('Retiré de l’historique'); sync(); } },
    { t: 'Annuler' }]);
  return c;
}
function resume(p) {
  if (p.k === 'vod') play({ kind: 'vod', it: { k: 'vod', id: p.id, n: p.n, i: p.i, x: p.x }, start: p.t });
  else if (p.k === 'ep') go('show', { it: { k: 'series', id: p.sid, n: p.show, i: p.i }, autoplay: p.id });
}
function section(title, row, count) { return h('div', { class: 'sec' }, h('h2', null, title, count ? h('span', { class: 'cnt' }, count) : null), row); }
function rowOf(list, make) { const r = h('div', { class: 'row' }); list.forEach((x, i) => r.append(make(x, i))); return r; }
function skelRow(n, cls) { const r = h('div', { class: 'row' }); for (let i = 0; i < n; i++) r.append(h('div', { class: 'card sk ' + cls }, h('div', { class: 'im', style: 'background:transparent' }), h('div', { class: 'ct' }, h('div', { class: 't' }, ' '), h('div', { class: 's' }, ' ')))); return r; }

function play(p) { go('player', p); }
function ask(title, text, btns) { go('dialog', { title, text, btns }); }
function askPin(title, ok) { go('pin', { title, ok }); }

/* ================= vues ================= */

/* ---- connexion ---- */
V.login = {
  bare: true, render(el, p, e) {
    const acc = S.acc || {};
    const fs = h('input', { class: 'inp f', tabindex: '-1', readonly: true, placeholder: 'http://serveur:port', value: acc.server || '', 'data-k': 'srv', 'data-first': true, autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
    const fu = h('input', { class: 'inp f', tabindex: '-1', readonly: true, placeholder: 'Nom d’utilisateur', value: acc.user || '', 'data-k': 'usr', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
    const fp = h('input', { class: 'inp f', tabindex: '-1', readonly: true, type: 'password', placeholder: 'Mot de passe', value: acc.pass || '', 'data-k': 'pwd' });
    const err = h('div', { class: 'err' });
    const btn = F('div', 'btn pri', { 'data-k': 'go' }, 'Se connecter');
    fs.addEventListener('change', () => {
      /* un lien M3U complet est accepté : on en extrait tout */
      try {
        const u = new URL(fs.value.trim());
        if (u.searchParams.get('username')) { fu.value = u.searchParams.get('username'); fp.value = u.searchParams.get('password') || ''; fs.value = u.origin; }
      } catch (x) { }
    });
    fs._submit = () => { fs.dispatchEvent(new Event('change')); focusEl(fu); };
    fu._submit = () => focusEl(fp);
    fp._submit = () => focusEl(btn);
    let busy = false;
    btn.onclick = async () => {
      if (busy) return;
      fs.dispatchEvent(new Event('change'));
      let srv = fs.value.trim().replace(/\/(player_api\.php|get\.php|c\/?).*$/i, '').replace(/\/+$/, '');
      if (srv && !/^https?:\/\//i.test(srv)) srv = 'http://' + srv;
      if (!srv || !fu.value.trim() || !fp.value) { err.textContent = 'Renseignez les trois champs.'; return; }
      busy = true; err.textContent = ''; btn.textContent = 'Connexion…';
      const prev = S.acc;
      S.acc = { server: srv, user: fu.value.trim(), pass: fp.value };
      try {
        const j = await api({}, { retries: 1, timeout: 20000 });
        const ui = j && j.user_info;
        if (!ui || +ui.auth !== 1) throw new Error('auth');
        if (ui.status && !/active/i.test(ui.status)) throw new Error('status:' + ui.status);
        S.info = ui; S.cache = {}; store.set('acc', S.acc);
        go('home', {}, true);
      } catch (x) {
        S.acc = prev;
        const m = String(x && x.message || '');
        err.textContent = m === 'auth' ? 'Identifiants refusés par le serveur.' : m.startsWith('status:') ? 'Abonnement ' + m.slice(7).toLowerCase() + '.' : 'Serveur injoignable. Vérifiez l’adresse et la connexion.';
      } finally { busy = false; btn.textContent = 'Se connecter'; }
    };
    el.append(h('div', { class: 'login' }, h('div', { class: 'lcard' },
      h('div', { html: LOGO }),
      h('p', { class: 'h' }, 'Connectez votre abonnement Xtream Codes. Vous pouvez aussi coller un lien M3U complet dans le premier champ.'),
      h('div', { class: 'form' },
        h('div', { class: 'fld' }, h('label', null, 'Serveur'), fs),
        h('div', { class: 'fld' }, h('label', null, 'Utilisateur'), fu),
        h('div', { class: 'fld' }, h('label', null, 'Mot de passe'), fp),
        err, btn), h('div', { class: 'sign' }, '© 2026 Rappace · Open source (MIT)'))));
  }
};

/* ---- accueil ---- */
V.home = {
  sec: 'home', render(el, p, e) {
    const sc = h('div', { class: 'scroll', style: 'flex:1' });
    el.append(sc);
    const heroBox = h('div'), rows = h('div', { style: 'padding-bottom:2rem' });
    sc.append(heroBox, rows);
    const progs = Object.entries(S.prog).sort((a, b) => b[1].at - a[1].at);

    function hero(o) {
      const bg = o.bg ? h('img', { class: 'bg', src: o.bg, alt: '', onerror: function () { this.remove(); } }) : null;
      const box = h('div', { class: 'hero' }, bg, h('div', { class: 'in' },
        h('div', { class: 'eyebrow' }, o.eyebrow), h('h2', null, o.title),
        o.meta ? h('div', { class: 'meta' }, o.meta) : null,
        o.plot ? h('div', { class: 'plot' }, o.plot) : null,
        h('div', { class: 'btns' }, o.btns)));
      heroBox.replaceChildren(box);
    }
    function heroFrom(it, pr) {
      const b1 = F('div', 'btn pri', { 'data-k': 'h1', 'data-first': true }, ic('play'), pr ? (pr.nx ? 'Continuer' : 'Reprendre') : 'Regarder');
      const b2 = F('div', 'btn', { 'data-k': 'h2' }, ic('info'), 'Détails');
      b1.onclick = () => pr ? resume(pr) : (it.k === 'vod' ? play({ kind: 'vod', it }) : go('show', { it }));
      b2.onclick = () => go(it.k === 'vod' ? 'movie' : 'show', { it });
      hero({ eyebrow: pr ? 'Reprendre la lecture' : 'À la une', title: clean(pr && pr.k === 'ep' ? pr.show : it.n), bg: it.i, meta: pr ? (pr.nx ? 'Épisode suivant · ' + pr.n : (pr.k === 'ep' ? pr.n + ' · ' : '') + 'reste ' + durTxt(pr.d - pr.t)) : null, btns: [b1, b2] });
      settle(e);
      const getInfo = it.k === 'vod' ? api({ action: 'get_vod_info', vod_id: it.id }, { retries: 0 }).then(d => d && d.info) : api({ action: 'get_series_info', series_id: it.id }, { retries: 0 }).then(d => d && d.info);
      getInfo.then(inf => {
        if (!inf || e.dead) return;
        const bgs = [].concat(inf.backdrop_path || []).filter(Boolean);
        const box = $('.hero', heroBox); if (!box) return;
        if (bgs[0]) { const old = $('.bg', box); const ni = h('img', { class: 'bg', src: bgs[0], alt: '' }); ni.onerror = () => ni.remove(); old ? old.replaceWith(ni) : box.prepend(ni); }
        if (!pr) {
          const m = [inf.releasedate || inf.releaseDate ? String(inf.releasedate || inf.releaseDate).slice(0, 4) : '', durTxt(inf.duration_secs), inf.genre].filter(Boolean);
          const inn = $('.in', box);
          if (m.length && !$('.meta', inn)) $('h2', inn).after(h('div', { class: 'meta' }, inf.rating ? h('span', { class: 'st' }, '★ ' + (+inf.rating).toFixed(1)) : null, m.map(x => h('span', null, x))));
          if (inf.plot && !$('.plot', inn)) $('.btns', inn).before(h('div', { class: 'plot' }, inf.plot));
        }
      }).catch(() => { });
    }
    hero({ eyebrow: 'Bienvenue', title: 'NovaTV', btns: [Object.assign(F('div', 'btn pri', { 'data-k': 'h0', 'data-first': true }, ic('live'), 'TV en direct'), { onclick: () => goTop('live') })] });

    if (progs.length) { const [k, pr] = progs[0]; heroFrom(pr.k === 'vod' ? { k: 'vod', id: pr.id, n: pr.n, i: pr.i, x: pr.x } : { k: 'series', id: pr.sid, n: pr.show, i: pr.i }, Object.assign({}, pr)); }
    if (progs.length) rows.append(section('Reprendre la lecture', rowOf(progs.slice(0, 15), ([k, pr]) => cardResume(pr, k))));
    if (S.recent.length) rows.append(section('Chaînes récentes', rowOf(S.recent, (it, i) => {
      const c = cardChan(it, S.recent, i, 'rc');
      c._menu = () => ask(clean(it.n), null, [
        { t: 'Retirer des chaînes récentes', pri: true, act: () => { S.recent = S.recent.filter(x => x.id !== it.id); store.set('recent', S.recent); homeDirty(); toast('Retirée des chaînes récentes'); sync(); } },
        { t: isFav(it) ? 'Retirer des favoris' : 'Ajouter aux favoris', act: () => { toggleFav(it); homeDirty(); sync(); } },
        { t: 'Annuler' }]);
      return c;
    })));
    if (S.favs.live.length) rows.append(section('Mes chaînes', rowOf(S.favs.live, (it, i) => cardChan(it, S.favs.live, i, 'fv'))));
    if (S.favs.vod.length || S.favs.series.length) rows.append(section('Ma liste', rowOf(S.favs.vod.concat(S.favs.series).slice(0, 30), it => cardPoster(it, 'ml'))));

    function catRows(kind, label, n) {
      const slots = [];
      for (let i = 0; i < n; i++) { const s = section(label, skelRow(8, 'poster')); slots.push(s); rows.append(s); }
      cats(kind).then(async cs => {
        cs = cs.slice(0, n);
        slots.slice(cs.length).forEach(s => s.remove());
        for (let i = 0; i < cs.length; i++) {
          const l = await items(kind, cs[i].id).catch(() => []);
          if (e.dead) return;
          if (!l.length) { slots[i].remove(); continue; }
          if (kind === 'vod' && i === 0 && !progs.length) heroFrom(l[0]);
          slots[i].replaceWith(section(label + ' · ' + clean(cs[i].n), rowOf(l.slice(0, 30), it => cardPoster(it, 'h' + i)), l.length > 30 ? l.length + ' titres' : null));
        }
        settle(e);
      }).catch(() => slots.forEach(s => s.remove()));
    }
    catRows('vod', 'Films', 2);
    catRows('series', 'Séries', 1);
  }
};

/* ---- disposition catégories + contenu (Direct, Films, Séries) ---- */
function splitView(el, e, kind, title, makeList) {
  el.append(header(title, null));
  const cl = h('div', { class: 'cats scroll', 'data-zone': 'cats' }), pane = h('div', { class: 'pane scroll', 'data-zone': 'pane' });
  el.append(h('div', { class: 'split' }, cl, pane));
  cl.append(spinner());
  let sel = null, tok = 0, t;
  const sub = $('.sub', el) || h('div', { class: 'sub' });
  if (!sub.isConnected) $('.hdr .grow', el).append(sub);
  async function pick(cat, name) {
    if (sel === cat.id) return;
    sel = cat.id; e.params.cat = cat.id;
    $$('.cat', cl).forEach(c => { c.classList.toggle('on', c.dataset.id === cat.id); if (c.dataset.id === cat.id) cl._last = c; });
    const my = ++tok;
    pane.replaceChildren(spinner()); pane.scrollTop = 0;
    let l;
    try { l = await items(kind, cat.id); } catch (x) { if (my === tok) pane.replaceChildren(empty('stream', 'Chargement impossible', 'Le serveur ne répond pas. Réessayez dans un instant.')); return; }
    if (my !== tok || e.dead) return;
    sub.textContent = clean(cat.n) + ' · ' + l.length + (kind === 'live' ? ' chaînes' : ' titres');
    if (!l.length) { pane.replaceChildren(cat.id === 'fav' ? empty('heart', 'Aucun favori', 'Ajoutez des favoris depuis le lecteur ou la fiche d’un titre.') : empty('stream', 'Catégorie vide')); return; }
    pane.replaceChildren(makeList(l, cat));
    settle(e);
  }
  cats(kind).then(cs => {
    if (e.dead) return;
    const all = [{ id: 'fav', n: 'Favoris' }].concat(kind === 'live' ? [] : [], cs);
    cl.replaceChildren();
    all.forEach(c => {
      const b = F('div', 'cat', { 'data-k': 'cat:' + c.id, 'data-id': c.id }, h('span', { class: 'n' }, c.id === 'fav' ? '★  Favoris' : clean(c.n)), c.id === 'fav' ? h('span', { class: 'c' }, S.favs[kind].length) : null);
      b.onclick = () => { clearTimeout(t); pick(c); if (document.body.classList.contains('kbd')) { const f = firstIn(pane); f && focusEl(f); } };
      b._focus = () => { clearTimeout(t); t = setTimeout(() => pick(c), 380); };
      b._menu = () => hideCat(kind, c);
      cl.append(b);
    });
    if (cs.length > 1) cl.append(h('div', { class: 'hint' }, ic('hide'), isTV() ? 'Appui long sur OK : masquer une catégorie' : 'Appui long : masquer une catégorie'));
    const start = all.find(c => c.id === e.params.cat) || (S.favs[kind].length ? all[0] : all[1] || all[0]);
    const sb = $$('.cat', cl).find(b => b.dataset.id === start.id); if (sb) sb.setAttribute('data-first', '');
    pick(start);
    settle(e);
  }).catch(() => cl.replaceChildren(empty('stream', 'Hors ligne', 'Impossible de charger les catégories.')));
  e.cleanup = () => clearTimeout(t);
}

function chanRow(it, list, i) {
  const r = F('div', 'ch', { 'data-k': 'c:' + it.id },
    h('div', { class: 'no' }, it.num || i + 1),
    h('div', { class: 'lg' }, art(it.i, it.n, '')),
    h('div', { class: 'bd' }, h('div', { class: 'nm' }, clean(it.n)), h('div', { class: 'ep' }, h('span', { class: 'tt dim' }, '…'))),
    isFav(it) ? ic('heartf', 'fav') : null);
  r.onclick = () => play({ kind: 'live', list, idx: i });
  r._menu = () => { const on = toggleFav(it), f = $('.fav', r); if (on && !f) r.append(ic('heartf', 'fav')); else if (!on && f) f.remove(); };
  /* EPG chargée seulement quand la ligne devient visible */
  r._io = true;
  return r;
}
const epgIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const r = en.target; epgIO.unobserve(r);
  epg(+r.dataset.k.slice(2)).then(l => {
    const [n] = nowOf(l), ep = $('.ep', r); if (!ep) return;
    if (!n) { $('.tt', ep).textContent = 'Programme non communiqué'; return; }
    ep.replaceChildren(h('span', { class: 'tt' }, hm(n.s) + '  ' + n.t), h('div', { class: 'pbar' }, h('i', { style: 'width:' + Math.min(100, Math.round((Date.now() - n.s) / (n.e - n.s) * 100)) + '%' })));
  });
}), { rootMargin: '200px' }) : null;

V.live = {
  sec: 'live', render(el, p, e) {
    splitView(el, e, 'live', 'TV en direct', (l) => {
      const box = h('div', { class: 'list' });
      lazy(box, l, (it, i) => { const r = chanRow(it, l, i); epgIO && setTimeout(() => epgIO.observe(r)); return r; }, 40);
      return box;
    });
  }
};
V.movies = { sec: 'movies', render(el, p, e) { splitView(el, e, 'vod', 'Films', l => { const g = h('div', { class: 'grid' }); lazy(g, l, it => cardPoster(it), 42); return g; }); } };
V.series = { sec: 'series', render(el, p, e) { splitView(el, e, 'series', 'Séries', l => { const g = h('div', { class: 'grid' }); lazy(g, l, it => cardPoster(it), 42); return g; }); } };

/* ---- guide TV ---- */
V.guide = {
  sec: 'guide', render(el, p, e) {
    el.append(header('Guide TV', null));
    const chips = h('div', { class: 'chips', 'data-zone': 'chips' });
    const body = h('div', { class: 'guide' });
    el.append(chips, body);
    body.append(spinner());
    let tok = 0, sel = null;
    const MIN = 0.26; /* rem par minute */
    async function pick(c) {
      if (sel === c.id) return;
      sel = c.id; e.params.cat = c.id;
      $$('.chip', chips).forEach(x => { x.classList.toggle('on', x.dataset.id === c.id); if (x.dataset.id === c.id) chips._last = x; });
      const my = ++tok;
      body.replaceChildren(spinner());
      let l;
      try { l = await items('live', c.id); } catch (x) { body.replaceChildren(empty('stream', 'Chargement impossible')); return; }
      if (my !== tok || e.dead) return;
      if (!l.length) { body.replaceChildren(empty(c.id === 'fav' ? 'heart' : 'guide', c.id === 'fav' ? 'Aucune chaîne favorite' : 'Catégorie vide', c.id === 'fav' ? 'Choisissez une catégorie ci-dessus.' : null)); return; }
      build(l);
      settle(e);
    }
    function build(list) {
      const rp = remPx();
      const now = Date.now();
      const ws = Math.floor(now / 1800e3) * 1800e3 - 1800e3, we = ws + 8 * 3600e3;
      const W = (we - ws) / 60e3 * MIN;
      const x = t => (Math.max(ws, Math.min(we, t)) - ws) / 60e3 * MIN;
      const times = h('div', { class: 'gtimes', style: `width:${W}rem` });
      for (let t = ws; t < we; t += 1800e3) times.append(h('span', { style: `left:${x(t)}rem` }, hm(t)));
      const d = new Date(now);
      const gin = h('div', { class: 'gin', style: `width:calc(13rem + ${W}rem)` },
        h('div', { class: 'ghead' }, h('div', { class: 'gcorner' }, d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })), times));
      const nowLine = h('div', { class: 'gnow' });
      const rows = h('div', { style: 'position:relative' });
      gin.append(rows);
      const gs = h('div', { class: 'gscroll' }, gin);
      gs.dataset.ml = String(13 * rp * (innerWidth < 900 ? 8.5 / 13 : 1));
      gs.dataset.mt = String(2.6 * rp);
      const info = h('div', { class: 'ginfo' }, h('div', null, h('div', { class: 't' }, ''), h('div', { class: 's' }), h('div', { class: 'd' })));
      body.replaceChildren(gs, info);
      const showInfo = (it, pg) => {
        const [t, s, dd] = info.firstChild.children;
        t.textContent = pg ? pg.t : clean(it.n);
        s.textContent = clean(it.n) + (pg ? '  ·  ' + hm(pg.s) + ' – ' + hm(pg.e) + '  ·  ' + durTxt((pg.e - pg.s) / 1000) : '');
        dd.textContent = pg && pg.d || '';
      };
      function block(it, i, pg, left, width, cls) {
        const b = F('div', 'gp ' + (cls || ''), { 'data-k': 'g:' + it.id + ':' + (pg ? pg.s : 0), style: `left:${left}rem;width:${Math.max(width, 1.2)}rem` },
          h('div', { class: 't' }, pg ? pg.t : (cls === 'empty' ? 'Programme non communiqué' : 'Chargement…')),
          pg ? h('div', { class: 's' }, hm(pg.s) + ' – ' + hm(pg.e)) : null);
        b._menu = () => toggleFav(it);
        b._focus = () => { showInfo(it, pg); $$('.gch.cur', rows).forEach(c => c.classList.remove('cur')); b.parentElement.previousSibling.classList.add('cur'); };
        b.onclick = () => {
          if (!pg || (pg.s <= Date.now() && pg.e > Date.now()) || pg.e <= Date.now()) play({ kind: 'live', list, idx: i });
          else ask(pg.t, hm(pg.s) + ' – ' + hm(pg.e) + ' sur ' + clean(it.n) + (pg.d ? '\n\n' + pg.d : ''), [{ t: 'Regarder la chaîne', pri: true, act: () => play({ kind: 'live', list, idx: i }) }, { t: 'Fermer' }]);
        };
        return b;
      }
      function row(it, i) {
        const track = h('div', { class: 'gtrack', style: `width:${W}rem` });
        const r = h('div', { class: 'grw', 'data-sid': it.id },
          h('div', { class: 'gch' }, h('div', { class: 'lg' }, art(it.i, it.n, '')), h('div', { class: 'nm' }, clean(it.n))), track);
        track.append(block(it, i, null, x(now) - 3, 3 + 60 * MIN * 2));
        r._fill = () => epg(it.id).then(l => {
          if (e.dead) return;
          const had = track.contains(document.activeElement);
          track.replaceChildren();
          const vis = l.filter(pg => pg.e > ws && pg.s < we);
          if (!vis.length) track.append(block(it, i, null, 0, W, 'empty'));
          let lastEnd = ws;
          vis.forEach(pg => {
            if (pg.s - lastEnd > 5 * 60e3) track.append(block(it, i, null, x(lastEnd), x(pg.s) - x(lastEnd), 'empty'));
            const cls = pg.e <= now ? 'past' : pg.s <= now ? 'now' : '';
            track.append(block(it, i, pg, x(pg.s), x(pg.e) - x(pg.s), cls));
            lastEnd = pg.e;
          });
          if (had) { const n = $('.gp.now', track) || $('.gp', track); focusEl(n); }
          else if (e.fk && e.fk.startsWith('g:' + it.id + ':')) settle(e);
        });
        gio.observe(r);
        return r;
      }
      const gio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { gio.unobserve(en.target); en.target._fill(); } }), { root: gs, rootMargin: '300px 0px' });
      lazy(rows, list, row, 30);
      rows.append(nowLine);
      nowLine.style.left = `calc(13rem + ${x(now)}rem)`;
      if (innerWidth < 900 || innerHeight > innerWidth) nowLine.style.left = `calc(8.5rem + ${x(now)}rem)`;
      gs.scrollLeft = 0;
      e.cleanup = () => gio.disconnect();
      const first = $('.gp', rows); if (first) first.setAttribute('data-first', '');
    }
    cats('live').then(cs => {
      if (e.dead) return;
      const all = [{ id: 'fav', n: '★ Favoris' }].concat(cs);
      all.forEach(c => { const b = F('div', 'chip', { 'data-k': 'gc:' + c.id, 'data-id': c.id }, clean(c.n)); b.onclick = () => pick(c); b._menu = () => hideCat('live', c); chips.append(b); });
      pick(all.find(c => c.id === e.params.cat) || (S.favs.live.length ? all[0] : all[1] || all[0]));
    }).catch(() => body.replaceChildren(empty('stream', 'Hors ligne', 'Impossible de charger les catégories.')));
  }
};

/* ---- fiche film ---- */
V.movie = {
  sec: 'movies', render(el, p, e) {
    const it = p.it;
    const pr = S.prog['vod:' + it.id];
    const bg = h('img', { class: 'bg', src: it.i || '', alt: '' }); bg.onerror = () => bg.remove();
    const metaBox = h('div', { class: 'meta' }, it.y ? h('span', null, it.y) : null, it.r ? h('span', { class: 'st' }, '★ ' + (+it.r).toFixed(1)) : null);
    const plot = h('div', { class: 'plot' }), cast = h('div', { class: 'cast' });
    const bPlay = F('div', 'btn pri', { 'data-k': 'play', 'data-first': true }, ic('play'), pr ? 'Reprendre · ' + dur(pr.t) : 'Lecture');
    bPlay.onclick = () => play({ kind: 'vod', it, start: pr ? pr.t : 0 });
    const bRe = pr ? F('div', 'btn', { 'data-k': 'restart' }, ic('restart'), 'Depuis le début') : null;
    if (bRe) bRe.onclick = () => play({ kind: 'vod', it, start: 0 });
    const bFav = F('div', 'btn icon' + (isFav(it) ? ' on' : ''), { 'data-k': 'fav' }, ic(isFav(it) ? 'heartf' : 'heart'));
    bFav.onclick = () => { const on = toggleFav(it); bFav.classList.toggle('on', on); bFav.replaceChildren(ic(on ? 'heartf' : 'heart')); };
    let yt = null;
    const bTr = F('div', 'btn hide', { 'data-k': 'tr' }, ic('trailer'), 'Bande-annonce');
    bTr.onclick = () => yt && go('trailer', { id: yt, title: clean(it.n) });
    const bVer = verButton(it, e);
    /* « Vu » est posé automatiquement quand le film est fini : simple indication */
    const bSeen = S.seen['vod:' + it.id] ? h('span', { class: 'vutag' }, ic('check'), 'Vu') : null;
    el.append(h('div', { class: 'det' }, bg, h('div', { class: 'shade' }), h('div', { class: 'body scroll' },
      h('div', { class: 'top' }, h('div', { class: 'pst' }, h('div', { class: 'im' }, art(it.i, it.n))),
        h('div', { class: 'info' }, h('div', { class: 'eyebrow' }, 'Film'), h('h1', null, clean(it.n)), metaBox, plot, cast, h('div', { class: 'btns' }, bPlay, bRe, bVer, bTr, bSeen, bFav))))));
    cached('vi:' + it.id, () => api({ action: 'get_vod_info', vod_id: it.id })).then(d => {
      if (e.dead || !d) return;
      const inf = d.info || {}, md = d.movie_data || {};
      if (md.container_extension) it.x = md.container_extension;
      const b = [].concat(inf.backdrop_path || []).filter(Boolean)[0];
      if (b) bg.src = b;
      const y = String(inf.releasedate || inf.release_date || '').slice(0, 4);
      metaBox.replaceChildren(...[y || it.y, durTxt(inf.duration_secs) || inf.duration, inf.genre].filter(Boolean).map(x => h('span', null, x)));
      if (+inf.rating || it.r) metaBox.prepend(h('span', { class: 'st' }, '★ ' + (+inf.rating || it.r).toFixed(1)));
      plot.textContent = inf.plot || inf.description || '';
      yt = ytId(inf.youtube_trailer || inf.trailer); bTr.classList.toggle('hide', !yt);
      cast.replaceChildren(...[inf.director ? [h('b', null, 'Réalisation  '), inf.director, '   '] : [], inf.cast || inf.actors ? [h('b', null, 'Avec  '), inf.cast || inf.actors] : []].flat());
    }).catch(() => { });
  }
};

/* bouton « Langues » : visible seulement si d'autres versions du titre existent */
function verButton(it, e) {
  const b = F('div', 'btn hide', { 'data-k': 'ver' }, ic('globe'), 'Langues');
  let vs = [];
  b.onclick = () => go('versions', { it, vs });
  versionsOf(it).then(l => { if (e.dead) return; vs = l; if (l.length) { b.classList.remove('hide'); b.lastChild.textContent = 'Langues (' + (l.length + 1) + ')'; } }).catch(() => { });
  return b;
}
V.versions = {
  overlay: true, cls: 'dlg', render(el, p, e) {
    const box = h('div', { class: 'dbox tracks' }, h('h3', null, 'Choisir la langue'), h('p', null, 'Ce titre existe en plusieurs versions chez votre fournisseur.'));
    const cur = F('div', 'si', { 'data-k': 'v0', 'data-first': true }, h('div', { class: 'k' }, p.vs.mine || 'Version actuelle', h('small', null, (p.vs.mine ? 'Version actuelle · ' : '') + clean(p.it.n))), ic('check'));
    cur.onclick = () => back();
    box.append(cur);
    p.vs.forEach((x, i) => {
      const r = F('div', 'si', { 'data-k': 'v' + (i + 1) }, h('div', { class: 'k' }, x.lab, h('small', null, clean(x.n))));
      r.onclick = () => closeThen(() => openVersion(x, p.from));
      box.append(r);
    });
    const bc = F('div', 'btn', { 'data-k': 'x' }, 'Fermer'); bc.onclick = () => back();
    box.append(h('div', { class: 'btns', style: 'margin-top:1.2rem;justify-content:flex-end' }, bc));
    el.append(box);
    el.onclick = ev => { if (ev.target === el) back(); };
  }
};

/* ---- fiche série ---- */
V.show = {
  sec: 'series', render(el, p, e) {
    const it = p.it;
    const bg = h('img', { class: 'bg', src: it.i || '', alt: '' }); bg.onerror = () => bg.remove();
    const metaBox = h('div', { class: 'meta' }), plot = h('div', { class: 'plot' }), btns = h('div', { class: 'btns' });
    const seas = h('div', { class: 'chips', 'data-zone': 'seasons', style: 'padding-top:0' }), eps = h('div', { class: 'eps' });
    const bFav = F('div', 'btn icon' + (isFav(it) ? ' on' : ''), { 'data-k': 'fav' }, ic(isFav(it) ? 'heartf' : 'heart'));
    bFav.onclick = () => { const on = toggleFav(it); bFav.classList.toggle('on', on); bFav.replaceChildren(ic(on ? 'heartf' : 'heart')); };
    let yt = null;
    const bTr = F('div', 'btn hide', { 'data-k': 'tr' }, ic('trailer'), 'Bande-annonce');
    bTr.onclick = () => yt && go('trailer', { id: yt, title: clean(it.n) });
    btns.append(F('div', 'btn pri', { 'data-k': 'play', 'data-first': true }, ic('play'), 'Chargement…'), verButton(it, e), bTr, bFav);
    el.append(h('div', { class: 'det' }, bg, h('div', { class: 'shade' }), h('div', { class: 'body scroll' },
      h('div', { class: 'top' }, h('div', { class: 'pst' }, h('div', { class: 'im' }, art(it.i, it.n))),
        h('div', { class: 'info' }, h('div', { class: 'eyebrow' }, 'Série'), h('h1', null, clean(it.n)), metaBox, plot, btns)),
      seas, eps)));
    cached('si:' + it.id, () => api({ action: 'get_series_info', series_id: it.id })).then(d => {
      if (e.dead) return;
      const inf = d && d.info || {};
      const b = [].concat(inf.backdrop_path || []).filter(Boolean)[0]; if (b) bg.src = b;
      metaBox.replaceChildren(...[String(inf.releaseDate || inf.release_date || it.y || '').slice(0, 4), inf.genre].filter(Boolean).map(x => h('span', null, x)));
      if (+inf.rating) metaBox.prepend(h('span', { class: 'st' }, '★ ' + (+inf.rating).toFixed(1)));
      plot.textContent = inf.plot || '';
      yt = ytId(inf.youtube_trailer || inf.trailer); bTr.classList.toggle('hide', !yt);
      const raw = d && d.episodes || {};
      const sNums = Object.keys(raw).sort((a, b) => a - b);
      const flat = [];
      sNums.forEach(s => arr(raw[s]).sort((a, b) => (+a.episode_num) - (+b.episode_num)).forEach(x => {
        const ii = x.info || {};
        flat.push({ id: +x.id, s: +s, e: +x.episode_num || 0, t: x.title || ('Épisode ' + x.episode_num), x: x.container_extension || 'mp4', img: ii.movie_image || ii.cover_big || '', plot: ii.plot || '', d: +ii.duration_secs || 0 });
      }));
      const show = { id: it.id, n: it.n, i: it.i };
      const playEp = (idx, start) => play({ kind: 'ep', eps: flat, idx, show, start: start || 0 });
      if (!flat.length) { btns.firstChild.replaceChildren(ic('info'), 'Aucun épisode'); eps.append(empty('series', 'Aucun épisode disponible')); return; }
      /* reprise : épisode en cours, sinon celui qui suit le dernier épisode vu */
      const lab = x => 'S' + x.s + ' · É' + x.e;
      const bp = btns.firstChild;
      let last = null;
      function target() {
        let tg = null;
        flat.forEach((x, i) => { const pr = S.prog['ep:' + x.id]; if (pr && (!tg || pr.at > tg.at)) tg = { i, t: pr.t || 0, at: pr.at, nx: !!pr.nx }; });
        if (!tg) {
          let li = -1, lt = 0;
          flat.forEach((x, i) => { const ts = S.seen['ep:' + x.id]; if (ts && ts > lt) { lt = ts; li = i; } });
          if (li >= 0 && li < flat.length - 1) tg = { i: li + 1, t: 0, nx: true };
        }
        return tg;
      }
      function drawBtn() {
        last = target();
        const nSeen = flat.filter(x => S.seen['ep:' + x.id]).length;
        bp.replaceChildren(ic('play'), last ? (last.nx ? 'Continuer ' : 'Reprendre ') + lab(flat[last.i]) : (nSeen === flat.length ? 'Revoir ' : 'Lecture ') + lab(flat[0]));
      }
      drawBtn();
      bp.onclick = () => last ? playEp(last.i, last.t) : playEp(0);
      let cur = null;
      const showSeason = (s, force) => {
        if (cur === s && !force) return; cur = s;
        $$('.chip', seas).forEach(c => { c.classList.toggle('on', +c.dataset.id === s); if (+c.dataset.id === s) seas._last = c; });
        eps.replaceChildren();
        flat.forEach((x, i) => {
          if (x.s !== s) return;
          const ek = 'ep:' + x.id, pr = S.prog[ek], vu = !!S.seen[ek];
          const pc = pr && pr.d ? Math.round(pr.t / pr.d * 100) : 0;
          const r = F('div', 'epi' + (vu ? ' seen' : ''), { 'data-k': ek },
            h('div', { class: 'im' }, art(x.img || it.i, x.t), vu ? h('span', { class: 'badge seen' }, '✓ Vu') : null, pc ? h('div', { class: 'pbar' }, h('i', { style: 'width:' + pc + '%' })) : null),
            h('div', { class: 'bd' }, h('div', { class: 't' }, h('span', { class: 'k' }, 'É' + x.e), clean(x.t)), x.plot ? h('div', { class: 's' }, x.plot) : null,
              h('div', { class: 'du' }, [x.d ? durTxt(x.d) : '', vu ? 'Vu' : pc ? 'En cours · reste ' + durTxt(pr.d - pr.t) : ''].filter(Boolean).join('  ·  '))));
          r.onclick = () => playEp(i, pr ? pr.t : 0);
          eps.append(r);
        });
      };
      [...new Set(flat.map(x => x.s))].forEach(s => {
        const c = F('div', 'chip', { 'data-k': 'se:' + s, 'data-id': s }, 'Saison ' + s);
        c.onclick = () => showSeason(s); c._focus = () => showSeason(s);
        seas.append(c);
      });
      /* saison affichée : celle de l'épisode qu'on vient de regarder, sinon celle de la reprise */
      const fkEp = e.fk && e.fk.startsWith('ep:') ? flat.find(x => 'ep:' + x.id === e.fk) : null;
      showSeason(fkEp ? fkEp.s : last ? flat[last.i].s : flat[0].s);
      settle(e);
      if (p.autoSE) { const se = p.autoSE; p.autoSE = null; const i = flat.findIndex(x => x.s === se.s && x.e === se.e); if (i >= 0) playEp(i, se.t || 0); else toast('Épisode S' + se.s + 'É' + se.e + ' absent de cette version'); }
      if (p.autoplay) { const i = flat.findIndex(x => x.id === p.autoplay); p.autoplay = 0; if (i >= 0) { const pr = S.prog['ep:' + flat[i].id]; playEp(i, pr ? pr.t : 0); } }
    }).catch(() => { btns.firstChild.replaceChildren(ic('info'), 'Indisponible'); eps.append(empty('stream', 'Chargement impossible', 'Le serveur ne répond pas.')); });
  }
};

/* ---- favoris ---- */
V.favs = {
  sec: 'favs', render(el, p, e) {
    el.append(header('Favoris', null));
    const sc = h('div', { class: 'scroll', style: 'flex:1;padding-top:.4rem' }); el.append(sc);
    const fl = S.favs.live, fv = S.favs.vod, fs = S.favs.series;
    if (!fl.length && !fv.length && !fs.length) { sc.append(empty('heart', 'Aucun favori pour l’instant', 'Appuyez sur ♥ dans le lecteur ou sur la fiche d’un film pour le retrouver ici.')); return; }
    if (fl.length) sc.append(section('Chaînes', rowOf(fl, (it, i) => cardChan(it, fl, i)), fl.length));
    if (fv.length) sc.append(section('Films', rowOf(fv, it => cardPoster(it)), fv.length));
    if (fs.length) sc.append(section('Séries', rowOf(fs, it => cardPoster(it)), fs.length));
  }
};

/* ---- recherche ---- */
V.search = {
  sec: 'search', render(el, p, e) {
    el.append(header('Recherche', 'Chaînes, films et séries'));
    const inp = h('input', { class: 'inp f', tabindex: '-1', readonly: true, placeholder: 'Titre, chaîne…', 'data-k': 'q', 'data-first': true, autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false', value: p.q || '' });
    const res = h('div', { class: 'scroll', style: 'flex:1' });
    el.append(h('div', { style: 'padding:0 var(--gut) 1rem;flex:none' }, inp), res);
    let t, tok = 0;
    const norm = s => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    async function run() {
      const q = norm(inp.value.trim()); p.q = inp.value;
      const my = ++tok;
      if (q.length < 2) { res.replaceChildren(empty('search', 'Que voulez-vous regarder ?', 'Tapez au moins deux lettres.')); return; }
      res.replaceChildren(h('div', { class: 'center', style: 'flex-direction:column;gap:1rem' }, h('div', { class: 'spin' }), h('div', { class: 'dim' }, 'Recherche dans le catalogue…')));
      const [l, v, s] = await Promise.all(['live', 'vod', 'series'].map(k => all(k).catch(() => [])));
      if (my !== tok || e.dead) return;
      const f = list => list.filter(x => norm(x.n).includes(q)).slice(0, 40);
      const rl = f(l), rv = f(v), rs = f(s);
      res.replaceChildren();
      if (!rl.length && !rv.length && !rs.length) { res.append(empty('search', 'Aucun résultat', 'Essayez un autre mot.')); return; }
      if (rl.length) res.append(section('Chaînes', rowOf(rl, (it, i) => cardChan(it, rl, i, 's')), rl.length));
      if (rv.length) res.append(section('Films', rowOf(rv, it => cardPoster(it, 's')), rv.length));
      if (rs.length) res.append(section('Séries', rowOf(rs, it => cardPoster(it, 's')), rs.length));
    }
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 450); });
    inp._submit = () => { clearTimeout(t); run().then(() => { const f = firstIn(res); if (f) focusEl(f); }); };
    run();
    e.cleanup = () => clearTimeout(t);
  }
};

/* ---- réglages ---- */
V.settings = {
  sec: 'settings', render(el, p, e) {
    el.append(header('Réglages', null));
    const box = h('div', { class: 'set' }); el.append(h('div', { class: 'scroll', style: 'flex:1' }, box));
    const item = (icn, k, small, v, act, key) => {
      const kids = [ic(icn), h('div', { class: 'k' }, k, small ? h('small', null, small) : null), v == null ? null : (v.nodeType ? v : h('div', { class: 'v' }, v))];
      const r = act ? F('div', 'si', { 'data-k': key || k }, kids) : h('div', { class: 'si ro' }, kids);
      if (act) r.onclick = act;
      return r;
    };
    const tg = on => h('div', { class: 'tg' + (on ? ' on' : '') });
    function draw() {
      const ui = S.info || {};
      const exp = ui.exp_date ? new Date(ui.exp_date * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Illimité';
      const fk = document.activeElement && document.activeElement.dataset.k;
      box.replaceChildren(
        h('h3', null, 'Compte'),
        item('server', 'Serveur', null, S.acc.server.replace(/^https?:\/\//, '')),
        item('user', 'Utilisateur', null, S.acc.user),
        item('clock', 'Expiration', ui.status ? 'Statut : ' + ui.status : null, exp),
        ui.max_connections ? item('tv', 'Connexions simultanées', null, (ui.active_cons || 0) + ' / ' + ui.max_connections) : null,
        h('h3', null, 'Langue et sous-titres'),
        item('globe', 'Langue préférée', 'Choisie automatiquement pour l’audio et les sous-titres', LANGS[S.set.lang].n, () => {
          const ks = Object.keys(LANGS); S.set.lang = ks[(ks.indexOf(S.set.lang) + 1) % ks.length]; saveSet(); S.ver++; draw();
        }, 'lang'),
        item('cc', 'Sous-titres par défaut', 'Modifiables pendant la lecture avec le bouton CC',  { off: 'Désactivés', auto: 'Si l’audio n’est pas en ' + LANGS[S.set.lang].n.toLowerCase(), on: 'Toujours' }[S.set.subs], () => {
          S.set.subs = { off: 'auto', auto: 'on', on: 'off' }[S.set.subs]; saveSet(); draw();
        }, 'subs'),
        item('layers', 'Catégories en ' + LANGS[S.set.lang].n.toLowerCase() + ' en premier', null, tg(S.set.langFirst), () => { S.set.langFirst = !S.set.langFirst; saveSet(); S.ver++; draw(); }, 'lfirst'),
        item('hide', 'Catégories masquées', 'Choisir ce qui s’affiche (direct, films, séries)', (S.hidden.live.length + S.hidden.vod.length + S.hidden.series.length) + ' masquée(s)  ›', () => go('catman'), 'catman'),
        h('h3', null, 'Lecture'),
        item('play', 'Moteur vidéo', window.NV ? 'Choix de la langue audio et des sous-titres disponible' : 'VLC n’a pas pu démarrer : langue audio non modifiable', window.NV ? 'VLC intégré' : 'Lecteur simple'),
        item('stream', 'Format des chaînes en direct', 'MPEG-TS conseillé : plus stable et plus rapide au zapping', S.set.liveFmt === 'm3u8' ? 'HLS (m3u8)' : 'MPEG-TS', () => { S.set.liveFmt = S.set.liveFmt === 'm3u8' ? 'ts' : 'm3u8'; saveSet(); draw(); }, 'fmt'),
        item('skip', 'Épisode suivant automatique', null, tg(S.set.autoNext), () => { S.set.autoNext = !S.set.autoNext; saveSet(); draw(); }, 'auto'),
        h('h3', null, 'Contrôle parental'),
        item('eye', 'Afficher les catégories adultes', S.set.pin ? 'Protégé par code PIN' : 'Définissez un code PIN pour protéger ce réglage', tg(S.set.adult), () => {
          const flip = () => { S.set.adult = !S.set.adult; saveSet(); S.cache = {}; S.ver++; draw(); };
          if (S.set.pin) askPin('Code PIN', v => { if (v !== S.set.pin) return false; closeThen(flip); return true; }); else flip();
        }, 'adult'),
        item('lock', S.set.pin ? 'Modifier le code PIN' : 'Définir un code PIN', null, S.set.pin ? '••••' : 'Aucun', () => {
          const setNew = () => askPin('Nouveau code PIN', v => { S.set.pin = v; saveSet(); closeThen(() => { draw(); toast('Code PIN enregistré'); }); return true; });
          if (S.set.pin) askPin('Code PIN actuel', v => { if (v !== S.set.pin) return false; closeThen(setNew); return true; }); else setNew();
        }, 'pin'),
        h('h3', null, 'Données'),
        item('refresh', 'Actualiser le catalogue', 'Recharge chaînes, films et séries depuis le serveur', null, () => { S.cache = {}; EPG.m.clear(); toast('Catalogue actualisé'); }, 'ref'),
        item('clock', 'Effacer « Reprendre la lecture »', Object.keys(S.prog).length + ' titre(s) en cours', null, () => ask('Effacer « Reprendre la lecture » ?', 'Les points de reprise des films et séries seront supprimés.', [{ t: 'Effacer', pri: true, act: () => { S.prog = {}; store.set('prog', {}); homeDirty(); toast('Reprises effacées'); draw(); } }, { t: 'Annuler' }]), 'clrp'),
        item('live', 'Effacer les chaînes récentes', S.recent.length + ' chaîne(s)', null, () => ask('Effacer les chaînes récentes ?', null, [{ t: 'Effacer', pri: true, act: () => { S.recent = []; store.set('recent', []); homeDirty(); toast('Chaînes récentes effacées'); draw(); } }, { t: 'Annuler' }]), 'clrr'),
        item('check', 'Effacer les films et épisodes vus', Object.keys(S.seen).length + ' marqué(s) « Vu »', null, () => ask('Effacer les marques « Vu » ?', 'Les films et épisodes ne seront plus marqués comme vus.', [{ t: 'Effacer', pri: true, act: () => { S.seen = {}; store.set('seen', {}); homeDirty(); toast('Marques « Vu » effacées'); draw(); } }, { t: 'Annuler' }]), 'clrs'),
        item('trash', 'Tout effacer', 'Reprises, chaînes récentes et marques « Vu »', null, () => ask('Effacer tout l’historique ?', 'Reprises, chaînes récentes et marques « Vu » seront supprimées. Les favoris sont conservés.', [{ t: 'Tout effacer', pri: true, act: () => { S.prog = {}; S.recent = []; S.seen = {}; store.set('prog', {}); store.set('recent', []); store.set('seen', {}); homeDirty(); toast('Historique effacé'); draw(); } }, { t: 'Annuler' }]), 'clr'),
        item('out', 'Se déconnecter', null, null, () => ask('Se déconnecter ?', 'Vos favoris et réglages sont conservés sur cet appareil.', [{ t: 'Se déconnecter', pri: true, act: () => { S.acc = null; store.set('acc', null); S.cache = {}; S.info = null; resetTo('login'); } }, { t: 'Annuler' }]), 'out'),
        h('h3', null, 'À propos'),
        item('info', 'NovaTV 2.0.1', '© 2026 Rappace · Logiciel libre (licence MIT)', 'github.com/RappaceFer/NovaTV'));
      if (fk) { const f = $$('[data-k]', box).find(x => x.dataset.k === fk); if (f) focusEl(f); }
    }
    draw();
    e.onShow = draw;
    if (!S.info) api({}, { retries: 1 }).then(j => { if (j && j.user_info) { S.info = j.user_info; if (!e.dead) draw(); } }).catch(() => { });
  }
};

/* ---- boîtes de dialogue ---- */
V.dialog = {
  overlay: true, cls: 'dlg', render(el, p, e) {
    const bs = (p.btns || [{ t: 'OK' }]).map((b, i) => {
      const x = F('div', 'btn' + (b.pri ? ' pri' : ''), { 'data-k': 'b' + i, 'data-first': i === 0 || null }, b.t);
      x.onclick = () => closeThen(b.act || null);
      return x;
    });
    el.append(h('div', { class: 'dbox' }, h('h3', null, p.title), p.text ? h('p', { style: 'white-space:pre-line' }, p.text) : null, h('div', { class: 'btns' }, bs)));
    el.onclick = ev => { if (ev.target === el) back(); };
  }
};
V.tracks = {
  overlay: true, cls: 'dlg', render(el, p, e) {
    const E = p.E;
    let T = { audio: [], spu: [] };
    try { T = E.tracks(); } catch (x) { }
    const audio = T.audio.filter(t => t.id !== -1);
    const spu = T.spu.filter(t => t.id !== -1);
    const spuOff = !spu.some(t => t.on);
    const box = h('div', { class: 'dbox tracks' }, h('h3', null, 'Langue et sous-titres'));
    const row = (t, kind) => {
      const [a, b] = t.id === -1 ? ['Désactivés', ''] : trackLabel(t);
      const r = F('div', 'si', { 'data-k': kind + t.id, 'data-first': (t.on && kind === 'a') || null }, h('div', { class: 'k' }, a, b ? h('small', null, b) : null), t.on ? ic('check') : null);
      r.onclick = () => {
        if (kind === 'a') E.setAudio(t.id); else E.setSpu(t.id);
        toast(kind === 'a' ? 'Langue : ' + a : t.id === -1 ? 'Sous-titres désactivés' : 'Sous-titres : ' + a);
        back();
      };
      return r;
    };
    box.append(h('h4', null, 'Langue audio'));
    if (audio.length) audio.forEach(t => box.append(row(t, 'a')));
    if (audio.length < 2) box.append(h('p', { class: 'note' }, E.kind === 'vlc'
      ? 'Ce fichier ne contient qu’une seule langue audio.'
      : 'Le moteur VLC n’a pas pu démarrer sur cet appareil : le choix de la langue audio n’est pas disponible.'));
    /* autres fichiers du même titre (VF, VOSTFR, MULTI…) */
    const vbox = h('div');
    box.append(vbox);
    if (p.it) versionsOf(p.it).then(vs => {
      if (e.dead || !vs.length) return;
      vbox.append(h('h4', null, 'Autres versions de ce titre'));
      vs.forEach((x, i) => {
        const r = F('div', 'si', { 'data-k': 'ov' + i }, h('div', { class: 'k' }, x.lab, h('small', null, clean(x.n))), ic('globe'));
        r.onclick = () => closeThen(() => openVersion(x, p.from()));
        vbox.append(r);
      });
    }).catch(() => { });
    box.append(h('h4', null, 'Sous-titres'));
    box.append(row({ id: -1, on: spuOff }, 's'));
    spu.forEach(t => box.append(row(t, 's')));
    const bc = F('div', 'btn', { 'data-k': 'x' }, 'Fermer'); bc.onclick = () => back();
    box.append(h('div', { class: 'btns', style: 'margin-top:1.2rem;justify-content:space-between;align-items:center' },
      h('span', { class: 'dim', style: 'font-size:.78rem' }, E.kind === 'vlc' ? 'Moteur : VLC intégré' : 'Moteur : lecteur simple'), bc));
    el.append(box);
    el.onclick = ev => { if (ev.target === el) back(); };
  }
};

/* ---- bande-annonce : lue dans l'app (YouTube sans cookies, serveurs publicitaires bloqués par la coque) ---- */
V.trailer = {
  overlay: true, cls: 'trailer', render(el, p, e) {
    const q = 'trailer.html?v=' + encodeURIComponent(p.id) + '&hl=' + S.set.lang;
    const f = h('iframe', { src: (location.protocol === 'file:' ? ASSET : '') + q, allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture', referrerpolicy: 'strict-origin-when-cross-origin' });
    const bar = h('div', { class: 'tr-top' }, h('div', { class: 't' }, p.title), h('div', { class: 's' }, 'Bande-annonce  ·  OK : pause  ·  Retour : fermer'));
    const err = h('div', { class: 'pmsg hide' });
    el.append(f, bar, err);
    let t = setTimeout(() => bar.classList.add('off'), 4500);
    const show = () => { bar.classList.remove('off'); clearTimeout(t); t = setTimeout(() => bar.classList.add('off'), 3000); };
    function fail(code) {
      f.src = 'about:blank';
      const why = code === 100 ? 'Cette vidéo a été supprimée de YouTube.'
        : code === 'age' || code === 101 || code === 150 ? 'YouTube réserve cette bande-annonce aux comptes dont l’âge est vérifié, ou interdit sa lecture en dehors de son site.'
        : 'YouTube ne permet pas de lire cette vidéo ici.';
      const b = F('div', 'btn pri', { 'data-k': 'ok' }, 'Retour'); b.onclick = () => back();
      err.className = 'pmsg err';
      err.replaceChildren(h('b', null, 'Bande-annonce indisponible'), h('div', { class: 'm' }, why), h('div', { class: 'btns' }, b));
      focusEl(b);
    }
    const onMsg = ev => {
      const d = ev.data;
      if (!d || d.nv !== 'trailer' || ev.source !== f.contentWindow) return;
      if (d.ev === 'error') fail(d.code);
    };
    addEventListener('message', onMsg);
    el.tabIndex = -1; setTimeout(() => el.focus({ preventScroll: true }), 50);
    e.onKey = ev => {
      if (err.className === 'pmsg err') return false;
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'MediaPlayPause' || ev.key === 'Select') { try { f.contentWindow.postMessage('toggle', '*'); } catch (x) { } show(); }
      else show();
      return true;
    };
    e.cleanup = () => { clearTimeout(t); removeEventListener('message', onMsg); f.src = 'about:blank'; };
  }
};

/* ---- gestion des catégories ---- */
V.catman = {
  sec: 'settings', keep: true, render(el, p, e) {
    el.append(header('Catégories', 'Masquez ce qui ne vous sert pas : elles disparaissent partout, recherche comprise'));
    const tabs = h('div', { class: 'chips', 'data-zone': 'ctabs' });
    const acts = h('div', { class: 'btns', style: 'padding:0 var(--gut) 1rem;flex:none' });
    const list = h('div', { class: 'set', style: 'padding-top:0' });
    el.append(tabs, acts, h('div', { class: 'scroll', style: 'flex:1' }, list));
    let kind = null, cur = [];
    [['live', 'TV en direct'], ['vod', 'Films'], ['series', 'Séries']].forEach(([k, n]) => {
      const c = F('div', 'chip', { 'data-k': 'ct:' + k, 'data-id': k, 'data-first': k === (p.kind || 'live') || null }, n);
      c.onclick = () => show(k); c._focus = () => show(k);
      tabs.append(c);
    });
    async function show(k) {
      if (kind === k) return;
      kind = k; p.kind = k;
      $$('.chip', tabs).forEach(c => { c.classList.toggle('on', c.dataset.id === k); if (c.dataset.id === k) tabs._last = c; });
      list.replaceChildren(spinner()); acts.replaceChildren();
      let l;
      try { l = await catsRaw(k); } catch (x) { list.replaceChildren(empty('stream', 'Chargement impossible')); return; }
      if (kind !== k || e.dead) return;
      cur = l; draw();
    }
    function draw() {
      const l = cur, hid = new Set(S.hidden[kind]);
      const fk = document.activeElement && document.activeElement.dataset.k;
      const ln = LANGS[S.set.lang].n;
      const foreign = l.filter(c => { const g = catLang(c.n); return g && g !== S.set.lang; });
      const bLang = F('div', 'btn pri', { 'data-k': 'cl' }, ic('globe'), 'Garder seulement : ' + ln);
      bLang.onclick = () => {
        if (!foreign.length) { toast('Aucune catégorie d’une autre langue détectée'); return; }
        S.hidden[kind] = Array.from(new Set(S.hidden[kind].concat(foreign.map(c => c.id)))); saveHidden(); draw();
        toast(foreign.length + ' catégories masquées');
      };
      const bAll = F('div', 'btn', { 'data-k': 'ca' }, ic('eye'), 'Tout afficher');
      bAll.onclick = () => { S.hidden[kind] = []; saveHidden(); draw(); toast('Toutes les catégories sont visibles'); };
      const nv = l.filter(c => !hid.has(c.id)).length;
      acts.replaceChildren(bLang, bAll, h('div', { class: 'dim', style: 'font-size:.88rem;margin-left:.4rem' }, nv + ' visibles sur ' + l.length));
      list.replaceChildren(...l.map(c => {
        const on = !hid.has(c.id), g = catLang(c.n);
        const r = F('div', 'si', { 'data-k': 'cm:' + c.id }, h('div', { class: 'k' }, clean(c.n), g ? h('small', null, g === 'other' ? 'Autre langue' : LANGS[g].n) : null), h('div', { class: 'tg' + (on ? ' on' : '') }));
        r.onclick = () => { const i = S.hidden[kind].indexOf(c.id); if (i >= 0) S.hidden[kind].splice(i, 1); else S.hidden[kind].push(c.id); saveHidden(); draw(); };
        return r;
      }));
      if (!l.length) list.append(empty('layers', 'Aucune catégorie'));
      if (fk) { const f = $$('[data-k]', el).find(x => x.dataset.k === fk); if (f) focusEl(f); }
      settle(e);
    }
    show(p.kind || 'live');
  }
};

V.pin = {
  overlay: true, cls: 'dlg', render(el, p, e) {
    let v = '';
    const dots = h('div', { class: 'pin' }, [0, 1, 2, 3].map(() => h('i')));
    const msg = h('p', { style: 'text-align:center;margin-bottom:1rem' }, 'Saisissez 4 chiffres');
    const draw = () => $$('i', dots).forEach((d, i) => d.classList.toggle('on', i < v.length));
    const key = k => {
      if (k === 'del') v = v.slice(0, -1); else if (v.length < 4) v += k;
      draw();
      if (v.length === 4) { const ok = p.ok(v); if (ok === false) { msg.textContent = 'Code incorrect'; v = ''; setTimeout(draw, 250); } }
    };
    const pad = h('div', { class: 'pad' });
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'x'].forEach(k => {
      const b = F('div', 'btn', { 'data-k': 'k' + k, 'data-first': k === '5' || null }, k === 'del' ? '⌫' : k === 'x' ? '✕' : k);
      b.onclick = () => k === 'x' ? back() : key(k);
      pad.append(b);
    });
    el.append(h('div', { class: 'dbox', style: 'width:24rem' }, h('h3', { style: 'text-align:center' }, p.title), msg, dots, pad));
    e.onKey = ev => { if (/^\d$/.test(ev.key)) { key(ev.key); return true; } };
  }
};

/* ---- moteurs vidéo ----
   Dans l'application : LibVLC natif (toutes pistes audio / sous-titres, MKV, TS, HLS…),
   piloté par l'interface « NV » ; la vidéo s'affiche sous la page, rendue transparente.
   Dans un navigateur (tests) : balise <video>. */
function vlcEngine(host, live) {
  const NV = window.NV;
  document.documentElement.classList.add('vlc');
  const E = { kind: 'vlc', cb: {} };
  const emit = n => { const f = E.cb[n]; if (f) f(); };
  let st = { t: 0, d: 0, s: 0, a: -1, sp: -1 }, lastT = -1, movedAt = Date.now(), waiting = false, paused = false, ended = false, loaded = false, alive = true;
  E.pos = 0;            // dernière position où la lecture avançait vraiment (sert à reprendre après une coupure)
  const read = () => {
    const r = String(NV.state() || '').split(';');
    if (r.length >= 5) st = { t: (+r[0] || 0) / 1000, d: (+r[1] || 0) / 1000, s: +r[2], a: +r[3], sp: +r[4] };
    return st;
  };
  const size = () => { try { NV.size(Math.round(innerWidth * devicePixelRatio), Math.round(innerHeight * devicePixelRatio)); } catch (x) { } };
  size(); addEventListener('resize', size);
  const iv = setInterval(() => {
    if (!alive || !loaded) return;
    try { read(); } catch (x) { return; }
    if (st.s === 3) {
      if (st.t !== lastT) { lastT = st.t; if (st.t > 0) E.pos = st.t; movedAt = Date.now(); if (waiting || !E.started) { waiting = false; E.started = true; emit('playing'); } emit('timeupdate'); }
      else if (!paused && !waiting && Date.now() - movedAt > 1800) { waiting = true; emit('waiting'); }
    } else if (st.s === 6) {
      if (ended) return;
      /* fin anormale : le serveur a coupé la connexion en plein film → on reprend au lieu de quitter */
      /* si le fichier s'arrête encore au même endroit, tout près de la fin annoncée, c'est sa vraie fin (durée annoncée un peu fausse,
         fréquent chez les fournisseurs) → générique / épisode suivant au lieu de relancer en boucle */
      const nearEnd = st.d - E.pos < Math.max(600, st.d * 0.15), again = E.endPos >= 0 && Math.abs(E.pos - E.endPos) < 120;
      if (!live && st.d > 0 && E.pos > 0 && E.pos < st.d - 90 && !(again && nearEnd)) { E.endPos = E.pos; loaded = false; emit('error'); return; }
      ended = true; emit('ended');
    }
    else if (st.s === 7) { loaded = false; emit('error'); }
    else if ((st.s === 1 || st.s === 2) && !waiting) { waiting = true; emit('waiting'); }
  }, 400);
  /* chien de garde : image figée alors que la lecture (le son) avance → l'interface relance la lecture */
  let wd = { pic: -1, picAt: 0, tAt: 0 };
  const wiv = setInterval(() => {
    if (!alive || !loaded || paused || waiting || st.s !== 3 || !NV.stats) return;
    let r; try { r = String(NV.stats() || '').split(';'); } catch (x) { return; }
    if (r.length < 3) return;
    const dec = +r[0] || 0, pic = +r[1] || 0, now = Date.now();
    if (dec <= 0) return;                                   // pas de vidéo (radio) : rien à surveiller
    if (pic !== wd.pic) { if (wd.pic > 0 && pic > wd.pic) E.statsOk = true; wd = { pic, picAt: now, tAt: st.t }; return; }
    /* n'agit que si le compteur d'images a déjà avancé au moins une fois (sinon il n'est pas fiable sur cet appareil) */
    if (E.statsOk && now - wd.picAt > 6000 && st.t - wd.tAt > 4) { wd = { pic: -1, picAt: 0, tAt: 0 }; emit('frozen'); }
  }, 1000);
  /* renseignements techniques (affichés si un film ne peut pas être lu) */
  E.info = () => {
    let v = '', s = '';
    try { v = String(NV.videoInfo ? NV.videoInfo() || '' : ''); } catch (x) { }
    try { s = String(NV.stats ? NV.stats() || '' : ''); } catch (x) { }
    const vi = v.split(';'), sv = s.split(';');
    return [vi[0] && vi[0] !== 'null' ? vi[0].toUpperCase() + (+vi[1] ? ' ' + vi[1] + '×' + vi[2] : '') : 'vidéo non détectée',
      E.hwOff ? 'décodage logiciel' : 'décodage matériel', 'état ' + st.s, sv.length > 2 ? 'images ' + sv[1] + '/' + sv[0] : ''].filter(Boolean).join(' · ');
  };
  E.on = (n, f) => { E.cb[n] = f; };
  E.load = (url, start) => {
    const L = LANGS[S.set.lang].c.filter(c => /^[a-z]{2,3}$/.test(c)).slice(0, 3).join(',');
    loaded = true; ended = false; paused = false; waiting = true; lastT = -1; E.started = false; movedAt = Date.now(); wd = { pic: -1, picAt: 0, tAt: 0 };
    if (url !== E.url) E.endPos = -1;                    // nouveau titre (épisode suivant…) : rien n'est repris du précédent
    E.url = url; E.pos = start || 0;
    st = { t: start || 0, d: 0, s: 1, a: -1, sp: -1 };
    const cache = (live ? 3000 : 2500) * (E.bigCache ? 2 : 1);
    NV.play(url, ':network-caching=' + cache, ':start-time=' + (start > 0 ? start.toFixed(1) : '0'),
      ':audio-language=' + L, ':sub-language=' + (S.set.subs === 'off' ? 'none' : L),
      E.hwOff ? ':codec=avcodec,all' : ':no-video-title-show');   // décodage logiciel si la puce vidéo n'y arrive pas
  };
  E.play = () => { paused = false; movedAt = Date.now(); NV.resume(); emit('play'); };
  E.pause = () => { paused = true; NV.pause(); emit('pause'); };
  E.paused = () => paused;
  E.time = () => st.t;
  E.dur = () => st.d > 0 ? st.d : 0;
  E.ready = () => E.started;
  E.seek = t => { t = Math.max(0, t); NV.seek(Math.floor(t * 1000)); st.t = t; movedAt = Date.now(); };
  const parse = x => String(x || '').split('\n').filter(Boolean).map(l => { const i = l.indexOf('\t'); return { id: +l.slice(0, i), name: l.slice(i + 1) }; });
  E.tracks = () => {
    read();
    return { audio: parse(NV.tracks(0)).map(x => Object.assign(x, { on: x.id === st.a })), spu: parse(NV.tracks(1)).map(x => Object.assign(x, { on: x.id === st.sp })) };
  };
  E.setAudio = id => NV.setAudio(id);
  E.setSpu = id => NV.setSpu(id);
  E.destroy = () => { alive = false; clearInterval(iv); clearInterval(wiv); removeEventListener('resize', size); try { NV.stop(); } catch (x) { } document.documentElement.classList.remove('vlc'); };
  return E;
}
function htmlEngine(host) {
  const v = h('video', { playsinline: true, autoplay: true, preload: 'auto', poster: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' });
  host.prepend(v);
  const E = { kind: 'html', cb: {}, start: 0 };
  ['playing', 'waiting', 'error', 'ended', 'pause', 'play', 'timeupdate'].forEach(n => v.addEventListener(n, () => { const f = E.cb[n]; if (f) f(); }));
  v.addEventListener('loadedmetadata', () => { if (E.start > 0 && isFinite(v.duration)) { try { v.currentTime = Math.min(E.start, v.duration - 5); } catch (x) { } } E.start = 0; });
  E.on = (n, f) => { E.cb[n] = f; };
  E.load = (url, start) => { E.start = start || 0; v.src = url; v.play().catch(() => { }); };
  E.play = () => v.play().catch(() => { });
  E.pause = () => v.pause();
  E.paused = () => v.paused;
  E.time = () => v.currentTime || 0;
  E.dur = () => isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
  E.ready = () => v.readyState >= 3;
  E.seek = t => { v.currentTime = Math.max(0, t); };
  E.tracks = () => {
    const au = v.audioTracks ? Array.from(v.audioTracks) : [];
    const tt = Array.from(v.textTracks || []).filter(t => t.kind === 'subtitles' || t.kind === 'captions');
    return { audio: au.map((t, i) => ({ id: i, name: t.label || t.language, on: t.enabled })), spu: tt.map((t, i) => ({ id: i, name: t.label || t.language, on: t.mode === 'showing' })) };
  };
  E.setAudio = id => { if (v.audioTracks) Array.from(v.audioTracks).forEach((t, i) => { t.enabled = i === id; }); };
  E.setSpu = id => { Array.from(v.textTracks || []).filter(t => t.kind === 'subtitles' || t.kind === 'captions').forEach((t, i) => { t.mode = i === id ? 'showing' : 'disabled'; }); };
  E.destroy = () => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (x) { } };
  return E;
}

/* ---- lecteur plein écran natif ----
   Pendant la lecture, un calque Android (vidéo + sous-titres + image des commandes) passe DEVANT la page :
   aucune page web ne recouvre la vidéo. Les commandes NovaTV sont dessinées ici dans un <canvas> à partir
   de la page (mêmes positions, mêmes couleurs, mêmes icônes) puis envoyées au calque sous forme d'image.
   La page reste derrière : elle garde le focus de la télécommande et reçoit les appuis sur l'écran.
   Quand un menu s'ouvre par-dessus le lecteur (langue, versions, message d'erreur…), la page repasse devant. */
const PL = (() => {
  const nat = () => !!(window.NV && NV.front && NV.osd);
  let front = false, prev = null, cleared = true, last = 0, tmr = 0, tmrAt = 0, mo = null, urgent = false;
  /* zone à vérifier au prochain dessin : 'full' (tout l'écran) ou un rectangle (bouton qui prend/perd le focus, barre de temps) */
  let zone = 'full', lastFocus = null;
  function addZone(el, m) {
    if (zone === 'full') return;
    const r = el && el.getBoundingClientRect && el.getBoundingClientRect();
    if (!r || !r.width) { zone = 'full'; return; }
    const z = { l: r.left - m, t: r.top - m, r: r.right + m, b: r.bottom + m };
    zone = zone ? { l: Math.min(zone.l, z.l), t: Math.min(zone.t, z.t), r: Math.max(zone.r, z.r), b: Math.max(zone.b, z.b) } : z;
  }
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  const pc = document.createElement('canvas'), pcx = pc.getContext('2d');
  const playerE = () => { const t = topE(); return t && t.view === 'player' && t.el ? t : null; };
  function setFront(on) {
    if (on === front) return;
    front = on;
    if (nat()) { try { NV.front(on ? 1 : 0); } catch (x) { } }
    if (!on) clear();
  }
  /* l'appli Android garde l'image entière : on ne lui envoie que le rectangle qui a changé */
  function send(b64, x, y, W, H) {
    cleared = false;
    if (nat()) { try { NV.osd(b64, x, y, W, H); } catch (x) { prev = null; } }
  }
  function clear() {
    prev = null;
    if (cleared) return;
    cleared = true; window.__osd = '';
    if (nat()) { try { NV.osd('', 0, 0, 0, 0); } catch (x) { } }
  }
  const wanted = e => !!(e && document.documentElement.classList.contains('vlc') && !e.el.querySelector('.pmsg.err'));
  function update() {
    const e = playerE();
    const on = wanted(e);
    if (mo && (!e || mo.el !== e.el)) { mo.disconnect(); mo = null; }
    if (on && !mo) {
      /* la barre de temps qui avance ne demande qu'une image par seconde ; tout le reste (focus, boutons, messages) est redessiné tout de suite */
      mo = new MutationObserver(recs => {
        let light = true;
        for (const r of recs) {
          const n = r.target.nodeType === 1 ? r.target : r.target.parentElement, sk = n && n.closest && n.closest('.seek');
          if (sk) addZone(sk, 24); else { light = false; zone = 'full'; }
        }
        schedule(!light);
      });
      mo.el = e.el;
      mo.observe(e.el, { subtree: true, childList: true, attributes: true, characterData: true });
      mo.observe($('#toast'), { attributes: true, childList: true, characterData: true, subtree: true });
    }
    setFront(on);
    if (on) { zone = 'full'; schedule(true); }
  }
  function schedule(now) {
    if (wanted(playerE()) !== front) { update(); return; }   // message d'erreur avec boutons, ou retour à la lecture
    if (!front) return;
    if (now !== false) urgent = true;
    const at = Date.now() + (urgent ? 16 : Math.max(16, 1000 - (Date.now() - last)));
    if (tmr && tmrAt <= at) return;                         // déjà prévue plus tôt
    clearTimeout(tmr); tmrAt = at;
    tmr = setTimeout(draw, at - Date.now());
  }
  /* --- petit peintre DOM → canvas (seulement ce dont le lecteur a besoin) --- */
  const num = v => parseFloat(v) || 0;
  function splitTop(str) {           // découpe « a, b(c, d), e » au niveau supérieur
    const out = []; let d = 0, cur = '';
    for (const ch of str) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim()); return out;
  }
  function rrect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath();
  }
  function gradient(bg, x, y, w, h) {
    const m = /linear-gradient\((.*)\)\s*$/.exec(bg); if (!m) return null;
    const parts = splitTop(m[1]); let ang = 180;
    if (/deg$/.test(parts[0])) ang = num(parts.shift());
    else if (/^to /.test(parts[0])) { const t = parts.shift(); ang = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[t] ?? 180; }
    const a = ang * Math.PI / 180, sx = Math.sin(a), sy = -Math.cos(a);
    const half = (Math.abs(w * sx) + Math.abs(h * sy)) / 2, cxm = x + w / 2, cym = y + h / 2;
    const g = cx.createLinearGradient(cxm - sx * half, cym - sy * half, cxm + sx * half, cym + sy * half);
    parts.forEach((p, i) => {
      const mm = /^(.*\))\s*([\d.]+%)?$|^(\S+)\s*([\d.]+%)?$/.exec(p);
      const col = mm[1] || mm[3], pos = mm[2] || mm[4];
      g.addColorStop(Math.min(1, Math.max(0, pos ? num(pos) / 100 : i / Math.max(1, parts.length - 1))), col);
    });
    return g;
  }
  function shadows(v) {
    if (!v || v === 'none') return [];
    return splitTop(v).map(p => {
      const col = (/rgba?\([^)]*\)|#[0-9a-f]+/i.exec(p) || ['rgba(0,0,0,.5)'])[0];
      const L = p.replace(col, '').trim().split(/\s+/).map(num);
      return { col, x: L[0] || 0, y: L[1] || 0, blur: L[2] || 0, spread: L[3] || 0 };
    });
  }
  function words(node, cs) {
    const txt = node.nodeValue; if (!txt || !txt.trim()) return;
    cx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    cx.fillStyle = cs.color; cx.textBaseline = 'middle'; cx.textAlign = 'left';
    if ('letterSpacing' in cx) cx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    const up = cs.textTransform === 'uppercase', rg = document.createRange(), re = /\S+/g; let m;
    while ((m = re.exec(txt))) {
      rg.setStart(node, m.index); rg.setEnd(node, m.index + m[0].length);
      const r = rg.getClientRects()[0]; if (!r || !r.width) continue;
      cx.fillText(up ? m[0].toUpperCase() : m[0], r.left, r.top + r.height / 2);
    }
  }
  function svg(el) {
    const r = el.getBoundingClientRect(); if (!r.width) return;
    const vb = (el.getAttribute('viewBox') || '0 0 24 24').split(/[\s,]+/).map(Number);
    cx.save(); cx.translate(r.left, r.top); cx.scale(r.width / vb[2], r.height / vb[3]); cx.translate(-vb[0], -vb[1]);
    el.querySelectorAll('path,circle,rect,ellipse,line,polyline,polygon').forEach(sh => {
      const cs = getComputedStyle(sh), A = n => num(sh.getAttribute(n));
      let p;
      switch (sh.tagName.toLowerCase()) {
        case 'path': p = new Path2D(sh.getAttribute('d') || ''); break;
        case 'circle': p = new Path2D(); p.arc(A('cx'), A('cy'), A('r'), 0, Math.PI * 2); break;
        case 'ellipse': p = new Path2D(); p.ellipse(A('cx'), A('cy'), A('rx'), A('ry'), 0, 0, Math.PI * 2); break;
        case 'line': p = new Path2D(`M${A('x1')} ${A('y1')}L${A('x2')} ${A('y2')}`); break;
        case 'polyline': case 'polygon': p = new Path2D('M' + (sh.getAttribute('points') || '').trim() + (sh.tagName === 'polygon' ? 'Z' : '')); break;
        case 'rect': { p = new Path2D(); const x = A('x'), y = A('y'), w = A('width'), h = A('height'), rx = A('rx') || A('ry');
          if (rx) { const q = Math.min(rx, w / 2, h / 2); p.moveTo(x + q, y); p.arcTo(x + w, y, x + w, y + h, q); p.arcTo(x + w, y + h, x, y + h, q); p.arcTo(x, y + h, x, y, q); p.arcTo(x, y, x + w, y, q); p.closePath(); }
          else p.rect(x, y, w, h); break; }
      }
      if (!p) return;
      if (cs.fill && cs.fill !== 'none') { cx.fillStyle = cs.fill; cx.fill(p, cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero'); }
      if (cs.stroke && cs.stroke !== 'none' && num(cs.strokeWidth) > 0) {
        cx.strokeStyle = cs.stroke; cx.lineWidth = num(cs.strokeWidth); cx.lineCap = cs.strokeLinecap || 'butt'; cx.lineJoin = cs.strokeLinejoin || 'miter'; cx.stroke(p);
      }
    });
    cx.restore();
  }
  function paint(el, alpha, forceOpaque) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.hidden) return;
    const a = alpha * (forceOpaque ? 1 : num(cs.opacity === '' ? 1 : cs.opacity));
    if (a <= 0.01) return;
    cx.save(); cx.globalAlpha = a;
    const r = el.getBoundingClientRect(), rad = cs.borderTopLeftRadius.endsWith('%') ? Math.min(r.width, r.height) * num(cs.borderTopLeftRadius) / 100 : num(cs.borderTopLeftRadius);
    if (r.width && r.height) {
      if (el.classList.contains('spin')) {             // anneau de chargement (fixe)
        const cxp = r.left + r.width / 2, cyp = r.top + r.height / 2, bw = num(cs.borderTopWidth), rr = r.width / 2 - bw / 2;
        cx.lineWidth = bw; cx.strokeStyle = cs.borderLeftColor; cx.beginPath(); cx.arc(cxp, cyp, rr, 0, Math.PI * 2); cx.stroke();
        cx.strokeStyle = cs.borderTopColor; cx.beginPath(); cx.arc(cxp, cyp, rr, -Math.PI * 0.75, -Math.PI * 0.25); cx.stroke();
        cx.strokeStyle = cs.borderRightColor; cx.beginPath(); cx.arc(cxp, cyp, rr, -Math.PI * 0.25, Math.PI * 0.25); cx.stroke();
        cx.restore(); return;
      }
      const bgc = cs.backgroundColor, hasBg = bgc && !/rgba\(.*,\s*0\)$/.test(bgc) && bgc !== 'transparent';
      const g = cs.backgroundImage && cs.backgroundImage !== 'none' ? gradient(cs.backgroundImage, r.left, r.top, r.width, r.height) : null;
      for (const sh of shadows(cs.boxShadow)) {
        if (!sh.blur && !sh.x && !sh.y && sh.spread) { cx.fillStyle = sh.col; rrect(r.left - sh.spread, r.top - sh.spread, r.width + 2 * sh.spread, r.height + 2 * sh.spread, rad + sh.spread); cx.fill(); }
        else if (sh.blur || sh.x || sh.y) {
          cx.save(); cx.shadowColor = sh.col; cx.shadowBlur = sh.blur * (cv.width / innerWidth); cx.shadowOffsetX = sh.x * (cv.width / innerWidth); cx.shadowOffsetY = sh.y * (cv.width / innerWidth);
          cx.fillStyle = hasBg ? bgc : '#000'; rrect(r.left, r.top, r.width, r.height, rad); cx.fill(); cx.restore();
        }
      }
      if (hasBg) { cx.fillStyle = bgc; rrect(r.left, r.top, r.width, r.height, rad); cx.fill(); }
      if (g) { cx.fillStyle = g; rrect(r.left, r.top, r.width, r.height, rad); cx.fill(); }
      const bw = num(cs.borderTopWidth);
      if (bw > 0 && cs.borderTopStyle !== 'none' && !/rgba\(.*,\s*0\)$/.test(cs.borderTopColor)) {
        cx.strokeStyle = cs.borderTopColor; cx.lineWidth = bw; rrect(r.left + bw / 2, r.top + bw / 2, r.width - bw, r.height - bw, rad - bw / 2); cx.stroke();
      }
      if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') { rrect(r.left, r.top, r.width, r.height, rad); cx.clip(); }
    }
    for (const n of el.childNodes) {
      if (n.nodeType === 3) words(n, cs);
      else if (n.nodeType === 1) {
        const tag = n.tagName.toLowerCase();
        if (tag === 'svg') { const c2 = getComputedStyle(n); if (c2.display !== 'none') svg(n); }
        else if (tag === 'img') {             // seules les images locales (sinon le canvas serait « verrouillé »)
          if (/^(data:|file:)/.test(n.currentSrc || n.src) && n.complete && n.naturalWidth) { const q = n.getBoundingClientRect(); try { cx.drawImage(n, q.left, q.top, q.width, q.height); } catch (x) { } }
          else if (n.dataset.ini) {           // logo du fournisseur (autre serveur) : initiales, comme quand le logo manque
            const q = n.parentElement.getBoundingClientRect(), fs = Math.min(q.height * 0.42, q.width / (n.dataset.ini.length * 0.75 + 0.5));
            cx.save(); cx.font = `800 ${fs}px Display, Inter, sans-serif`; cx.fillStyle = 'rgba(238,241,255,.8)'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
            cx.fillText(n.dataset.ini, q.left + q.width / 2, q.top + q.height / 2); cx.restore();
          }
        } else if (tag !== 'video' && tag !== 'canvas') paint(n, 1);
      }
    }
    cx.restore();
  }
  function draw() {
    tmr = 0; urgent = false;
    if (!front) return;
    const e = playerE(); if (!e) return;
    const ov = e.el.querySelector('.pov'), msg = e.el.querySelector('.pmsg'), osd = e.el.querySelector('.osd'), toast = $('#toast');
    const items = [];
    if (ov && !ov.classList.contains('off')) items.push([ov, true]);
    if (osd && !osd.classList.contains('hide')) items.push([osd, false]);
    if (msg && !msg.classList.contains('hide')) items.push([msg, true]);
    if (toast && toast.classList.contains('on')) items.push([toast, true]);
    last = Date.now();
    if (!items.length) { clear(); return; }
    const k = Math.min(window.devicePixelRatio || 1, 1.5, 1280 / innerWidth), W = Math.round(innerWidth * k), H = Math.round(innerHeight * k);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    /* zone à revérifier : seul ce rectangle est redessiné (le reste de l'image n'a pas bougé) */
    let z = zone; zone = null;
    if (!prev || prev.length !== W * H) z = 'full';
    let zx = 0, zy = 0, zw = W, zh = H;
    if (z && z !== 'full') {
      zx = Math.max(0, Math.floor(z.l * k)); zy = Math.max(0, Math.floor(z.t * k));
      zw = Math.min(W, Math.ceil(z.r * k)) - zx; zh = Math.min(H, Math.ceil(z.b * k)) - zy;
      if (zw <= 0 || zh <= 0) { mark(); return; }
    }
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.save(); cx.beginPath(); cx.rect(zx, zy, zw, zh); cx.clip(); cx.clearRect(zx, zy, zw, zh);
    cx.setTransform(k, 0, 0, k, 0, 0);
    try { for (const [el, op] of items) paint(el, 1, op); } catch (x) { console.error(x); }
    cx.restore();
    /* rectangle des pixels qui ont vraiment changé depuis la dernière image envoyée */
    const cur = new Uint32Array(cx.getImageData(zx, zy, zw, zh).data.buffer);
    let x0 = zx, y0 = zy, x1 = zx + zw - 1, y1 = zy + zh - 1;
    if (z !== 'full' || (prev && prev.length === W * H)) {
      x0 = W; y0 = H; x1 = -1; y1 = -1;
      for (let y = 0, i = 0; y < zh; y++) {
        let a = -1, e = -1;
        for (let x = 0, j = (zy + y) * W + zx; x < zw; x++, i++, j++) if (cur[i] !== prev[j]) { if (a < 0) a = x; e = x; prev[j] = cur[i]; }
        if (a >= 0) { if (zy + y < y0) y0 = zy + y; y1 = zy + y; if (zx + a < x0) x0 = zx + a; if (zx + e > x1) x1 = zx + e; }
      }
      if (x1 < 0) { mark(); return; }                      // rien n'a changé à l'écran : rien à envoyer
    } else prev = cur;
    const pw = x1 - x0 + 1, ph = y1 - y0 + 1;
    if (pc.width !== pw || pc.height !== ph) { pc.width = pw; pc.height = ph; } else pcx.clearRect(0, 0, pw, ph);
    pcx.drawImage(cv, x0, y0, pw, ph, 0, 0, pw, ph);
    let b64 = null;
    try { b64 = pc.toDataURL('image/png').split(',')[1] || null; } catch (x) { console.error(x); }
    if (b64) { send(b64, x0, y0, W, H); window.__osd = 'x'; mark(); } else prev = null;   // échec : image entière la prochaine fois
  }
  /* (pour les tests) bouton en surbrillance sur la dernière image affichée */
  function mark() { const a = document.activeElement; window.__osdK = a && a.dataset ? a.dataset.k : ''; window.__osdKt = Date.now(); }
  /* focus qui passe d'un bouton à l'autre : seuls ces deux boutons (et leur halo) sont revérifiés */
  const inPlayer = el => { const e = playerE(); return !!(e && el && e.el.contains(el)); };
  addEventListener('transitionend', ev => { if (!front) return; if (inPlayer(ev.target) && ev.target.closest('.btn')) addZone(ev.target, 40); else zone = 'full'; schedule(true); }, true);
  addEventListener('focusin', ev => {
    const was = lastFocus; lastFocus = ev.target;
    if (!front) return;
    if (inPlayer(ev.target) && (!was || inPlayer(was))) { if (was && was.isConnected) addZone(was, 40); addZone(ev.target, 40); } else zone = 'full';
    schedule(true);
  }, true);
  addEventListener('resize', () => { if (front) { zone = 'full'; schedule(true); } });
  return { update, draw, isFront: () => front, snap: () => cv };
})();

/* ---- lecteur ---- */
V.player = {
  overlay: true, cls: 'player', render(el, p, e) {
    const live = p.kind === 'live';
    const native = !!window.NV;
    const tl = h('div', { class: 't' }), ts = h('div', { class: 's' }), lg = h('div', { class: 'lg' });
    const now = h('div', { class: 'pnow' });
    const bar = h('div', { class: 'bar' }, h('i'), h('b')), tc = h('span'), td = h('span');
    const seek = h('div', { class: 'seek hide' }, tc, bar, td);
    const bPlay = F('div', 'btn icon pri', { 'data-k': 'pp' }, ic('pause'));
    const ctl = h('div', { class: 'pctl' });
    const ov = h('div', { class: 'pov' }, h('div', { class: 'ptop' }, lg, h('div', null, tl, ts)), h('div', { class: 'pbot' }, now, seek, ctl));
    const msg = h('div', { class: 'pmsg' }, h('div', { class: 'spin' }), h('div', { class: 'm' }));
    const osd = h('div', { class: 'osd hide' });
    el.append(msg, ov, osd);
    const E = native ? vlcEngine(el, live) : htmlEngine(el);
    let tries = 0, stallT, hideT, saveT, loadT, zapT, osdT, subT, ovOn = true, startAt = p.start || 0;
    let fmt = native ? S.set.liveFmt : 'm3u8';

    const curIt = () => live ? p.list[p.idx] : p.kind === 'vod' ? p.it : p.eps[p.idx];
    const key = () => p.kind === 'vod' ? 'vod:' + p.it.id : 'ep:' + p.eps[p.idx].id;
    function save() {
      const d = E.dur(), t = E.time();
      if (live || !d || t < 1) return;
      if (p.kind === 'vod') setProg(key(), t, d, { k: 'vod', id: p.it.id, n: p.it.n, i: p.it.i, x: p.it.x });
      else {
        const x = p.eps[p.idx], nx = p.eps[p.idx + 1];
        setProg(key(), t, d, { k: 'ep', id: x.id, sid: p.show.id, show: p.show.n, n: 'S' + x.s + ' · É' + x.e, i: p.show.i, bg: x.img },
          nx ? { id: nx.id, d: nx.d, meta: { id: nx.id, n: 'S' + nx.s + ' · É' + nx.e, bg: nx.img } } : null);
      }
    }
    function busy(t) { msg.className = 'pmsg'; msg.replaceChildren(h('div', { class: 'spin' }), t ? h('div', { class: 'm' }, t) : null); }
    function idle() { msg.className = 'pmsg hide'; }
    function fatal() {
      clearTimeout(stallT); clearTimeout(loadT);
      const r = F('div', 'btn pri', { 'data-k': 'retry' }, ic('refresh'), 'Réessayer'), q = F('div', 'btn', { 'data-k': 'quit' }, 'Retour');
      r.onclick = () => { tries = 0; if (!live && E.pos > 1) startAt = E.pos; load(); }; q.onclick = () => back();
      msg.className = 'pmsg err';
      const it = curIt(), det = (E.info ? E.info() : '') + (it && it.x ? ' · .' + it.x : '');
      msg.replaceChildren(h('b', null, 'Lecture impossible'), h('div', { class: 'm' }, live ? 'La chaîne ne répond pas. Elle est peut-être hors service ou votre nombre de connexions est atteint.' : 'Ce fichier n’a pas pu être lu, même en décodage logiciel. Il est sans doute indisponible chez votre fournisseur, ou votre nombre de connexions est atteint (un autre appareil regarde déjà).'),
        h('div', { class: 'm', style: 'opacity:.55;font-size:.8em;margin-top:.4rem' }, det), h('div', { class: 'btns' }, r, q));
      showOv(false); focusEl(r);
    }
    function fail() {
      if (e.dead) return;
      clearTimeout(stallT); clearTimeout(loadT);
      tries++;
      if (tries > 5) return fatal();
      if (live && tries === 3) fmt = fmt === 'm3u8' ? 'ts' : 'm3u8';
      /* 2e essai : décodage logiciel (formats que la puce vidéo refuse) ; 3e : plus de mémoire tampon (serveur lent) */
      if (tries === 2 && !E.hwOff) E.hwOff = true;
      if (tries === 3) E.bigCache = true;
      if (!live && Math.max(E.time(), E.pos || 0) > 1) startAt = Math.max(E.time(), E.pos || 0);
      busy('Reconnexion… (' + tries + '/5)');
      setTimeout(() => { if (!e.dead) load(true); }, Math.min(800 * 2 ** (tries - 1), 8000));
    }
    function load(keepTries) {
      if (!keepTries) { tries = 0; E.hwOff = false; E.bigCache = false; }   // nouveau titre ou nouvel essai : on repart du mode normal
      clearTimeout(stallT); clearTimeout(loadT); clearTimeout(subT);
      const it = curIt();
      busy();
      E.load(live ? urlLive(it.id, fmt) : p.kind === 'vod' ? urlVod(it) : urlEp(it), live ? 0 : startAt);
      startAt = 0;
      loadT = setTimeout(() => { if (!E.ready()) fail(); }, live ? 20000 : 40000);
    }
    /* sous-titres « auto » : affichés seulement si l'audio n'est pas dans la langue préférée */
    function autoSubs() {
      if (S.set.subs !== 'auto' || e.dead) return;
      let T; try { T = E.tracks(); } catch (x) { return; }
      const a = T.audio.find(x => x.on), aLang = a && nameLang(a.name);
      const s = T.spu.find(x => x.on && x.id !== -1);
      if (aLang === S.set.lang && s) E.setSpu(-1);
      else if (aLang && aLang !== S.set.lang && !s) { const f = T.spu.find(x => x.id !== -1 && nameLang(x.name) === S.set.lang); if (f) E.setSpu(f.id); }
    }
    E.on('playing', () => {
      const first = tries === 0 && !E.seenPlay; E.seenPlay = true;
      tries = 0; clearTimeout(stallT); clearTimeout(loadT); idle(); setPP(); armHide();
      if (first) { clearTimeout(subT); subT = setTimeout(autoSubs, 1500); }
    });
    E.on('waiting', () => { busy(); clearTimeout(stallT); stallT = setTimeout(fail, live ? 12000 : 20000); });
    E.on('error', fail);
    /* image figée alors que le son continue : on relance au même endroit ; si ça recommence, décodage logiciel */
    let freezes = 0;
    E.on('frozen', () => {
      if (e.dead) return;
      freezes++;
      if (freezes >= 2 && !E.hwOff) { E.hwOff = true; toast('Image bloquée : passage en décodage logiciel'); }
      else toast('Image bloquée : relance de la lecture');
      if (!live) startAt = Math.max(0, E.time() - 2);
      load(true);
    });
    E.on('pause', setPP); E.on('play', setPP);
    E.on('timeupdate', () => { if (ovOn) drawSeek(); });
    E.on('ended', () => {
      if (live) return fail();
      save();
      if (p.kind === 'ep' && S.set.autoNext && p.idx < p.eps.length - 1) nextEp(); else back();
    });
    function setPP() { bPlay.replaceChildren(ic(E.paused() ? 'play' : 'pause')); }
    function drawSeek() {
      if (live) return;
      const d = E.dur(), c = E.time();
      if (!d) { seek.classList.add('hide'); return; }
      seek.classList.remove('hide');
      const pc = Math.min(100, c / d * 100);
      bar.firstChild.style.width = pc + '%'; bar.lastChild.style.left = pc + '%';
      tc.textContent = dur(c); td.textContent = '-' + dur(d - c);
    }
    function showOv(focus) {
      ovOn = true; ov.classList.remove('off'); drawSeek();
      if (focus !== false && !ov.contains(document.activeElement)) focusEl(bPlay);
      armHide();
    }
    function hideOv() { ovOn = false; ov.classList.add('off'); clearTimeout(hideT); if (ov.contains(document.activeElement)) el.focus({ preventScroll: true }); }
    function armHide() { clearTimeout(hideT); hideT = setTimeout(() => { if (!E.paused() && msg.className !== 'pmsg err' && topE() === e) hideOv(); }, 5000); }
    function jump(s) {
      const d = E.dur();
      if (live || !d) return;
      const t = Math.max(0, Math.min(d - 2, E.time() + s));
      E.seek(t);
      osd.textContent = (s > 0 ? '+' : '−') + Math.abs(s) + ' s   ' + dur(t);
      osd.classList.remove('hide'); clearTimeout(osdT); osdT = setTimeout(() => osd.classList.add('hide'), 1200);
      showOv(false);
    }
    function toggle() { if (E.paused()) E.play(); else E.pause(); showOv(false); }
    const tracks = () => go('tracks', {
      E, it: live ? null : p.kind === 'vod' ? p.it : { k: 'series', id: p.show.id, n: p.show.n, i: p.show.i },
      from: () => p.kind === 'vod' ? { play: true, t: E.time() } : { se: { s: p.eps[p.idx].s, e: p.eps[p.idx].e, t: E.time() } }
    });
    function info() {
      const it = curIt();
      if (live) {
        tl.textContent = clean(it.n); ts.textContent = 'Chaîne ' + (it.num || p.idx + 1) + ' · En direct';
        lg.replaceChildren(...art(it.i, it.n, '')); lg.classList.remove('hide');
        now.replaceChildren();
        epg(it.id).then(l => {
          if (curIt() !== it) return;
          const [n, nx] = nowOf(l);
          now.replaceChildren(n ? h('div', { class: 't' }, n.t) : null, n ? h('div', { class: 's' }, hm(n.s) + ' – ' + hm(n.e)) : null, n ? h('div', { class: 'pbar', style: 'margin-top:.6rem' }, h('i', { style: 'width:' + Math.round((Date.now() - n.s) / (n.e - n.s) * 100) + '%' })) : null, nx ? h('div', { class: 'nx' }, 'Ensuite  ' + hm(nx.s) + '  ' + nx.t) : null);
        });
        addRecent(it);
      } else if (p.kind === 'vod') { tl.textContent = clean(it.n); ts.textContent = 'Film'; lg.classList.add('hide'); now.replaceChildren(); }
      else { tl.textContent = clean(p.show.n); ts.textContent = 'Saison ' + it.s + ' · Épisode ' + it.e + ' — ' + clean(it.t); lg.classList.add('hide'); now.replaceChildren(); }
      buildCtl();
    }
    function buildCtl() {
      const it = curIt(), b = [];
      const mk = (icn, k, fn, cls, label) => { const x = F('div', 'btn ' + (label ? '' : 'icon ') + (cls || ''), { 'data-k': k }, ic(icn), label || null); x.onclick = () => { fn(); armHide(); }; return x; };
      bPlay.onclick = () => { toggle(); armHide(); };
      if (live) b.push(mk('up', 'zp', () => zap(-1)), bPlay, mk('down', 'zn', () => zap(1)));
      else {
        b.push(mk('rew', 'rw', () => jump(-10)), bPlay, mk('ffw', 'ff', () => jump(30)));
        if (p.kind === 'ep' && p.idx < p.eps.length - 1) b.push(mk('next', 'nx', nextEp, '', 'Épisode suivant'));
      }
      b.push(h('div', { class: 'grow' }));
      b.push(mk('cc', 'tk', tracks, '', 'Langue'));
      if (p.kind !== 'ep') {
        const fv = mk(isFav(it) ? 'heartf' : 'heart', 'fv', () => { const on = toggleFav(it); fv.classList.toggle('on', on); fv.replaceChildren(ic(on ? 'heartf' : 'heart')); }, isFav(it) ? 'on' : '');
        b.push(fv);
      }
      b.push(mk('back', 'cl', () => back()));
      const had = ctl.contains(document.activeElement) ? document.activeElement.dataset.k : null;
      ctl.replaceChildren(...b);
      if (had) { const f = $$('[data-k]', ctl).find(x => x.dataset.k === had); if (f) focusEl(f); }
    }
    function zap(d) {
      p.idx = (p.idx + d + p.list.length) % p.list.length;
      fmt = native ? S.set.liveFmt : 'm3u8';
      info(); showOv(false);
      const it = curIt();
      osd.textContent = (it.num || p.idx + 1) + '  ' + clean(it.n);
      osd.classList.remove('hide'); clearTimeout(osdT); osdT = setTimeout(() => osd.classList.add('hide'), 1800);
      busy();
      clearTimeout(zapT); zapT = setTimeout(load, 450);
    }
    function nextEp() { save(); p.idx++; startAt = 0; E.seenPlay = false; info(); load(); showOv(false); }
    bar.onclick = ev => { const r = bar.getBoundingClientRect(), d = E.dur(); if (d) { E.seek((ev.clientX - r.left) / r.width * d); showOv(false); } };
    el.tabIndex = -1;
    el.addEventListener('click', ev => { if (ev.target === el || ev.target === ov || ev.target.tagName === 'VIDEO') { if (ovOn) hideOv(); else showOv(false); } });

    e.onKey = ev => {
      const k = ev.key;
      if (msg.className === 'pmsg err') return false;
      if (k === 'MediaPlayPause' || k === 'MediaPlay' || k === 'MediaPause') { if (!live) toggle(); else showOv(false); return true; }
      if (k === 'MediaFastForward' || k === 'MediaTrackNext') { live ? zap(1) : jump(30); return true; }
      if (k === 'MediaRewind' || k === 'MediaTrackPrevious') { live ? zap(-1) : jump(-10); return true; }
      if (k === 'ChannelUp' || k === 'PageUp') { if (live) zap(-1); return true; }
      if (k === 'ChannelDown' || k === 'PageDown') { if (live) zap(1); return true; }
      if (k === 'ContextMenu' || k === 'Menu') { tracks(); return true; }
      if (!ovOn) {
        if (k === 'Enter' || k === ' ' || k === 'Select') { if (!live) toggle(); showOv(); return true; }
        if (k === 'ArrowLeft' || k === 'ArrowRight') { if (live) showOv(); else jump(k === 'ArrowLeft' ? -10 : (ev.repeat ? 30 : 10)); return true; }
        if (k === 'ArrowUp' || k === 'ArrowDown') { if (live) zap(k === 'ArrowUp' ? -1 : 1); else showOv(); return true; }
        return false;
      }
      armHide();
      if (!ov.contains(document.activeElement)) { focusEl(bPlay); return true; }
      return false;
    };
    /* appli en arrière-plan (bouton Accueil) : pause ; au retour, le direct est relancé */
    const vis = () => { if (document.hidden) { save(); E.pause(); } else if (live) load(); else { setPP(); showOv(); } };
    document.addEventListener('visibilitychange', vis);
    e.onShow = () => { if (ovOn) armHide(); };
    e.cleanup = () => {
      document.removeEventListener('visibilitychange', vis);
      save();
      /* la fiche d'où l'on vient se met à jour (vus, reprise) et garde la position sur l'épisode regardé */
      const below = R.stack[R.stack.length - 1];
      if (below && below !== e && (below.view === 'show' || below.view === 'movie')) {
        below.ver = -1;
        if (p.kind === 'ep') below.fk = 'ep:' + p.eps[p.idx].id;
      }
      [stallT, hideT, loadT, zapT, osdT, subT].forEach(clearTimeout); clearInterval(saveT);
      E.destroy();
    };
    saveT = setInterval(save, 10000);
    info(); load(); showOv();
  }
};

/* ================= démarrage ================= */
const NAV = [['home', 'home', 'Accueil'], ['live', 'live', 'Direct'], ['guide', 'guide', 'Guide TV'], ['movies', 'film', 'Films'], ['series', 'series', 'Séries'], ['favs', 'heart', 'Favoris'], ['search', 'search', 'Chercher'], ['settings', 'gear', 'Réglages']];
function boot() {
  const nav = $('#nav');
  nav.append(h('div', { class: 'brand', html: MARK }));
  NAV.forEach(([v, icn, lb], i) => {
    if (i === 6) nav.append(h('div', { class: 'sp' }));
    const n = F('div', 'ni', { 'data-v': v, 'data-k': 'nav:' + v }, ic(icn), h('span', { class: 'lb' }, lb));
    n.onclick = () => goTop(v);
    nav.append(n);
  });
  R.stack.push({ view: S.acc ? 'home' : 'login', params: {}, id: ++R.seq });
  history.replaceState({ i: 0 }, '');
  sync();
  /* rapport de plantage du lancement précédent */
  if (window.NV && NV.crash) {
    let crash = '';
    try { crash = NV.crash() || ''; } catch (x) { }
    if (crash) setTimeout(() => ask('NovaTV s’est fermée la dernière fois',
      'Si cela se reproduit, envoyez une capture de ce message :\n\n' + crash.split('\n').slice(0, 8).join('\n'), [{ t: 'OK', pri: true }]), 600);
  }
  if (S.acc) api({}, { retries: 1 }).then(j => {
    if (!j || !j.user_info) return;
    S.info = j.user_info;
    if (+j.user_info.auth !== 1) toast('Identifiants refusés : vérifiez vos réglages');
    else if (j.user_info.status && !/active/i.test(j.user_info.status)) toast('Abonnement : ' + j.user_info.status);
  }).catch(() => toast('Serveur injoignable, nouvel essai automatique…'));
}
boot();
