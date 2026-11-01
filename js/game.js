// Chicken Runner — 1-Bit Infinite Runner
// Pure 2-tone pixel art: every sprite, effect, UI element, and hat is drawn
// with integer-aligned fillRects (dithering instead of alpha — zero gray).
// Audio is WebAudio-synthesized with dynamic tempo and retro SFX.
(() => {
'use strict';

// ---------- constants ----------
const W = 960, H = 280, GROUND = 225;
const S = 3;                                      // sprite scale: 1 sprite px = 3 canvas px
const STAND_W = 16 * S, STAND_H = 22 * S;        // chicken: 48 x 66
const SLIDE_W = 22 * S, SLIDE_H = 12 * S;        // chicken duck: 66 x 36
const SLIDE_OFF = STAND_H - SLIDE_H;             // 30px offset when ducking
const G = 1100;                                   // gravity px/s^2
const JUMP_V = 385;                               // ~67px apex, ~0.7s airtime

// Palettes: Strict 2-tone pairs (Zero Grays)
const PALETTES = {
  mono: {
    name: 'B&W',
    dayBg: [255, 255, 255], dayFg: [0, 0, 0],
    nightBg: [0, 0, 0], nightFg: [255, 255, 255],
    cssClass: 'theme-mono'
  },
  gameboy: {
    name: 'DMG',
    dayBg: [139, 172, 15], dayFg: [15, 56, 15],
    nightBg: [15, 56, 15], nightFg: [139, 172, 15],
    cssClass: 'theme-gameboy'
  },
  amber: {
    name: 'AMBER',
    dayBg: [255, 176, 0], dayFg: [26, 10, 0],
    nightBg: [26, 10, 0], nightFg: [255, 176, 0],
    cssClass: 'theme-amber'
  },
  macintosh: {
    name: 'MAC',
    dayBg: [245, 245, 240], dayFg: [26, 26, 26],
    nightBg: [26, 26, 26], nightFg: [245, 245, 240],
    cssClass: 'theme-macintosh'
  },
  cyber: {
    name: 'CYBER',
    dayBg: [0, 255, 204], dayFg: [4, 10, 18],
    nightBg: [4, 10, 18], nightFg: [0, 255, 204],
    cssClass: 'theme-cyber'
  }
};
const THEME_KEYS = ['mono', 'gameboy', 'amber', 'macintosh', 'cyber'];

// Storage Keys
const HI_KEY = 'piRunnerHi';
const RUNS_KEY = 'piRunnerRuns';
const BANK_KEY = 'piRunnerBank';
const HATS_KEY = 'piRunnerHats';
const ACTIVE_HAT_KEY = 'piRunnerActiveHat';
const CHICKEN_KEY = 'piRunnerChicken';
const TOP5_KEY = 'piRunnerTop5';
const BADGES_KEY = 'piRunnerBadges';
const THEME_KEY = 'piRunnerTheme';
const AUDIO_KEY = 'piRunnerAudio';
const BEZEL_KEY = 'piRunnerBezel';

// ---------- the 5 chickens (rooster roster) ----------
const CHICKENS = [
  {
    id: 'cluck',
    name: 'PI-CLUCK',
    title: 'THE ORIGINAL HEN',
    desc: 'BALANCED, PLUCKY, AND READY TO MARATHON.'
  },
  {
    id: 'rex',
    name: 'ROOSTER REX',
    title: 'THE MAJESTIC KING',
    desc: 'STRUTS WITH SWAGGER. GIANT COMB & FLOWING TAIL.'
  },
  {
    id: 'chubby',
    name: 'CHUBBY CHICK',
    title: 'THE ROUND FLUFFBALL',
    desc: '90% FLUFF, 10% CHICKEN. ROTUND SPHERE OF DETERMINATION.'
  },
  {
    id: 'mecha',
    name: 'MECHA-PI',
    title: 'CYBERNETIC UNIT 3.14',
    desc: 'TITANIUM BEAK & VISOR. ZERO ORGANIC LAG.'
  },
  {
    id: 'shinobi',
    name: 'SHINOBI HEN',
    title: 'THE SHADOW PEK',
    desc: 'SILENT AS A FEATHER. DASHES THROUGH THE SHADOWS.'
  }
];
let activeChicken = 0;
let rosterSelect = 0;
try {
  activeChicken = parseInt(localStorage.getItem(CHICKEN_KEY) || '0', 10) || 0;
  if (activeChicken < 0 || activeChicken >= CHICKENS.length) activeChicken = 0;
  rosterSelect = activeChicken;
} catch (e) {}
function saveChicken() {
  try { localStorage.setItem(CHICKEN_KEY, String(activeChicken)); } catch (e) {}
}

const cv = document.getElementById('game');
const ctx = cv.getContext('2d', { willReadFrequently: true });
ctx.imageSmoothingEnabled = false;

// ---------- 5x7 bitmap font (expanded glyph set) ----------
const GLYPHS = {
'A':['01110','10001','10001','11111','10001','10001','10001'],
'B':['11110','10001','10001','11110','10001','10001','11110'],
'C':['01110','10001','10000','10000','10000','10001','01110'],
'D':['11110','10001','10001','10001','10001','10001','11110'],
'E':['11111','10000','10000','11110','10000','10000','11111'],
'F':['11111','10000','10000','11110','10000','10000','10000'],
'G':['01110','10001','10000','10111','10001','10001','01110'],
'H':['10001','10001','10001','11111','10001','10001','10001'],
'I':['11111','00100','00100','00100','00100','00100','11111'],
'J':['00111','00010','00010','00010','00010','10010','01100'],
'K':['10001','10010','10100','11000','10100','10010','10001'],
'L':['10000','10000','10000','10000','10000','10000','11111'],
'M':['10001','11011','10101','10101','10001','10001','10001'],
'N':['10001','11001','10101','10011','10001','10001','10001'],
'O':['01110','10001','10001','10001','10001','10001','01110'],
'P':['11110','10001','10001','11110','10000','10000','10000'],
'Q':['01110','10001','10001','10001','10101','10010','01101'],
'R':['11110','10001','10001','11110','10100','10010','10001'],
'S':['01111','10000','10000','01110','00001','00001','11110'],
'T':['11111','00100','00100','00100','00100','00100','00100'],
'U':['10001','10001','10001','10001','10001','10001','01110'],
'V':['10001','10001','10001','10001','10001','01010','00100'],
'W':['10001','10001','10101','10101','10101','11011','10001'],
'X':['10001','10001','01010','00100','01010','10001','10001'],
'Y':['10001','10001','01010','00100','00100','00100','00100'],
'Z':['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10001','10001','10001','10001','10001','01110'],
'1':['00100','01100','00100','00100','00100','00100','01110'],
'2':['01110','10001','00001','00010','00100','01000','11111'],
'3':['11111','00010','00100','00010','00001','10001','01110'],
'4':['00010','00110','01010','10010','11111','00010','00010'],
'5':['11111','10000','11110','00001','00001','10001','01110'],
'6':['00110','01000','10000','11110','10001','10001','01110'],
'7':['11111','00001','00010','00100','01000','01000','01000'],
'8':['01110','10001','10001','01110','10001','10001','01110'],
'9':['01110','10001','10001','01111','00001','00010','01100'],
' ':['00000','00000','00000','00000','00000','00000','00000'],
'!':['00100','00100','00100','00100','00100','00000','00100'],
'?':['01110','10001','00010','00100','00100','00000','00100'],
'+':['00000','00100','00100','11111','00100','00100','00000'],
'-':['00000','00000','00000','11111','00000','00000','00000'],
'*':['00000','10101','01110','11111','01110','10101','00000'],
'/':['00001','00010','00010','00100','01000','01000','10000'],
'.':['00000','00000','00000','00000','00000','00110','00110'],
':':['00000','00110','00110','00000','00110','00110','00000'],
',':['00000','00000','00000','00000','00110','00010','00100'],
'(':['00010','00100','01000','01000','01000','00100','00010'],
')':['01000','00100','00010','00010','00010','00100','01000'],
'[':['01110','01000','01000','01000','01000','01000','01110'],
']':['01110','00010','00010','00010','00010','00010','01110'],
'<':['00010','00100','01000','10000','01000','00100','00010'],
'>':['01000','00100','00010','00001','00010','00100','01000'],
'=':['00000','11111','00000','11111','00000','00000','00000'],
'%':['11001','11010','00100','00100','01011','10011','00000'],
'#':['01010','11111','01010','01010','11111','01010','00000'],
'\'':['00110','00110','00100','00000','00000','00000','00000'],
'"':['01010','01010','01010','00000','00000','00000','00000'],
'▲':['00100','01110','01110','11111','11111','11111','00000'],
'▼':['00000','11111','11111','11111','01110','01110','00100'],
'★':['00100','10101','01110','11111','01110','10001','00000'],
'■':['11111','11111','11111','11111','11111','11111','11111'],
'□':['11111','10001','10001','10001','10001','10001','11111'],
'x':['00000','10001','01010','00100','01010','10001','00000']
};

function textW(str, scale, gap) { return str.length * (5 * scale + gap) - gap; }
function drawText(str, x, y, scale, color, opts) {
  opts = opts || {};
  const gap = opts.gap == null ? scale : opts.gap;
  const align = opts.align || 'left';
  const outline = opts.outline;
  const w = textW(str, scale, gap);
  const x0 = align === 'center' ? Math.round(x - w / 2) : align === 'right' ? Math.round(x - w) : x;
  const pass = (ox, oy, fill) => {
    ctx.fillStyle = fill;
    let sx = x0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const g = GLYPHS[ch] || GLYPHS[ch.toUpperCase()] || GLYPHS['?'];
      if (g) for (let r = 0; r < 7; r++) {
        const row = g[r];
        for (let c = 0; c < 5; c++) if (row[c] !== '0') ctx.fillRect(sx + c * scale + ox, y + r * scale + oy, scale, scale);
      }
      sx += 5 * scale + gap;
    }
  };
  const k = Math.max(2, Math.round(scale * 0.7));
  if (outline) { pass(-k, 0, outline); pass(k, 0, outline); pass(0, -k, outline); pass(0, k, outline); }
  pass(0, 0, color);
  return w;
}
const pad5 = n => String(Math.min(Math.max(n, 0), 999999)).padStart(5, '0');

// ---------- helpers ----------
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function rgb(c) { return 'rgb(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ')'; }
const box = (x, y, w, h) => ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));

// Haptic feedback
function vibrate(pat) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pat); } catch (e) {}
  }
}

// Toast popup
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('toast-hidden');
  if (typeof clearTimeout === 'function') clearTimeout(toastTimer);
  else if (typeof window !== 'undefined' && typeof window.clearTimeout === 'function') window.clearTimeout(toastTimer);
  const st = typeof setTimeout === 'function' ? setTimeout : typeof window !== 'undefined' ? window.setTimeout : null;
  if (st) toastTimer = st(() => { el.classList.add('toast-hidden'); }, 2200);
}

// ---------- audio subsystem (SFX + dynamic tempo chiptune) ----------
const audio = {
  mode: 0,                 // 0: ALL (Music+SFX) | 1: SFX ONLY | 2: MUTED
  ac: null, master: null, mg: null,
  step: 0, nextT: 0,
  bpm: 130,
  chords: [
    [220.00, 261.63, 329.63, 440.00],   // Am
    [174.61, 220.00, 261.63, 349.23],   // F
    [261.63, 329.63, 392.00, 523.25],   // C
    [196.00, 246.94, 293.66, 392.00]    // G
  ],
  arp: [0, 1, 2, 3, 2, 1, 2, 3],

  ensure() {
    if (!this.ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.master.gain.value = this.mode === 2 ? 0 : 0.55;
      this.master.connect(this.ac.destination);
      this.mg = this.ac.createGain();
      this.mg.gain.value = this.mode === 0 ? 0.35 : 0;
      this.mg.connect(this.master);
    }
    if (this.ac.state === 'suspended') this.ac.resume();
    return true;
  },

  cycleMode() {
    this.mode = (this.mode + 1) % 3;
    try { localStorage.setItem(AUDIO_KEY, String(this.mode)); } catch (e) {}
    if (this.master) this.master.gain.value = this.mode === 2 ? 0 : 0.55;
    if (this.mg) this.mg.gain.value = this.mode === 0 ? 0.35 : 0;
    this.updateDomBtn();
    if (this.mode !== 2) this.click();
  },

  updateDomBtn() {
    const btn = document.getElementById('btn-audio');
    if (!btn) return;
    btn.textContent = this.mode === 0 ? '🔊 ALL' : this.mode === 1 ? '🎵 SFX' : '🔇 OFF';
  },

  tone(f0, f1, dur, type, vol, delay, bus) {
    if (this.mode === 2 || !this.ensure()) return;
    const t0 = this.ac.currentTime + (delay || 0);
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || this.master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  },

  noise(dur, vol, freq) {
    if (this.mode === 2 || !this.ensure()) return;
    const t0 = this.ac.currentTime;
    const n = Math.max(1, Math.floor(this.ac.sampleRate * dur));
    const buf = this.ac.createBuffer(1, n, this.ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ac.createBufferSource(); src.buffer = buf;
    const f = this.ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  },

  jump()     { this.tone(300, 750, 0.13, 'square', 0.09); },
  land()     { this.tone(140, 90, 0.07, 'square', 0.05); },
  thud()     { this.tone(160, 55, 0.22, 'triangle', 0.16); this.noise(0.16, 0.08, 300); },
  slide()    { this.noise(0.18, 0.05, 1400); },
  ding()     { this.tone(988, 988, 0.06, 'square', 0.05); this.tone(1319, 1319, 0.09, 'square', 0.05, 0.07); },
  pickup()   { this.tone(1100, 1100, 0.05, 'square', 0.06); this.tone(1650, 1650, 0.09, 'square', 0.05, 0.05); },
  start()    { this.tone(500, 900, 0.1, 'square', 0.07); },
  die()      { this.tone(420, 70, 0.5, 'sawtooth', 0.12); this.noise(0.25, 0.06, 600); },
  blip()     { this.tone(700, 700, 0.03, 'square', 0.03); },
  click()    { this.tone(600, 1000, 0.05, 'square', 0.05); },
  streak(n)  {
    const base = 880 + Math.min(n, 5) * 120;
    this.tone(base, base * 1.25, 0.08, 'square', 0.07);
  },
  nearMiss() { this.tone(1200, 400, 0.1, 'sawtooth', 0.05); },
  fanfare()  {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => this.tone(f, f, 0.14, 'square', 0.08, i * 0.1));
  },
  buy()      {
    this.tone(800, 1200, 0.06, 'square', 0.07);
    this.tone(1600, 1600, 0.12, 'square', 0.08, 0.07);
  },

  tick() {
    if (this.mode !== 0 || !this.ac || this.ac.state !== 'running') return;
    const now = this.ac.currentTime;
    if (this.nextT < now) this.nextT = now + 0.06;
    const eighth = 60 / this.bpm / 2;
    let guard = 0;
    while (this.nextT < now + 0.25 && guard++ < 40) {
      const bar = Math.floor(this.step / 8) % 4;
      const i = this.step % 8;
      const chord = this.chords[bar];
      this.note(chord[this.arp[i]], this.nextT, 0.18, 'square', 0.11);
      if (i % 4 === 0) this.note(chord[0] / 2, this.nextT, 0.22, 'triangle', 0.2);
      if (i === 6 && bar % 2 === 1) this.note(chord[3] * 2, this.nextT, 0.1, 'square', 0.05);
      this.step = (this.step + 1) % 32;
      this.nextT += eighth;
    }
  },

  note(f, t, dur, type, vol) {
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.mg);
    o.start(t); o.stop(t + dur + 0.03);
  }
};

try {
  const am = localStorage.getItem(AUDIO_KEY);
  if (am !== null) audio.mode = parseInt(am, 10) || 0;
} catch (e) {}

// ---------- cosmetic hats system (1-bit pixel hats) ----------
const HATS = [
  { id: 'none',   name: 'NONE',         cost: 0,   desc: 'CLASSIC BAREHEAD' },
  { id: 'grad',   name: 'GRAD CAP',     cost: 20,  desc: 'ACADEMIC EXCELLENCE' },
  { id: 'crown',  name: 'EGG CROWN',    cost: 80,  desc: 'ROYAL HEIR TO THE NEST' },
  { id: 'ribbon', name: 'RIBBON COMB',  cost: 15,  desc: 'CUTE POP OF POLKA' },
  { id: 'viking', name: 'VIKING HELM',  cost: 60,  desc: 'FEATHERED CONQUEROR' },
  { id: 'tophat', name: 'TOP HAT',      cost: 35,  desc: 'DAPPER GENTLECHICKEN' },
  { id: 'chef',   name: 'CHEF TOQUE',   cost: 50,  desc: 'MICHELIN SUNNY-SIDE UP' }
];

let bankEggs = 0;
let unlockedHats = [true, false, false, false, false, false, false];
let activeHat = 0;
let shopSelect = 0;

try {
  bankEggs = parseInt(localStorage.getItem(BANK_KEY) || '0', 10) || 0;
  activeHat = parseInt(localStorage.getItem(ACTIVE_HAT_KEY) || '0', 10) || 0;
  let uh = JSON.parse(localStorage.getItem(HATS_KEY) || '[true]');
  if (Array.isArray(uh)) {
    // Migration: old saves had 8 slots (PIXEL SHADES was index 2) —
    // drop that slot and shift every hat after it one position down.
    if (uh.length > HATS.length) {
      uh = uh.slice(0, 2).concat(uh.slice(3));
      if (activeHat === 2) activeHat = 0;
      else if (activeHat > 2) activeHat--;
      try {
        localStorage.setItem(HATS_KEY, JSON.stringify(uh));
        localStorage.setItem(ACTIVE_HAT_KEY, String(activeHat));
      } catch (e2) {}
    }
    for (let i = 0; i < HATS.length; i++) unlockedHats[i] = !!uh[i];
  }
  if (activeHat < 0 || activeHat >= HATS.length) activeHat = 0;
} catch (e) {}
function saveShopData() {
  try {
    localStorage.setItem(BANK_KEY, String(bankEggs));
    localStorage.setItem(ACTIVE_HAT_KEY, String(activeHat));
    localStorage.setItem(HATS_KEY, JSON.stringify(unlockedHats));
  } catch (e) {}
}

// ---------- hall of fame (local top 5) ----------
let top5 = [];
try {
  top5 = JSON.parse(localStorage.getItem(TOP5_KEY) || '[]');
  if (!Array.isArray(top5)) top5 = [];
} catch (e) {}
function recordScore(dist, eggs) {
  const now = new Date();
  const dStr = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0');
  top5.push({ score: Math.floor(dist), eggs, date: dStr });
  top5.sort((a, b) => b.score - a.score);
  if (top5.length > 5) top5.length = 5;
  try { localStorage.setItem(TOP5_KEY, JSON.stringify(top5)); } catch (e) {}
}

// ---------- retro achievements / badges ----------
const BADGES = [
  { id: 'first_run',    title: 'FIRST FLIGHT', desc: 'COMPLETE YOUR 1ST RUN' },
  { id: 'night_owl',    title: 'NIGHT OWL',    desc: 'SURVIVE INTO THE NIGHT' },
  { id: 'four_seasons', title: 'FOUR SEASONS', desc: 'REACH THE WINTER SNOW' },
  { id: 'egg_magnate',  title: 'EGG MAGNATE',  desc: 'BANK 50 TOTAL EGGS' },
  { id: 'speed_demon',  title: 'SPEED DEMON',  desc: 'EXCEED 750 PX/S VELOCITY' },
  { id: 'close_call',   title: 'CLOSE CALL',   desc: 'SCORE 3 NEAR-MISS DODGES' }
];
let unlockedBadges = [false, false, false, false, false, false];
try {
  const ub = JSON.parse(localStorage.getItem(BADGES_KEY) || '[]');
  if (Array.isArray(ub)) for (let i = 0; i < BADGES.length; i++) unlockedBadges[i] = !!ub[i];
} catch (e) {}

function unlockBadge(idx) {
  if (unlockedBadges[idx]) return;
  unlockedBadges[idx] = true;
  try { localStorage.setItem(BADGES_KEY, JSON.stringify(unlockedBadges)); } catch (e) {}
  audio.fanfare();
  showToast('🏆 UNLOCKED: ' + BADGES[idx].title);
}

// ---------- state & variables ----------
let state = 'menu';           // menu | playing | dead | paused | howtoplay | shop | records | badges
let score = 0, hi = 0, speed = 400, elapsed = 0;
let nightTarget = false;
let season = 0;               // 0: spring | 1: summer | 2: autumn | 3: winter
let groundOff = 0, hillOff = 0;
let clouds = [], skyStars = [], hills = [], picks = [], obstacles = [], parts = [], deathStars = [];
let nextGap = 550, milestone = 0, hiNew = false;
let deathT = 0, shake = 0, flash = 0, time = 0;
let hitstop = 0;                // freeze frames for impact (death / near-miss)
let deathFalling = false;       // death sequence: chicken still dropping to the ground
let deathLanded = false;        // death sequence: butt hit the ground, stars out
let blinkT = 0, nextBlink = 2.5, idleT = 0, duckT = 0;
let stats = { cleared: 0, eggs: 0, top: 0, nearMisses: 0 };
let totals = { runs: 0, eggs: 0 };

// Streak, Danger telegraph & Milestone banner
let eggStreak = 0, eggStreakTimer = 0;
let milestoneBanner = null;     // { text, t }
let floatingTexts = [];         // [{ text, x, y, life, maxLife, scale }]
let curtainT = 0;               // dither wipe transition

// Active Palette
let currentThemeKey = 'mono';
try {
  const st = localStorage.getItem(THEME_KEY);
  if (st && PALETTES[st]) currentThemeKey = st;
} catch (e) {}
let C = { bg: rgb(PALETTES[currentThemeKey].dayBg), fg: rgb(PALETTES[currentThemeKey].dayFg) };

function curBg() { return nightTarget ? PALETTES[currentThemeKey].nightBg : PALETTES[currentThemeKey].dayBg; }
function curFg() { return nightTarget ? PALETTES[currentThemeKey].nightFg : PALETTES[currentThemeKey].dayFg; }

function applyTheme(key) {
  if (!PALETTES[key]) key = 'mono';
  currentThemeKey = key;
  try { localStorage.setItem(THEME_KEY, key); } catch (e) {}
  document.body.className = document.body.className
    .replace(/theme-[a-z0-9]+/g, '')
    .trim() + ' ' + PALETTES[key].cssClass;
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = '🎨 ' + PALETTES[key].name;
}
applyTheme(currentThemeKey);

try { hi = parseInt(localStorage.getItem(HI_KEY) || '0', 10) || 0; } catch (e) { hi = 0; }
try {
  const t = (localStorage.getItem(RUNS_KEY) || '0:0').split(':');
  totals.runs = parseInt(t[0], 10) || 0; totals.eggs = parseInt(t[1], 10) || 0;
} catch (e) {}
function saveTotals() { try { localStorage.setItem(RUNS_KEY, totals.runs + ':' + totals.eggs); } catch (e) {} }

const player = {
  x: 90, y: GROUND - STAND_H, vy: 0, onGround: true,
  ducking: false, frame: 0, animT: 0, buffer: 0
};
let duckHeld = false;

// ---------- blocky cloud templates ----------
function cloudPixels(rects) {
  const set = new Set(), key = (a, b) => a + ',' + b;
  for (const [rx, ry, rw, rh] of rects)
    for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) set.add(key(x, y));
  const edge = [], inner = [];
  let maxX = 0, maxY = 0;
  for (const k of set) {
    const [x, y] = k.split(',').map(Number);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    const nb = [[1,0],[-1,0],[0,1],[0,-1]].every(([dx, dy]) => set.has(key(x + dx, y + dy)));
    (nb ? inner : edge).push([x, y]);
  }
  return { edge, inner, w: maxX + 1, h: maxY + 1 };
}
const CLOUD_TPL = [
  cloudPixels([[0, 10, 30, 8], [5, 5, 19, 5], [9, 1, 10, 4]]),
  cloudPixels([[0, 6, 20, 6], [4, 2, 11, 4]])
];
for (let i = 0; i < 4; i++)
  clouds.push({ x: rand(0, W), y: rand(20, 140), t: (Math.random() * 2) | 0, s: 2 });
for (let i = 0; i < 60; i++)
  skyStars.push({ x: rand(0, W), y: rand(8, GROUND - 60), p: rand(0, 6.3), big: Math.random() < 0.3 });

// ---------- seasonal cosmetic fall-effect particles ----------
const wrp = (v, m) => ((v % m) + m) % m;
const petals = [], leaves = [], flakes = [];
for (let i = 0; i < 16; i++)
  petals.push({ x: rand(0, W), y: rand(0, GROUND), v: rand(16, 34), h: rand(8, 20), ph: rand(0, 6.3) });
for (let i = 0; i < 14; i++)
  leaves.push({ x: rand(0, W), y: rand(0, GROUND), v: rand(28, 52), h: rand(24, 54), ph: rand(0, 6.3), r: rand(0, 6.3) });
for (let i = 0; i < 26; i++)
  flakes.push({ x: rand(0, W), y: rand(0, GROUND), v: rand(20, 46), h: rand(4, 14), ph: rand(0, 6.3), big: Math.random() < 0.35 });

// ---------- parallax hills ----------
const HILL_TILE = 1600, HILLS = [];
{
  let hx = 0;
  while (hx < HILL_TILE) {
    const w = 60 + ((Math.random() * 140) | 0);
    HILLS.push({ x: hx, w, h: 34 + ((Math.random() * 56) | 0) });
    hx += w;
  }
}

// ---------- 1-bit dither fill ----------
const ditherPats = {};
function ditherRect(pal, x, y, w, h, dense) {
  const key = pal.fg + (dense ? '|50' : '|25');
  let pat = ditherPats[key];
  if (!pat) {
    const pc = document.createElement('canvas');
    pc.width = pc.height = 4;
    const g = pc.getContext('2d');
    g.fillStyle = pal.fg;
    if (dense) {
      for (let py = 0; py < 4; py++) for (let px = 0; px < 4; px++)
        if ((px + py) % 2 === 0) g.fillRect(px, py, 1, 1);
    } else {
      g.fillRect(0, 0, 1, 1); g.fillRect(2, 2, 1, 1);
    }
    pat = ctx.createPattern(pc, 'repeat');
    ditherPats[key] = pat;
  }
  ctx.fillStyle = pat;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.fillStyle = pal.fg;
}

// ---------- hat anchor points (per chicken & pose, in sprite units) ----------
// cx/top = centre & top of the head crest (regular hats rest on it),
// bob = head shifts +1 unit forward on run stride 0 (ChubbyChick is a ball: no bob).
const HAT_ANCHORS = [
  // 0: PI-CLUCK
  { bob: true,  run:  { cx: 10, top: 2,  ex: 11, ey: 4 }, jump: { cx: 10, top: 2,  ex: 11, ey: 4 },
                   duck:  { cx: 17, top: 0,  ex: 17, ey: 4 }, peck: { cx: 14, top: 3,  ex: 14, ey: 7 },
                   dead:  { cx: 10, top: 2,  ex: 11, ey: 4 } },
  // 1: ROOSTER REX
  { bob: true,  run:  { cx: 10, top: 2,  ex: 11, ey: 4 }, jump: { cx: 10, top: 2,  ex: 11, ey: 4 },
                   duck:  { cx: 17, top: -1, ex: 17, ey: 4 }, peck: { cx: 15, top: 2,  ex: 15, ey: 8 },
                   dead:  { cx: 9,  top: 2,  ex: 11, ey: 4 } },
  // 2: CHUBBY CHICK (round fluffball)
  { bob: false, run:  { cx: 9,  top: 2,  ex: 12, ey: 7 }, jump: { cx: 9,  top: 2,  ex: 12, ey: 7 },
                   duck:  { cx: 10, top: 7,  ex: 14, ey: 9 }, peck: { cx: 9,  top: 6,  ex: 13, ey: 11 },
                   dead:  { cx: 8,  top: 2,  ex: 12, ey: 6 } },
  // 3: MECHA-PI
  { bob: true,  run:  { cx: 10, top: 2,  ex: 12, ey: 5 }, jump: { cx: 10, top: 2,  ex: 12, ey: 5 },
                   duck:  { cx: 17, top: 2,  ex: 17, ey: 4 }, peck: { cx: 14, top: 5,  ex: 14, ey: 7 },
                   dead:  { cx: 10, top: 2,  ex: 12, ey: 5 } },
  // 4: SHINOBI HEN
  { bob: true,  run:  { cx: 10, top: 2,  ex: 12, ey: 5 }, jump: { cx: 10, top: 2,  ex: 12, ey: 5 },
                   duck:  { cx: 17, top: 2,  ex: 16, ey: 4 }, peck: { cx: 14, top: 5,  ex: 14, ey: 7 },
                   dead:  { cx: 10, top: 2,  ex: 12, ey: 5 } }
];

// ---------- hats renderer (pure 1-bit whole-pixel) ----------
function drawHat(pal, hatIdx, chickenX, chickenY, mode, frame, chickenIdx) {
  if (hatIdx <= 0 || hatIdx >= HATS.length) return;
  if (chickenIdx === undefined) chickenIdx = activeChicken;
  const s = S;
  const cx = Math.round(chickenX), cy = Math.round(chickenY);
  const R = (rx, ry, rw, rh) => box(cx + rx * s, cy + ry * s, rw * s, rh * s);

  // Anchor the hat to the real head geometry of this chicken & pose
  const ch = HAT_ANCHORS[chickenIdx] || HAT_ANCHORS[0];
  const a = ch[mode] || ch.run;
  const bob = (mode === 'run' && frame === 0 && ch.bob) ? 1 : 0;
  const hx = a.cx - 10 + bob;      // hat art was drawn around (0, 0) = PiCluck's head
  const hy = a.top - 2;

  ctx.fillStyle = pal.fg;
  switch (hatIdx) {
    case 1: // Graduate Cap
      R(hx + 3, hy - 3, 13, 2);      // mortarboard plate
      R(hx + 6, hy - 1, 7, 3);       // skullcap
      ctx.fillStyle = pal.bg;
      R(hx + 9, hy - 3, 1, 1);       // button buttonhole
      ctx.fillStyle = pal.fg;
      R(hx + 4, hy - 1, 1, 4);       // tassel dangle
      R(hx + 3, hy + 3, 2, 2);       // tassel fringe
      break;

    case 2: // Egg Crown
      R(hx + 6, hy - 1, 9, 3);       // base
      R(hx + 6, hy - 3, 2, 2);       // left spike
      R(hx + 9, hy - 4, 3, 3);       // middle spike
      R(hx + 13, hy - 3, 2, 2);      // right spike
      ctx.fillStyle = pal.bg;
      R(hx + 8, hy, 1, 1);           // crown jewel 1
      R(hx + 10, hy, 1, 1);          // jewel 2
      R(hx + 12, hy, 1, 1);          // jewel 3
      ctx.fillStyle = pal.fg;
      break;

    case 3: // Ribbon Comb
      R(hx + 6, hy - 1, 3, 3);       // left bow
      R(hx + 11, hy - 1, 3, 3);      // right bow
      R(hx + 9, hy, 2, 2);           // center knot
      ctx.fillStyle = pal.bg;
      R(hx + 7, hy, 1, 1);
      R(hx + 12, hy, 1, 1);
      ctx.fillStyle = pal.fg;
      break;

    case 4: // Viking Helm
      R(hx + 6, hy - 1, 9, 3);       // iron dome
      R(hx + 4, hy - 3, 2, 3);       // left horn base
      R(hx + 3, hy - 5, 2, 3);       // left horn tip
      R(hx + 15, hy - 3, 2, 3);      // right horn base
      R(hx + 16, hy - 5, 2, 3);      // right horn tip
      ctx.fillStyle = pal.bg;
      R(hx + 8, hy, 1, 1);           // rivet
      R(hx + 12, hy, 1, 1);
      ctx.fillStyle = pal.fg;
      break;

    case 5: // Top Hat
      R(hx + 4, hy, 13, 2);          // wide brim
      R(hx + 7, hy - 6, 7, 6);       // cylinder crown
      ctx.fillStyle = pal.bg;
      R(hx + 7, hy - 1, 7, 1);       // silk band ribbon
      ctx.fillStyle = pal.fg;
      break;

    case 6: // Chef Toque
      R(hx + 7, hy, 7, 2);           // brim band
      R(hx + 5, hy - 6, 11, 6);      // puffy dome
      ctx.fillStyle = pal.bg;
      R(hx + 7, hy - 4, 1, 3);       // crease pleat 1
      R(hx + 10, hy - 5, 1, 4);      // pleat 2
      R(hx + 13, hy - 4, 1, 3);      // pleat 3
      ctx.fillStyle = pal.fg;
      break;
  }
}

// ---------- 5 unique chicken sprites (pure 1-bit pixel art) ----------

// 0: PI-CLUCK (The Classic Farmyard Hen — anatomically corrected)
function drawPiCluck(pal, x, yTop, mode, frame, blinkOn) {
  const r = (ux, uy, uw, uh) => box(Math.round(x) + ux * S, Math.round(yTop) + uy * S, uw * S, uh * S);
  ctx.fillStyle = pal.fg;

  if (mode === 'peck') {
    r(0, 1, 3, 5); r(1, 4, 3, 4);                     // stepped tail high in the air
    r(3, 3, 10, 6); r(13, 3, 2, 2);                    // body & comb
    r(12, 5, 5, 4);                                    // head dropped low
    r(16, 9, 3, 2);                                    // beak at dirt
    ctx.fillStyle = pal.bg; r(13, 6, 2, 2);            // eye
    ctx.fillStyle = pal.fg; r(5, 9, 3, 3); r(9, 9, 3, 3); // legs
    return;
  }
  if (mode === 'dead') {
    // SITTING: butt on the ground (y=11 = ground line), legs stretched forward, dizzy X eye
    r(8, 0, 2, 2); r(10, -1, 3, 2); r(13, 0, 2, 2);    // comb peaks
    r(8, 1, 7, 2);                                      // comb base
    r(7, 2, 8, 5);                                      // head y2..6
    r(15, 4, 4, 2); r(18, 5, 2, 1);                     // beak
    r(14, 7, 3, 2);                                     // wattle (chin hangs onto body)
    ctx.fillStyle = pal.bg; r(9, 3, 4, 4);              // eye socket
    ctx.fillStyle = pal.fg;
    r(9, 3, 1, 1); r(12, 3, 1, 1);                      // X eye
    r(10, 4, 2, 2);
    r(9, 6, 1, 1); r(12, 6, 1, 1);
    r(3, 6, 11, 6);                                     // slumped body y6..11, butt on ground
    r(0, 7, 4, 5);                                      // tail propped behind
    ctx.fillStyle = pal.bg; r(6, 8, 5, 3);              // wing draped
    ctx.fillStyle = pal.fg;
    r(13, 9, 7, 1);                                     // far leg
    r(13, 10, 8, 2);                                    // near leg y10..11
    r(21, 9, 2, 3);                                     // foot, toes up
    return;
  }
  if (mode === 'duck') {
    r(3, 4, 14, 7);                                    // low streamlined body
    r(14, 2, 6, 5);                                    // stretched head
    r(19, 4, 4, 2);                                    // sharp beak
    r(14, 0, 4, 2);                                    // flattened comb
    r(16, 7, 2, 2);                                    // wattle
    r(1, 3, 4, 4);                                     // tail
    ctx.fillStyle = pal.bg; r(16, 3, 2, 2);            // eye
    r(7, 6, 6, 2);                                     // wing
    ctx.fillStyle = pal.fg; r(5, 11, 3, 1); r(10, 11, 3, 1); // tucked feet
    return;
  }

  // Running & Jumping: signature chicken head-bobbing gait!
  const hx = (mode === 'run' && frame === 0) ? 1 : 0; // head bob forward on stride 0

  // Triple-Spike Comb
  r(hx + 7, 0, 2, 2); r(hx + 9, -1, 3, 2); r(hx + 13, 0, 2, 2); // 3 crest peaks
  r(hx + 7, 1, 8, 2);                                            // comb base

  // Head & Face
  r(hx + 6, 2, 8, 6);                                            // head
  r(hx + 14, 4, 4, 3); r(hx + 18, 5, 2, 1);                      // tapered beak wedge
  ctx.fillStyle = pal.bg;
  r(hx + 14, 5, 4, 1);                                           // sharp mouth slit
  r(hx + 10, 3, 2, 2);                                           // forward alert eye
  ctx.fillStyle = pal.fg;
  if (!blinkOn) r(hx + 11, 4, 1, 1); else r(hx + 10, 4, 2, 1);  // eye pupil / blink

  // Fleshy Wattle under chin
  r(hx + 13, 7, 3, 3); r(hx + 14, 10, 2, 1);

  // Body: Plump Proud Breast & Perky Fanned Tail
  r(6, 7, 7, 3);                                                 // neck
  r(13, 9, 3, 6);                                                // proud bulging breast
  r(3, 10, 11, 6); r(4, 16, 9, 2);                              // plump body & belly

  // Fanned Stepped Tail Plumes
  r(0, 5, 3, 6); r(1, 8, 3, 5); r(2, 12, 3, 4);
  ctx.fillStyle = pal.bg; r(1, 7, 1, 3); ctx.fillStyle = pal.fg; // plume quill notch

  // Animated Flapping Wing
  if (mode === 'jump') {
    if (frame === 0) {
      ctx.fillStyle = pal.bg; r(4, 7, 8, 5);           // wings beat up
      ctx.fillStyle = pal.fg; r(5, 8, 6, 3);
    } else {
      ctx.fillStyle = pal.bg; r(4, 10, 8, 5);          // wings beat down
      ctx.fillStyle = pal.fg; r(5, 11, 6, 3);
    }
  } else if (frame === 0) {
    ctx.fillStyle = pal.bg; r(5, 11, 7, 4);                      // stride 0: tucked wing
    ctx.fillStyle = pal.fg; r(6, 12, 5, 2);
  } else {
    ctx.fillStyle = pal.bg; r(4, 9, 7, 4);                       // stride 1: wing fluttered up
    ctx.fillStyle = pal.fg; r(5, 10, 5, 2);
  }

  // Slender Shanks & 3-Toed Claws
  ctx.fillStyle = pal.fg;
  if (mode === 'jump') {
    r(4, 18, 3, 2); r(3, 20, 4, 1); r(8, 18, 3, 2); r(8, 20, 4, 1); // tucked jump feet
  } else if (frame === 0) {
    r(10, 17, 3, 2); r(11, 19, 2, 2); r(9, 21, 5, 1);           // forward foot with claw
    r(4, 17, 3, 2);  r(3, 19, 2, 2);  r(2, 21, 5, 1);           // back foot
  } else {
    r(4, 17, 3, 2);  r(5, 19, 2, 2);  r(3, 21, 5, 1);           // forward stride
    r(10, 17, 3, 2); r(9, 19, 2, 2);  r(8, 21, 5, 1);
  }
}

// 1: ROOSTER REX (The Majestic King Rooster — giant comb, sickle tail plumes, neck ruff)
function drawRoosterRex(pal, x, yTop, mode, frame, blinkOn) {
  const r = (ux, uy, uw, uh) => box(Math.round(x) + ux * S, Math.round(yTop) + uy * S, uw * S, uh * S);
  ctx.fillStyle = pal.fg;

  if (mode === 'peck') {
    r(0, 0, 4, 8); r(2, 4, 3, 5);                      // giant sickle tail towering high
    r(4, 4, 10, 6); r(14, 2, 3, 3);                    // body & crown
    r(13, 6, 5, 4); r(17, 10, 4, 2);                   // head & hooked beak
    ctx.fillStyle = pal.bg; r(14, 7, 2, 2);
    ctx.fillStyle = pal.fg; r(6, 10, 3, 2); r(10, 10, 3, 2);
    return;
  }
  if (mode === 'dead') {
    // SITTING ROYALTY: butt down, giant comb, long wattle, X eye
    r(5, -2, 2, 4); r(8, -4, 3, 6); r(12, -3, 3, 5); r(15, -1, 2, 3);
    r(5, 1, 12, 2);                                     // crown comb base
    r(6, 2, 8, 5);                                      // head y2..6
    r(14, 4, 4, 3); r(17, 6, 3, 2);                     // hooked beak
    r(13, 7, 3, 4); r(14, 10, 2, 1);                    // long double wattle
    ctx.fillStyle = pal.bg; r(8, 3, 4, 4);              // eye socket
    ctx.fillStyle = pal.fg;
    r(8, 3, 1, 1); r(11, 3, 1, 1);                      // X eye
    r(9, 4, 2, 2);
    r(8, 6, 1, 1); r(11, 6, 1, 1);
    r(3, 6, 11, 6);                                     // slumped body, butt on ground
    r(0, 5, 4, 6); r(1, 9, 3, 3);                       // sickle tail propped behind
    ctx.fillStyle = pal.bg; r(5, 8, 5, 3);              // wing
    ctx.fillStyle = pal.fg;
    r(13, 9, 7, 1);                                     // far drumstick
    r(13, 10, 8, 2);                                    // near drumstick y10..11
    r(21, 9, 2, 3);                                     // heel spur claw
    return;
  }
  if (mode === 'duck') {
    r(3, 4, 14, 7); r(14, 2, 6, 5); r(20, 4, 4, 2);
    r(13, -1, 5, 3);                                   // swept comb
    r(16, 7, 3, 3);                                    // long wattle
    r(0, 2, 4, 6);                                     // arched tail
    ctx.fillStyle = pal.bg; r(16, 3, 2, 2); r(7, 6, 6, 2);
    ctx.fillStyle = pal.fg; r(5, 11, 3, 1); r(10, 11, 3, 1);
    return;
  }

  const hx = (mode === 'run' && frame === 0) ? 1 : 0;

  // Regal 4-Crown Comb Spikes (Towers high!)
  r(hx + 5, -2, 2, 4); r(hx + 8, -4, 3, 6); r(hx + 12, -3, 2, 5); r(hx + 15, -1, 2, 3);
  r(hx + 5, 1, 12, 2);

  // Fierce Head & Hooked Beak
  r(hx + 6, 2, 8, 6);
  r(hx + 14, 3, 4, 4); r(hx + 18, 5, 2, 2);
  ctx.fillStyle = pal.bg; r(hx + 14, 5, 4, 1);         // beak slit
  r(hx + 10, 3, 2, 2);                                 // eye socket
  ctx.fillStyle = pal.fg;
  r(hx + 9, 2, 4, 1);                                  // fierce warrior brow
  if (!blinkOn) r(hx + 11, 4, 1, 1);

  // Deep Hanging Double Wattle
  r(hx + 13, 7, 3, 5); r(hx + 14, 12, 2, 1);

  // Sawtooth Feathered Neck Ruff (Mane)
  r(6, 7, 8, 4); r(5, 9, 2, 3); r(13, 9, 3, 6);

  // Massive Arched Sickle Tail Plumes (Rooster Glory!)
  r(0, 1, 3, 5); r(1, 0, 3, 3); r(2, 2, 2, 4);        // sickle plume top arch
  r(0, 5, 4, 8); r(1, 11, 3, 4);

  // Body & Wing
  r(3, 10, 11, 6); r(4, 16, 9, 2);
  ctx.fillStyle = pal.bg; r(frame ? 4 : 5, frame ? 9 : 11, 7, 4);
  ctx.fillStyle = pal.fg; r(frame ? 5 : 6, frame ? 10 : 12, 5, 2);

  // Powerful Drumsticks with Heel Spur Claws
  if (mode === 'jump') {
    r(4, 18, 3, 2); r(3, 20, 4, 1); r(8, 18, 3, 2); r(8, 20, 4, 1);
  } else if (frame === 0) {
    r(10, 17, 3, 3); r(11, 20, 2, 2); r(9, 21, 5, 1);
    r(4, 17, 3, 3);  r(3, 20, 2, 2);  r(2, 21, 5, 1); r(1, 19, 2, 2); // sharp heel spur!
  } else {
    r(4, 17, 3, 3);  r(5, 20, 2, 2);  r(3, 21, 5, 1);
    r(10, 17, 3, 3); r(9, 20, 2, 2);  r(8, 21, 5, 1); r(7, 19, 2, 2); // sharp heel spur!
  }
}

// 2: CHUBBY CHICK (The Round Fluffball — rotund orb, big cute eyes, tiny fluttering wings)
function drawChubbyChick(pal, x, yTop, mode, frame, blinkOn) {
  const r = (ux, uy, uw, uh) => box(Math.round(x) + ux * S, Math.round(yTop) + uy * S, uw * S, uh * S);
  ctx.fillStyle = pal.fg;

  if (mode === 'peck') {
    r(2, 6, 14, 10); r(15, 13, 3, 2);                  // rolling ball pecking
    ctx.fillStyle = pal.bg; r(12, 10, 3, 3);
    ctx.fillStyle = pal.fg; r(6, 16, 2, 2); r(10, 16, 2, 2);
    return;
  }
  if (mode === 'dead') {
    // SITTING FLUFFBALL: round body puddled on the ground, legs out, X eye
    r(5, 1, 6, 2); r(3, 3, 10, 2);                      // ball top (head merged)
    r(8, 0, 2, 2); r(10, 1, 2, 1);                      // sprout comb bud
    r(1, 5, 14, 6);                                     // wide body y5..10
    r(3, 11, 11, 1);                                    // bottom row flat on ground
    r(0, 6, 2, 3);                                      // tail puff behind
    ctx.fillStyle = pal.bg; r(9, 4, 5, 4);              // big eye socket
    ctx.fillStyle = pal.fg;
    r(9, 4, 1, 1); r(13, 4, 1, 1);                      // X eye
    r(10, 5, 3, 2);
    r(9, 7, 1, 1); r(13, 7, 1, 1);
    r(14, 7, 3, 2); r(16, 8, 1, 1);                     // tiny beak
    ditherRect(pal, Math.round(x) + 4 * S, Math.round(yTop) + 7 * S, 2 * S, 2 * S, true); // rosy cheek
    ctx.fillStyle = pal.fg;
    r(14, 9, 6, 1);                                     // far leg
    r(13, 10, 8, 1);                                    // near leg
    r(13, 11, 8, 1);                                    // on-ground row
    r(21, 9, 2, 2);                                     // webbed foot, toes up
    return;
  }
  if (mode === 'duck') {
    r(2, 7, 16, 8); r(17, 10, 3, 2);                   // flattened pancake chick
    ctx.fillStyle = pal.bg; r(13, 8, 3, 3);
    ctx.fillStyle = pal.fg; r(6, 15, 2, 1); r(10, 15, 2, 1);
    return;
  }

  // Cute Rotund Sphere Silhouette (Head & Body merged into a fluffy ball)
  r(5, 2, 8, 2); r(3, 4, 12, 3); r(2, 7, 14, 8); r(3, 15, 12, 2); r(5, 17, 8, 2);

  // Tiny Cute Sprout Comb Bud
  r(8, 0, 2, 2); r(10, 1, 2, 1);

  // Tiny Ball-Puff Tail
  r(0, 10, 3, 3);

  // Big Anime/Cartoon Eye with Glistening Highlight
  ctx.fillStyle = pal.bg; r(10, 5, 4, 4);
  ctx.fillStyle = pal.fg;
  if (!blinkOn) {
    r(11, 6, 2, 2);                                    // big dark pupil
    ctx.fillStyle = pal.bg; r(12, 6, 1, 1);            // glint shine
    ctx.fillStyle = pal.fg;
  } else {
    r(10, 7, 4, 1);                                    // happy blink arc
  }

  // Tiny Cute Stubby Beak
  r(14, 7, 3, 2); r(17, 8, 1, 1);

  // Rosy Cheek (dithered 1-bit blush)
  ditherRect(pal, Math.round(x) + 8 * S, Math.round(yTop) + 9 * S, 2 * S, 2 * S, true);

  // Tiny Stubby Wings (Heated Fast Flutter!)
  ctx.fillStyle = pal.fg;
  if (mode === 'jump') {
    if (frame === 0) r(3, 5, 4, 4), r(2, 6, 2, 3);    // wings beat high
    else             r(3, 8, 4, 4), r(2, 9, 2, 3);    // wings beat low
  } else if (frame === 1) {
    r(3, 6, 4, 4); r(2, 7, 2, 2);                      // wings lifted high in adorable flutter!
  } else {
    r(4, 9, 4, 3);
  }

  // Short Little Pitter-Patter Feet
  if (frame === 0) {
    r(6, 19, 2, 2); r(5, 21, 4, 1);
    r(10, 19, 2, 2); r(9, 21, 4, 1);
  } else {
    r(7, 19, 2, 2); r(6, 21, 4, 1);
    r(11, 19, 2, 2); r(10, 21, 4, 1);
  }
}

// 3: MECHA-PI (The Cybernetic Android — scanning visor, antenna, armor seams, rocket thruster)
function drawMechaPi(pal, x, yTop, mode, frame, blinkOn) {
  const r = (ux, uy, uw, uh) => box(Math.round(x) + ux * S, Math.round(yTop) + uy * S, uw * S, uh * S);
  ctx.fillStyle = pal.fg;

  if (mode === 'peck') {
    r(0, 1, 4, 6); r(4, 3, 10, 6); r(12, 5, 5, 4); r(16, 9, 3, 2);
    ctx.fillStyle = pal.bg; r(13, 6, 3, 2);
    ctx.fillStyle = pal.fg; r(6, 9, 2, 3); r(10, 9, 2, 3);
    return;
  }
  if (mode === 'dead') {
    // SITTING POWER-DOWN: butt on ground, visor showing an X error, legs out
    r(9, -2, 2, 3); r(8, -3, 4, 1);                    // limp antenna
    r(5, 2, 10, 5);                                    // helmet y2..6
    ctx.fillStyle = pal.bg; r(9, 3, 6, 3);             // dead visor
    ctx.fillStyle = pal.fg;
    r(9, 3, 1, 1); r(14, 3, 1, 1);                     // X error code
    r(10, 4, 1, 1); r(13, 4, 1, 1);
    r(9, 5, 1, 1); r(14, 5, 1, 1);
    r(15, 4, 4, 2); r(18, 5, 2, 1);                    // beak
    r(3, 6, 12, 6);                                    // armored torso y6..11
    r(0, 7, 4, 5);                                     // rocket nozzle behind
    ctx.fillStyle = pal.bg; r(7, 8, 1, 3); r(5, 9, 6, 1); // panel seams
    ctx.fillStyle = pal.fg;
    r(13, 9, 7, 1);                                    // hydraulic leg out
    r(13, 10, 8, 2);                                   // shock pad y10..11
    r(21, 9, 2, 3);                                    // toe plate up
    return;
  }
  if (mode === 'duck') {
    r(3, 4, 14, 7); r(14, 2, 6, 5); r(19, 4, 4, 2);
    r(0, 5, 4, 5);                                     // rocket nozzle
    ctx.fillStyle = pal.bg; r(15, 3, 4, 2);
    ctx.fillStyle = pal.fg; r(5, 11, 3, 1); r(10, 11, 3, 1);
    return;
  }

  const hx = (mode === 'run' && frame === 0) ? 1 : 0;

  // Digital Antenna Mast with Flashing Signal Diode
  r(hx + 9, -2, 2, 4); r(hx + 8, -3, 4, 1);
  if (frame === 1) r(hx + 7, -4, 6, 1);                // sensor pulse

  // Angular Mecha Helmet Chassis
  r(hx + 5, 2, 10, 6);

  // Glowing Horizontal Sensor Visor (Cylon / Robocop Scan!)
  ctx.fillStyle = pal.bg; r(hx + 9, 4, 6, 2);
  ctx.fillStyle = pal.fg;
  r(hx + (frame ? 10 : 13), 4, 2, 2);                  // oscillating sensor diode

  // Titanium Beak with Rivets
  r(hx + 15, 4, 4, 3); r(hx + 18, 5, 2, 1);
  ctx.fillStyle = pal.bg; r(hx + 14, 5, 1, 1); ctx.fillStyle = pal.fg;

  // Armored Torso with Panel Seams
  r(3, 8, 12, 8); r(4, 16, 9, 2);
  ctx.fillStyle = pal.bg;
  r(8, 9, 1, 6); r(5, 12, 8, 1);                       // mechanical panel lines
  ctx.fillStyle = pal.fg;

  // Aerofoil Solar Wing
  ctx.fillStyle = pal.bg; r(frame ? 4 : 5, frame ? 9 : 11, 7, 4);
  ctx.fillStyle = pal.fg; r(frame ? 5 : 6, frame ? 10 : 12, 5, 2);

  // Rocket Engine Thruster Nozzle & Exhaust
  r(0, 8, 4, 6); r(3, 7, 2, 8);
  if (mode === 'jump' || Math.random() < 0.3) {
    box(Math.round(x) - 4 * S, Math.round(yTop) + 10 * S, 3 * S, 2 * S); // exhaust spark
  }

  // Hydraulic Piston Legs & Robotic Shock Pads
  if (mode === 'jump') {
    r(4, 18, 3, 2); r(3, 20, 4, 1); r(8, 18, 3, 2); r(8, 20, 4, 1);
  } else if (frame === 0) {
    r(10, 17, 3, 3); r(11, 20, 2, 2); r(9, 21, 5, 1);
    r(4, 17, 3, 3);  r(3, 20, 2, 2);  r(2, 21, 5, 1);
  } else {
    r(4, 17, 3, 3);  r(5, 20, 2, 2);  r(3, 21, 5, 1);
    r(10, 17, 3, 3); r(9, 20, 2, 2);  r(8, 21, 5, 1);
  }
}

// 4: SHINOBI HEN (The Stealth Ninja Chicken — trailing headband ribbons, ninja mask, blade wing)
function drawShinobiHen(pal, x, yTop, mode, frame, blinkOn) {
  const r = (ux, uy, uw, uh) => box(Math.round(x) + ux * S, Math.round(yTop) + uy * S, uw * S, uh * S);
  ctx.fillStyle = pal.fg;

  if (mode === 'peck') {
    r(0, 1, 3, 5); r(3, 3, 10, 6); r(12, 5, 5, 4); r(16, 9, 3, 2);
    ctx.fillStyle = pal.bg; r(13, 6, 2, 2);
    ctx.fillStyle = pal.fg; r(5, 9, 3, 3); r(9, 9, 3, 3);
    return;
  }
  if (mode === 'dead') {
    // SITTING STEALTH FAIL: butt down, ribbons draped behind, mask on, X eye
    r(6, 2, 8, 5);                                     // cowl head y2..6
    r(5, 2, 1, 2);                                     // headband knot
    r(6, 2, 8, 1);                                     // headband strip
    ctx.fillStyle = pal.bg; r(9, 3, 4, 4);             // eye socket
    ctx.fillStyle = pal.fg;
    r(9, 3, 1, 1); r(12, 3, 1, 1);                     // X eye
    r(10, 4, 2, 2);
    r(9, 6, 1, 1); r(12, 6, 1, 1);
    r(15, 4, 4, 2); r(18, 5, 2, 1);                    // beak poking out the mask
    r(3, 6, 11, 6);                                    // slim body y6..11
    r(0, 8, 4, 1); r(-1, 9, 4, 1);                     // ribbons pooled on ground
    ctx.fillStyle = pal.bg; r(5, 8, 5, 3);             // blade wing resting
    ctx.fillStyle = pal.fg;
    r(13, 9, 7, 1);                                    // far leg
    r(13, 10, 8, 2);                                   // near leg y10..11
    r(21, 9, 2, 3);                                    // tabi foot up
    return;
  }
  if (mode === 'duck') {
    r(3, 4, 14, 7); r(14, 2, 6, 5); r(19, 4, 4, 2);
    r(1, 3, 4, 4);
    ctx.fillStyle = pal.bg; r(15, 3, 3, 2);
    ctx.fillStyle = pal.fg; r(5, 11, 3, 1); r(10, 11, 3, 1);
    return;
  }

  const hx = (mode === 'run' && frame === 0) ? 1 : 0;

  // Long Billowing Headband Ribbons (Flutter dynamically in the wind behind!)
  if (frame === 0) {
    r(hx - 2, 2, 4, 2); r(hx - 5, 1, 4, 2); r(hx - 7, 0, 3, 1);
  } else {
    r(hx - 2, 3, 4, 2); r(hx - 6, 4, 4, 2); r(hx - 8, 5, 3, 1);
  }

  // Ninja Cowl Head
  r(hx + 6, 2, 8, 6);

  // Forehead Headband Plate
  ctx.fillStyle = pal.bg; r(hx + 6, 3, 8, 2);
  ctx.fillStyle = pal.fg; r(hx + 6, 3, 8, 1);

  // Sharp Narrow Shinobi Eye Slit
  ctx.fillStyle = pal.bg; r(hx + 10, 4, 4, 2);
  ctx.fillStyle = pal.fg;
  if (!blinkOn) r(hx + 11, 4, 2, 1);

  // Snout Beak over Face Mask
  r(hx + 14, 5, 4, 2); r(hx + 17, 6, 2, 1);

  // Aerodynamic Ninja Tunic & Belt Sash
  r(3, 8, 11, 8); r(4, 16, 9, 2);
  ctx.fillStyle = pal.bg; r(3, 12, 11, 1);              // belt sash
  ctx.fillStyle = pal.fg; r(8, 11, 3, 2);              // kunai feather knife at waist

  // Sleek Katana Blade Wing
  r(frame ? 3 : 4, frame ? 9 : 10, 7, 4); r(frame ? 1 : 2, frame ? 11 : 12, 3, 2);

  // Swept Stepped Tail
  r(0, 6, 3, 5); r(1, 9, 3, 4);

  // Wrapped Tabi Ninja Legs with Silent Tread Pads
  if (mode === 'jump') {
    r(4, 18, 3, 2); r(3, 20, 4, 1); r(8, 18, 3, 2); r(8, 20, 4, 1);
  } else if (frame === 0) {
    r(10, 17, 2, 3); r(11, 20, 2, 2); r(9, 21, 4, 1);
    r(4, 17, 2, 3);  r(3, 20, 2, 2);  r(2, 21, 4, 1);
  } else {
    r(4, 17, 2, 3);  r(5, 20, 2, 2);  r(3, 21, 4, 1);
    r(10, 17, 2, 3); r(9, 20, 2, 2);  r(8, 21, 4, 1);
  }
}

// Master Chicken Dispatcher (preserves all poses and hats)
function drawChicken(pal, x, yTop, mode, frame, blinkOn, chickenIdx, hatIdx) {
  if (chickenIdx === undefined) chickenIdx = activeChicken;
  if (hatIdx === undefined) hatIdx = activeHat;
  switch (chickenIdx) {
    case 1: drawRoosterRex(pal, x, yTop, mode, frame, blinkOn); break;
    case 2: drawChubbyChick(pal, x, yTop, mode, frame, blinkOn); break;
    case 3: drawMechaPi(pal, x, yTop, mode, frame, blinkOn); break;
    case 4: drawShinobiHen(pal, x, yTop, mode, frame, blinkOn); break;
    default: drawPiCluck(pal, x, yTop, mode, frame, blinkOn); break;
  }
  drawHat(pal, hatIdx, x, yTop, mode, frame, chickenIdx);
}

// ---------- collectible egg ----------
function drawEgg(pal, x, y, ph) {
  const s = S;
  const sx = Math.round(x), sy = Math.round(y);
  const R = (rx, ry, rw, rh) => box(sx + rx * s, sy + ry * s, rw * s, rh * s);
  ctx.fillStyle = pal.fg;
  R(2, 0, 1, 1);
  R(1, 1, 3, 1);
  R(0, 2, 5, 3);
  R(1, 5, 3, 1);
  ctx.fillStyle = pal.bg;
  if (ph) R(1, 2, 1, 1); else R(3, 3, 1, 1);
}

// ---------- feather (death puff) ----------
function drawFeather(pal, x, y, ph) {
  const s = S;
  const sx = Math.round(x), sy = Math.round(y);
  const R = (rx, ry, rw, rh) => box(sx + rx * s, sy + ry * s, rw * s, rh * s);
  ctx.fillStyle = pal.fg;
  if (ph) { R(2, 0, 2, 1); R(1, 1, 3, 1); R(0, 2, 3, 1); R(1, 3, 2, 1); }
  else    { R(0, 0, 2, 1); R(0, 1, 3, 1); R(1, 2, 3, 1); R(1, 3, 2, 1); }
}

// ---------- obstacles ----------
function makeObstacle(type, x) {
  const o = { type, x, w: 0, h: 0, y: 0, passed: false, nearMissed: false };
  if (type === 'spike')   { o.w = 54; o.h = 21; o.y = GROUND - o.h; }
  if (type === 'barrier') { o.w = 48; o.h = 42; o.y = GROUND - o.h; }
  if (type === 'stack')   { o.w = 36; o.h = 51; o.y = GROUND - o.h; }
  if (type === 'fence')   { o.w = 54; o.h = 36; o.y = GROUND - o.h; }
  if (type === 'fox')     { o.w = 58; o.h = 32; o.y = GROUND - o.h; }
  if (type === 'hay')     { o.w = 46; o.h = 46; o.y = GROUND - o.h; }
  if (type === 'falcon')  { o.w = 56; o.h = 20; o.y = GROUND - 61; o.fly = true; }
  if (type === 'owl')     { o.w = 48; o.h = 20; o.y = GROUND - 61; o.fly = true; }
  o.x = x;
  return o;
}

function drawObstacle(pal, t, o) {
  const x = Math.round(o.x), y = Math.round(o.y);
  ctx.fillStyle = pal.fg;
  if (o.type === 'stack') {
    box(x, y + 21, 36, 30); crateDetail(pal, x, y + 21, 36, 30);
    box(x + 6, y, 24, 21);  crateDetail(pal, x + 6, y, 24, 21);
  } else if (o.type === 'spike') {
    for (let i = 0; i < 3; i++) {
      const sx = x + i * 18;
      box(sx, y + 14, 18, 7); box(sx + 3, y + 7, 12, 7); box(sx + 6, y, 6, 7);
    }
  } else if (o.type === 'barrier') {
    box(x, y, 48, 16);
    ctx.fillStyle = pal.bg;
    box(x + 7, y, 6, 16); box(x + 21, y, 6, 16); box(x + 35, y, 6, 16);
    ctx.fillStyle = pal.fg;
    box(x + 6, y + 16, 5, 22); box(x + 37, y + 16, 5, 22);
    box(x + 2, y + 38, 13, 4); box(x + 33, y + 38, 13, 4);
  } else if (o.type === 'fence') {
    // Farm fence: two posts + two rails
    box(x, y + 6, 6, 30); box(x + 48, y + 6, 6, 30);
    box(x, y + 10, 54, 6); box(x, y + 24, 54, 6);
    ctx.fillStyle = pal.bg;
    box(x + 4, y + 11, 46, 2); box(x + 4, y + 25, 46, 2);
    box(x + 2, y + 6, 2, 3); box(x + 50, y + 6, 2, 3);
    ctx.fillStyle = pal.fg;
  } else if (o.type === 'fox') {
    // Crouched fox facing left — breathing/tensing bob (legs stay planted)
    const bob = (Math.floor(t * 6) % 2) === 0 ? 0 : 2;
    box(x + 18, y + 8 + bob, 34, 16 - bob);        // body
    box(x + 40, y + 4 + bob, 14, 10);              // haunch
    box(x, y + 10 + bob, 22, 12 - bob);            // tail (big brush)
    ctx.fillStyle = pal.bg;
    box(x + 3, y + 13 + bob, 8, 6);                // white tail tip
    box(x + 24, y + 12 + bob, 16, 6);              // body shading
    ctx.fillStyle = pal.fg;
    box(x + 44, y + 0 + bob, 6, 6);                // ear
    box(x + 48, y + 6 + bob, 6, 8);                // cheek
    box(x + 44, y + 12 + bob, 8, 6);               // snout
    ctx.fillStyle = pal.bg;
    box(x + 46, y + 8 + bob, 3, 3);                // eye
    box(x + 44, y + 15 + bob, 3, 3);               // nose
    ctx.fillStyle = pal.fg;
    box(x + 20, y + 24, 6, 8);                     // front leg
    box(x + 42, y + 24, 6, 8);                     // back leg
    box(x + 16, y + 30, 12, 2); box(x + 38, y + 30, 12, 2); // paws
  } else if (o.type === 'hay') {
    // Round hay bale with spiral straw lines
    box(x + 6, y, 34, 6); box(x + 2, y + 6, 42, 34);
    box(x + 6, y + 40, 34, 6);
    ctx.fillStyle = pal.bg;
    box(x + 8, y + 4, 30, 2); box(x + 4, y + 12, 38, 2);
    box(x + 4, y + 22, 38, 2); box(x + 4, y + 32, 38, 2);
    box(x + 8, y + 40, 30, 2);
    box(x + 20, y + 8, 2, 30);                   // spiral core
    box(x + 14, y + 16, 14, 2); box(x + 14, y + 28, 14, 2);
    ctx.fillStyle = pal.fg;
    box(x + 40, y + 16, 4, 14);                  // bale twine band
    ctx.fillStyle = pal.bg;
    box(x + 40, y + 20, 4, 2);
    ctx.fillStyle = pal.fg;
  } else if (o.type === 'falcon') {
    // Falcon skimming low — 2-frame beating wings (duck to survive)
    const beat = (Math.floor(t * 12) % 2) === 0;
    box(x + 14, y + 8, 30, 10);                  // sleek body
    box(x + 40, y + 6, 10, 8);                   // head
    box(x + 50, y + 8, 6, 3);                    // hooked beak
    ctx.fillStyle = pal.bg;
    box(x + 43, y + 8, 3, 3);                    // eye
    box(x + 18, y + 11, 18, 4);                  // wing shadow
    ctx.fillStyle = pal.fg;
    if (beat) { box(x + 16, y, 26, 6); box(x + 20, y - 4, 16, 4); }   // wings up
    else      { box(x + 16, y + 16, 26, 4); box(x + 22, y + 20, 16, 2); } // wings down
    box(x + 8, y + 10, 8, 6);                    // tail feathers
    ctx.fillStyle = pal.bg;
    box(x + 10, y + 12, 4, 2);
    ctx.fillStyle = pal.fg;
  } else if (o.type === 'owl') {
    // Night owl, wings spread wide (duck to survive)
    const beat = (Math.floor(t * 8) % 2) === 0;
    box(x + 16, y + 4, 20, 16);                  // round body
    box(x + 14, y, 8, 6); box(x + 30, y, 8, 6);  // ear tufts
    ctx.fillStyle = pal.bg;
    box(x + 20, y + 6, 5, 5); box(x + 28, y + 6, 5, 5);  // huge eyes
    ctx.fillStyle = pal.fg;
    box(x + 22, y + 8, 2, 2); box(x + 30, y + 8, 2, 2);  // pupils
    box(x + 25, y + 12, 4, 3);                   // beak
    ctx.fillStyle = pal.bg;
    box(x + 19, y + 13, 12, 5);                  // pale chest
    ctx.fillStyle = pal.fg;
    if (beat) { box(x + 0, y + 2, 16, 6); box(x + 36, y + 2, 12, 6); }    // wings raised
    else      { box(x + 0, y + 14, 16, 5); box(x + 36, y + 14, 12, 5); }  // wings swept
    box(x + 20, y + 18, 4, 2); box(x + 28, y + 18, 4, 2); // talons
  }
}

function crateDetail(pal, x, y, w, h) {
  ctx.fillStyle = pal.bg;
  box(x + 2, y + Math.round(h / 3), w - 4, 2);
  box(x + 2, y + Math.round(2 * h / 3), w - 4, 2);
  box(x + Math.round(w / 2) - 1, y + 2, 2, h - 4);
  ctx.fillStyle = pal.fg;
}

function playerBox() {
  if (player.ducking && player.onGround) return { x: player.x + 6, y: player.y + 36, w: 54, h: 30 };
  return { x: player.x + 5, y: player.y + 3, w: 38, h: 61 };
}
function obsBox(o) { return { x: o.x + 4, y: o.y + 3, w: o.w - 8, h: o.h - 4 }; }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// ---------- spawning ----------
function spawnObstacle() {
  const pool = [];
  const add = (t, w) => { for (let i = 0; i < w; i++) pool.push(t); };
  if (score < 260) { add('spike', 3); add('fence', 2); }
  else {
    add('spike', 3); add('barrier', 2); add('fence', 2);
    if (score > 320) add('fox', 2);
    if (score > 350) add('falcon', 3);
    if (score > 400 && nightTarget) add('owl', 2);
    if (score > 600) { add('stack', 2); add('hay', 2); }
  }
  const type = pool[(Math.random() * pool.length) | 0];
  const o = makeObstacle(type, W + 40);
  obstacles.push(o);

  if (Math.random() < 0.75) {
    const n = 1 + ((Math.random() * 3) | 0);
    const overOb = Math.random() < 0.45;
    const baseX = overOb ? o.x + o.w / 2 - (n - 1) * 15 : o.x - nextGap * 0.35;
    for (let i = 0; i < n; i++) {
      const arc = overOb ? 0 : Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 34;
      picks.push({ x: baseX + i * 30, y: GROUND - 70 - arc, ph: 0, t: rand(0, 1) });
    }
  }
  nextGap = speed * 0.72 + rand(40, 300);
}

// ---------- game flow ----------
function triggerCurtain() { curtainT = 0.35; }

function resetRun() {
  score = 0; speed = 400; elapsed = 0;
  obstacles = []; parts = []; picks = []; deathStars = []; floatingTexts = [];
  nextGap = 550; milestone = 0; hiNew = false;
  deathT = 0; shake = 0; flash = 0; duckT = 0;
  hitstop = 0; deathFalling = false; deathLanded = false;
  stats = { cleared: 0, eggs: 0, top: 0, nearMisses: 0 };
  eggStreak = 0; eggStreakTimer = 0; milestoneBanner = null;
  nightTarget = false;
  season = 0;
  player.y = GROUND - STAND_H; player.vy = 0; player.onGround = true;
  player.ducking = false; player.buffer = 0;
  totals.runs++; saveTotals();
  state = 'playing';
  audio.bpm = 130;
  audio.start();
  triggerCurtain();
  vibrate(20);
}

function die() {
  state = 'dead'; deathT = 0; shake = 0; flash = 0.18;
  hitstop = 0.09;               // arcade freeze on the collision frame
  deathFalling = true; deathLanded = false;
  audio.die();
  vibrate([40, 40, 80]);
  // The chicken keeps falling from where it was — gravity does the rest in update().
  player.vy = Math.min(player.vy, -140);   // small pop upward before the drop
  player.onGround = false;
  totals.eggs += stats.eggs;
  bankEggs += stats.eggs;
  saveTotals();
  saveShopData();
  recordScore(score, stats.eggs);

  // Check Badges
  unlockBadge(0); // first run
  if (stats.eggs >= 50 || bankEggs >= 50) unlockBadge(3); // egg magnate

  if (Math.floor(score) > hi) {
    hi = Math.floor(score);
    hiNew = true;
    try { localStorage.setItem(HI_KEY, String(hi)); } catch (e) {}
    audio.fanfare();
  }
}

// ---------- clickable buttons helper ----------
let activeButtons = [];
function clearButtons() { activeButtons = []; }
function addButton(id, x, y, w, h, onClick, label) {
  activeButtons.push({ id, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), onClick, label });
}

function getPointerCanvasPos(e) {
  const r = cv.getBoundingClientRect();
  const scaleX = W / r.width;
  const scaleY = H / r.height;
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY
  };
}

let hoveredBtn = null;
function handlePointerDownButtons(pos) {
  for (const b of activeButtons) {
    if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
      audio.click();
      vibrate(15);
      b.onClick();
      return true;
    }
  }
  return false;
}

// Copy scorecard text to clipboard
function copyScoreToClipboard() {
  const text = `Chicken Runner — 1-Bit Infinite Run!\nDistance: ${pad5(Math.floor(score))}m | Cleared: ${stats.cleared} | Eggs: ${stats.eggs} | Top Speed: ${stats.top} px/s\nCan you beat my record?`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('SCORE COPIED TO CLIPBOARD!');
    }).catch(() => {
      showToast('DIST ' + pad5(Math.floor(score)) + ' COPIED!');
    });
  } else {
    showToast('DIST ' + pad5(Math.floor(score)) + ' RECORDED!');
  }
}

// ---------- input handling ----------
function pressJump() {
  audio.ensure();
  if (state === 'menu') resetRun();
  else if (state === 'dead' && deathT > 0.8) resetRun();
  else if (state === 'paused') state = 'playing';
  else if (state === 'playing') player.buffer = 0.12;
}
function pressDuck() {
  audio.ensure();
  if (state === 'playing' && !player.onGround) player.vy = Math.max(player.vy, 700);
}

const SPEAKER_BOX = { x: 12, y: 12, w: 34, h: 26 };
function inSpeaker(cx, cy) {
  return cx >= SPEAKER_BOX.x && cx <= SPEAKER_BOX.x + SPEAKER_BOX.w &&
         cy >= SPEAKER_BOX.y && cy <= SPEAKER_BOX.y + SPEAKER_BOX.h;
}

window.addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyP', 'KeyM', 'KeyT', 'KeyB', 'KeyF', 'KeyC', 'Enter'].indexOf(e.code) >= 0) e.preventDefault();
  if (e.repeat) return;

  if (e.code === 'KeyC') {
    if (state === 'chickens') state = 'menu';
    else { state = 'chickens'; rosterSelect = activeChicken; }
    audio.click();
    return;
  }

  if (state === 'chickens') {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      rosterSelect = (rosterSelect - 1 + CHICKENS.length) % CHICKENS.length;
      audio.blip();
      return;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      rosterSelect = (rosterSelect + 1) % CHICKENS.length;
      audio.blip();
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      activeChicken = rosterSelect;
      saveChicken();
      audio.click();
      vibrate(20);
      showToast('RUNNER: ' + CHICKENS[activeChicken].name);
      resetRun();
      return;
    }
  }

  if (e.code === 'KeyM') {
    audio.cycleMode();
  } else if (e.code === 'KeyT') {
    const idx = (THEME_KEYS.indexOf(currentThemeKey) + 1) % THEME_KEYS.length;
    applyTheme(THEME_KEYS[idx]);
    audio.click();
  } else if (e.code === 'KeyB') {
    document.body.classList.toggle('bezel-on');
    audio.click();
  } else if (e.code === 'KeyF') {
    toggleFullscreen();
  } else if (e.code === 'KeyP') {
    if (state === 'playing') state = 'paused';
    else if (state === 'paused') state = 'playing';
    audio.blip();
  } else if (e.code === 'Escape') {
    if (state === 'playing') state = 'paused';
    else if (state === 'paused') state = 'playing';
    else if (['howtoplay', 'shop', 'records', 'badges', 'chickens'].indexOf(state) >= 0) state = 'menu';
    audio.blip();
  } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    pressJump();
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    duckHeld = true; pressDuck();
  }
});

window.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown' || e.code === 'KeyS') duckHeld = false;
});
window.addEventListener('blur', () => { duckHeld = false; });

// Canvas Pointer Events
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  audio.ensure();
  const pos = getPointerCanvasPos(e);

  if (inSpeaker(pos.x, pos.y)) { audio.cycleMode(); return; }
  if (handlePointerDownButtons(pos)) return;

  // Split-screen touch in gameplay: Left side = Slide/Duck, Right side = Jump
  if (state === 'playing') {
    if (pos.x < W * 0.42) {
      duckHeld = true; pressDuck();
    } else {
      pressJump();
    }
  } else {
    pressJump();
  }
});

window.addEventListener('pointerup', () => {
  if (state === 'playing' && duckHeld) duckHeld = false;
});

cv.addEventListener('pointermove', e => {
  const pos = getPointerCanvasPos(e);
  let nowHover = null;
  for (const b of activeButtons) {
    if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
      nowHover = b.id; break;
    }
  }
  if (nowHover !== hoveredBtn) {
    hoveredBtn = nowHover;
    if (hoveredBtn) audio.blip();
  }
});

// Fullscreen helper
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Hook Bezel HTML Buttons
const domRosterBtn = document.getElementById('btn-roster');
if (domRosterBtn) domRosterBtn.addEventListener('click', () => {
  if (state === 'chickens') state = 'menu';
  else { state = 'chickens'; rosterSelect = activeChicken; }
  audio.click();
});
const domThemeBtn = document.getElementById('btn-theme');
if (domThemeBtn) domThemeBtn.addEventListener('click', () => {
  const idx = (THEME_KEYS.indexOf(currentThemeKey) + 1) % THEME_KEYS.length;
  applyTheme(THEME_KEYS[idx]);
  audio.click();
});
const domAudioBtn = document.getElementById('btn-audio');
if (domAudioBtn) domAudioBtn.addEventListener('click', () => audio.cycleMode());
const domBezelBtn = document.getElementById('btn-bezel');
if (domBezelBtn) domBezelBtn.addEventListener('click', () => {
  document.body.classList.toggle('bezel-on');
  audio.click();
});
const domFsBtn = document.getElementById('btn-fullscreen');
if (domFsBtn) domFsBtn.addEventListener('click', () => toggleFullscreen());

// Hook Virtual Touch Buttons
const domTouchSlide = document.getElementById('btn-touch-slide');
if (domTouchSlide) {
  const startSlide = e => { e.preventDefault(); audio.ensure(); duckHeld = true; pressDuck(); domTouchSlide.classList.add('active'); };
  const endSlide = e => { e.preventDefault(); duckHeld = false; domTouchSlide.classList.remove('active'); };
  domTouchSlide.addEventListener('pointerdown', startSlide);
  domTouchSlide.addEventListener('pointerup', endSlide);
  domTouchSlide.addEventListener('pointercancel', endSlide);
  domTouchSlide.addEventListener('pointerleave', endSlide);
}
const domTouchJump = document.getElementById('btn-touch-jump');
if (domTouchJump) {
  domTouchJump.addEventListener('pointerdown', e => {
    e.preventDefault();
    audio.ensure();
    pressJump();
    domTouchJump.classList.add('active');
    setTimeout(() => domTouchJump.classList.remove('active'), 120);
  });
}

// ---------- update loop ----------
function update(dt) {
  time += dt;

  // Hitstop: freeze the world for a few frames on big impacts (still renders)
  if (hitstop > 0) { hitstop = Math.max(0, hitstop - dt); return; }

  // Back at the menu (death MENU / pause QUIT): clear leftover run field
  if (state === 'menu' && (obstacles.length || picks.length || parts.length || deathStars.length || floatingTexts.length)) {
    obstacles = []; picks = []; parts = []; deathStars = []; floatingTexts = [];
    player.y = GROUND - STAND_H; player.vy = 0; player.onGround = true;
    player.ducking = false; player.buffer = 0;
  }

  if (curtainT > 0) curtainT = Math.max(0, curtainT - dt);

  // Dynamic audio tempo based on running speed
  if (state === 'playing') {
    audio.bpm = Math.min(155, 130 + Math.floor((speed - 400) / 36));
  } else {
    audio.bpm = 130;
  }

  // Floating text decay
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 25 * dt;
    ft.life -= dt;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }

  // Egg streak timer
  if (eggStreakTimer > 0) {
    eggStreakTimer -= dt;
    if (eggStreakTimer <= 0) eggStreak = 0;
  }

  // Milestone banner timer
  if (milestoneBanner) {
    milestoneBanner.t -= dt;
    if (milestoneBanner.t <= 0) milestoneBanner = null;
  }

  // Day/Night switch
  if (state === 'playing') {
    elapsed += dt;
    // Gentle asymptotic ramp: eases toward 940 px/s instead of hitting it ~1 min in.
    // ~550 at 2000m, ~740 at 6000m, ~840 at 10000m, never quite tops out.
    speed = 400 + 540 * (1 - Math.exp(-score / 6000));
    score += speed * dt / 10;
    stats.top = Math.max(stats.top, Math.round(speed));

    if (stats.top >= 750) unlockBadge(4); // speed demon

    const wantNight = Math.floor(score / 700) % 2 === 1;
    if (wantNight !== nightTarget) {
      nightTarget = wantNight;
      flash = 0.14;
      if (nightTarget) unlockBadge(1); // night owl
    }

    const wantSeason = Math.floor(score / 1000) % 4;
    if (wantSeason !== season) {
      season = wantSeason;
      flash = 0.14;
      if (season === 3) unlockBadge(2); // four seasons
    }

    const m = Math.floor(score / 100);
    if (m > milestone) {
      milestone = m;
      audio.ding();
      vibrate(25);
      milestoneBanner = { text: '★ ' + (m * 100) + 'M REACHED! ★', t: 1.5 };
    }
  }

  C.bg = rgb(curBg());
  C.fg = rgb(curFg());

  // World scroll
  const scrolling = state === 'playing' || state === 'menu';
  const spd = state === 'menu' ? 300 : speed;
  if (scrolling) {
    groundOff = (groundOff + spd * dt) % 768;
    hillOff = (hillOff + spd * 0.4 * dt) % HILL_TILE;
    for (const c of clouds) {
      c.x -= spd * 0.25 * dt;
      if (c.x < -CLOUD_TPL[c.t].w * c.s) { c.x = W + rand(40, 300); c.y = rand(20, 140); }
    }
  }
  if (state === 'playing' || state === 'menu') audio.tick();

  if (state === 'paused') return;

  if (state === 'playing') {
    let rightmost = -1e9;
    for (const o of obstacles) if (o.x + o.w > rightmost) rightmost = o.x + o.w;
    if (elapsed > 1.0 && W - rightmost > nextGap) spawnObstacle();

    const pb = playerBox();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed * dt;

      // Check Near-Miss
      if (!o.passed && !o.nearMissed && o.x + o.w < player.x) {
        o.passed = true;
        stats.cleared++;
        const obBox = obsBox(o);
        const vertDist = Math.abs(pb.y + pb.h - obBox.y);
        const horizDist = Math.abs(player.x - (o.x + o.w));
        if (vertDist < 18 || (o.fly && pb.y > obBox.y + obBox.h - 16)) {
          o.nearMissed = true;
          stats.nearMisses++;
          score += 10;
          flash = 0.06;
          hitstop = 0.05;           // heart-punch freeze on close calls
          audio.nearMiss();
          vibrate(15);
          floatingTexts.push({ text: 'CLOSE! +10', x: player.x + 20, y: player.y - 10, life: 0.8, maxLife: 0.8 });
          if (stats.nearMisses >= 3) unlockBadge(5); // close call badge
        }
      }

      if (o.x + o.w < -30) obstacles.splice(i, 1);
    }

    // Collectibles & Combo Streak
    for (let i = picks.length - 1; i >= 0; i--) {
      const p = picks[i];
      p.x -= speed * dt; p.t += dt;
      if (p.t > 0.35) { p.t = 0; p.ph ^= 1; }
      if (p.x < -30) { picks.splice(i, 1); continue; }

      if (overlap(pb, { x: p.x + 3, y: p.y + 5, w: 9, h: 9 })) {
        picks.splice(i, 1);
        score += 25;
        stats.eggs++;
        eggStreak++;
        eggStreakTimer = 1.8;
        vibrate(15);

        if (eggStreak >= 2) {
          audio.streak(eggStreak);
          floatingTexts.push({ text: 'STREAK x' + eggStreak + '!', x: p.x, y: p.y - 12, life: 0.7, maxLife: 0.7 });
        } else {
          audio.pickup();
        }

        for (let j = 0; j < 6; j++) parts.push({
          x: p.x + 7, y: p.y + 9, vx: rand(-90, 90), vy: rand(-160, -40),
          life: rand(0.2, 0.45), s: rand(2, 4)
        });
      }
    }

    // Blink timer
    blinkT -= dt;
    if (blinkT < -0.15) { nextBlink = rand(2.2, 4.2); blinkT = nextBlink; }

    // Physics
    player.buffer = Math.max(0, player.buffer - dt);
    player.ducking = duckHeld && player.onGround;

    if (player.buffer > 0 && player.onGround) {
      player.vy = -JUMP_V; player.onGround = false; player.buffer = 0; player.ducking = false;
      audio.jump();
      vibrate(10);
      for (let j = 0; j < 4; j++) parts.push({
        x: player.x + rand(6, 40), y: GROUND - 2, vx: rand(-120, -20), vy: rand(-40, 0),
        life: rand(0.15, 0.3), s: rand(2, 4)
      });
    }

    if (!player.onGround) {
      if (duckHeld) player.vy = Math.max(player.vy, 700);
      player.vy += G * dt;
      player.y += player.vy * dt;
      // Wings beat while airborne: run the frame counter up here too
      player.animT += dt;
      if (player.animT > 0.09) { player.animT = 0; player.frame ^= 1; }
      if (player.y >= GROUND - STAND_H) {
        player.y = GROUND - STAND_H; player.vy = 0;
        if (!player.onGround) {
          audio.land(); vibrate(10);
        }
        player.onGround = true;
        player.frame = 0;
        for (let j = 0; j < 12; j++) parts.push({
          x: player.x + rand(4, 50), y: GROUND - 2, vx: rand(-220, 220), vy: rand(-140, -30),
          life: rand(0.25, 0.55), s: rand(2, 6)
        });
      }
    } else {
      player.animT += dt;
      if (player.animT > 0.11) { player.animT = 0; player.frame ^= 1; }
      if (player.frame === 0 && !player.ducking) {
        parts.push({ x: player.x + 8, y: GROUND - 2, vx: rand(-160, -60), vy: rand(-50, -10), life: rand(0.15, 0.3), s: rand(2, 3) });
      }
      if (player.ducking) {
        duckT += dt;
        if (duckT > 0.07) {
          duckT = 0;
          parts.push({ x: player.x - 4, y: player.y + rand(26, 46), vx: -speed * 1.1, vy: 0, life: 0.22, s: 2, line: 1 });
        }
      }
    }

    // High-speed wind streaks (life long enough to cross the whole screen)
    if (speed > 620 && Math.random() < 0.14) {
      parts.push({ x: W + 10, y: rand(30, GROUND - 30), vx: -speed * 1.5, vy: 0,
                   life: (W + 40) / (speed * 1.5), s: 2, line: 1 });
    }

    // Collisions
    for (const o of obstacles) {
      if (overlap(pb, obsBox(o))) { die(); break; }
    }
  } else if (state === 'dead') {
    deathT += dt;

    // Death fall: chicken drops from where it died, butt-slams the ground once
    if (deathFalling) {
      player.vy += G * dt;
      player.y += player.vy * dt;
      if (player.y >= GROUND - STAND_H) {
        player.y = GROUND - STAND_H;
        player.vy = 0;
        deathFalling = false;
        deathLanded = true;
        shake = 0.45;                       // hard tremor on the slam
        audio.land();
        audio.thud();
        vibrate([30, 25, 60]);
        // Dust ring bursting out both sides of the impact
        for (let j = 0; j < 14; j++) parts.push({
          x: player.x + rand(4, 52), y: GROUND - 4,
          vx: rand(-280, 280), vy: rand(-200, -40),
          life: rand(0.3, 0.7), s: rand(3, 6)
        });
        // 3 dizzy stars orbiting the head — they stay until replay
        for (let i = 0; i < 3; i++) deathStars.push({ a: i * 2.09, r: 22 + i * 4 });
      }
    }

    for (const s of deathStars) s.a += dt * 6;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += G * 0.6 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.y > GROUND - 3) { p.y = GROUND - 3; p.vy = 0; p.vx *= 0.7; }
      if (p.life <= 0) parts.splice(i, 1);
    }
  } else if (state === 'menu' || state === 'shop') {
    blinkT -= dt;
    if (blinkT < -0.15) { nextBlink = rand(2.2, 4.2); blinkT = nextBlink; }
    idleT -= dt;
    if (idleT < -0.3) idleT = rand(2.5, 4.5);
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    if (state === 'dead') break;
    const p = parts[i];
    if (!p.line) p.vy += G * 0.5 * dt;   // wind streaks fly straight (no gravity)
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0 || p.x < -30) parts.splice(i, 1);
  }

  if (shake > 0) shake = Math.max(0, shake - dt);
  if (flash > 0) flash = Math.max(0, flash - dt);
}

// ---------- scenery ----------
function drawGround(pal, ssn) {
  ctx.fillStyle = pal.fg;
  const step = 48;
  const j0 = Math.floor(groundOff / step) - 1;
  for (let j = j0; j * step - groundOff < W + step; j++) {
    const sx = Math.round(j * step - groundOff);
    const r = ((j % 40) + 40) % 40;
    if (r === 3) { box(sx + 8, GROUND - 4, 24, 4); box(sx + 14, GROUND - 7, 12, 3); }
    else if (r === 11 || r === 27) { box(sx + 6, GROUND + 8, 4, 3); box(sx + 22, GROUND + 14, 3, 3); box(sx + 34, GROUND + 9, 5, 2); }
    else if (r === 19 || r === 33) { box(sx + 10, GROUND + 13, 14, 2); box(sx + 32, GROUND + 9, 6, 2); }
    else if (ssn === 0 && (r === 7 || r === 25)) {
      box(sx + 14, GROUND - 13, 5, 5);
      ctx.fillStyle = pal.bg; box(sx + 16, GROUND - 11, 1, 1); ctx.fillStyle = pal.fg;
      box(sx + 15, GROUND - 8, 3, 5);
      box(sx + 9, GROUND - 3, 3, 3); box(sx + 26, GROUND - 3, 3, 3);
    } else if (ssn === 2 && (r === 15 || r === 31)) {
      box(sx + 12, GROUND - 4, 5, 4);
      ctx.fillStyle = pal.bg; box(sx + 12, GROUND - 4, 1, 1); ctx.fillStyle = pal.fg;
    } else if (ssn === 3 && (r === 9 || r === 23)) {
      box(sx + 8, GROUND - 6, 22, 6);
      box(sx + 13, GROUND - 9, 12, 3);
    }
  }
  box(0, GROUND, W, 3);
}

function drawHills(pal, ssn) {
  const dense = ssn === 1;
  for (let copy = 0; copy < 2; copy++) {
    const ox = copy * HILL_TILE - hillOff;
    if (ox > W || ox + HILL_TILE < 0) continue;
    for (const h of HILLS) {
      const x = Math.round(h.x + ox);
      if (x > W || x + h.w < 0) continue;
      const s1 = Math.round(h.w * 0.25), s2 = Math.round(h.w * 0.5);
      ditherRect(pal, x, GROUND - h.h / 3, s1, h.h / 3 + 3, dense);
      ditherRect(pal, x + s1, GROUND - (h.h * 2) / 3, s2 - s1, (h.h * 2) / 3 + 3, dense);
      ditherRect(pal, x + s2, GROUND - h.h, h.w - s2, h.h + 3, dense);
      if (ssn === 3) {
        const caps = [
          [x, Math.round(GROUND - h.h / 3), s1],
          [x + s1, Math.round(GROUND - (h.h * 2) / 3), s2 - s1],
          [x + s2, GROUND - h.h, h.w - s2]
        ];
        ctx.fillStyle = pal.bg; for (const c of caps) box(c[0], c[1], c[2], 5);
        ctx.fillStyle = pal.fg; for (const c of caps) box(c[0], c[1], c[2], 2);
      }
    }
  }
}

function drawCloud(pal, cl) {
  const tpl = CLOUD_TPL[cl.t], s = cl.s;
  const x0 = Math.round(cl.x), y0 = Math.round(cl.y);
  ctx.fillStyle = pal.bg;
  for (const p of tpl.inner) box(x0 + p[0] * s, y0 + p[1] * s, s, s);
  ctx.fillStyle = pal.fg;
  for (const p of tpl.edge) box(x0 + p[0] * s, y0 + p[1] * s, s, s);
}

function drawSky(pal, t, isNight, ssn) {
  if (!isNight) {
    if (ssn !== 1) return;
    ctx.fillStyle = pal.fg;
    const cx = 136, cy = 46;
    box(cx - 6, cy - 13, 12, 3); box(cx - 10, cy - 10, 20, 3); box(cx - 13, cy - 7, 26, 14);
    box(cx - 10, cy + 7, 20, 3); box(cx - 6, cy + 10, 12, 3);
    box(cx - 1, cy - 18, 3, 3); box(cx - 1, cy + 15, 3, 3);
    box(cx - 18, cy - 1, 3, 3); box(cx + 15, cy - 1, 3, 3);
    return;
  }
  ctx.fillStyle = pal.fg;
  for (const s of skyStars) {
    const on = Math.sin(t * 2 + s.p) > -0.35;
    if (!on) continue;
    const sx = Math.round(s.x), sy = Math.round(s.y);
    if (s.big) { box(sx - 2, sy, 6, 2); box(sx, sy - 2, 2, 6); }
    else box(sx, sy, 2, 2);
  }
  box(132, 30, 16, 4); box(128, 34, 18, 4); box(124, 38, 20, 16); box(128, 54, 18, 4); box(132, 58, 16, 4);
}

function drawSeasonFx(pal, t, ssn) {
  ctx.fillStyle = pal.fg;
  if (ssn === 0) {
    for (const p of petals) {
      const x = Math.round(wrp(p.x - t * p.h + Math.sin(t * 1.7 + p.ph) * 14, W + 40) - 20);
      const y = Math.round(wrp(p.y + t * p.v, GROUND - 6));
      box(x, y, 4, 2); box(x + (Math.floor(t * 5 + p.ph) % 2 ? 3 : 0), y + 2, 1, 2);
    }
  } else if (ssn === 2) {
    for (const p of leaves) {
      const x = Math.round(wrp(p.x - t * p.h + Math.sin(t * 2.4 + p.ph) * 18, W + 60) - 30);
      const y = Math.round(wrp(p.y + t * p.v, GROUND - 8));
      const flip = Math.floor(t * 7 + p.r) % 2;
      box(x, y, 3, 3); ctx.fillStyle = pal.bg;
      box(x + (flip ? 0 : 2), y + (flip ? 2 : 0), 1, 1);
      ctx.fillStyle = pal.fg;
    }
  } else if (ssn === 3) {
    for (const p of flakes) {
      const x = Math.round(wrp(p.x - t * p.h + Math.sin(t + p.ph) * 8, W + 30) - 15);
      const y = Math.round(wrp(p.y + t * p.v, GROUND - 4));
      if (p.big) { box(x, y, 7, 2); box(x + 2, y - 2, 2, 7); }
      else       { box(x, y, 5, 1); box(x + 2, y - 2, 1, 5); }
    }
  }
}

// ---------- UI rendering & menus ----------
const blinkNow = (t, period, duty) => (t % period) < duty;

function drawPixelButton(pal, x, y, w, h, text, isHover) {
  ctx.fillStyle = isHover ? pal.fg : pal.bg;
  box(x, y, w, h);
  ctx.fillStyle = isHover ? pal.bg : pal.fg;
  box(x, y, w, 2); box(x, y + h - 2, w, 2);
  box(x, y, 2, h); box(x + w - 2, y, 2, h);
  drawText(text, x + w / 2, y + (h - 14) / 2, 2, isHover ? pal.bg : pal.fg, { align: 'center', outline: null });
}

function drawHUD(pal, t) {
  // Top-Right: Hi & Score
  const opts = { gap: 3, align: 'right', outline: pal.bg };
  if (hiNew && state === 'dead' && deathT < 1.8 && Math.floor(t * 6) % 2 === 1) {
    drawText(pad5(Math.floor(score)), W - 20, 14, 2, pal.fg, opts);
  } else {
    drawText('HI ' + pad5(hi) + ' ' + pad5(Math.floor(score)), W - 20, 14, 2, pal.fg, opts);
  }

  // Top-Left: Speaker icon + Live Egg Counter
  drawSpeaker(pal, audio.mode);
  drawEgg(pal, 58, 14, Math.floor(t * 4) % 2);
  drawText('x ' + pad5(state === 'playing' ? stats.eggs : bankEggs), 82, 16, 2, pal.fg, { gap: 2, outline: pal.bg });

  // Top-Center: Speedometer / Danger Gauge
  if (state === 'playing') {
    const spdPct = clamp((speed - 400) / 540, 0, 1);
    const bars = Math.min(5, Math.floor(spdPct * 5) + 1);
    let meterStr = 'SPD [';
    for (let b = 0; b < 5; b++) meterStr += (b < bars ? '■' : '□');
    meterStr += '] ' + Math.round(speed);
    drawText(meterStr, W / 2, 14, 2, pal.fg, { align: 'center', gap: 2, outline: pal.bg });
  }

  // Flying Danger Telegraph on Right Edge (falcon / owl)
  if (state === 'playing') {
    for (const o of obstacles) {
      if (o.fly && o.x > W - 150 && o.x < W + 80) {
        if (Math.floor(t * 10) % 2 === 0) {
          ctx.fillStyle = pal.fg;
          box(W - 130, GROUND - 68, 120, 20);
          ctx.fillStyle = pal.bg;
          box(W - 128, GROUND - 66, 116, 16);
          const warn = o.type === 'falcon' ? 'FALCON' : 'OWL';
          drawText('▲ DUCK ' + warn + ' ▲', W - 70, GROUND - 63, 1, pal.fg, { align: 'center', gap: 2 });
        }
      }
    }
  }

  // Milestone Banner
  if (milestoneBanner) {
    const bx = W / 2 - 160, by = 60, bw = 320, bh = 28;
    ctx.fillStyle = pal.bg; box(bx, by, bw, bh);
    ctx.fillStyle = pal.fg;
    box(bx, by, bw, 3); box(bx, by + bh - 3, bw, 3);
    box(bx, by, 3, bh); box(bx + bw - 3, by, 3, bh);
    drawText(milestoneBanner.text, W / 2, by + 7, 2, pal.fg, { align: 'center', gap: 3 });
  }

  // Floating Texts (Near-miss, egg streaks)
  for (const ft of floatingTexts) {
    const alphaFrac = ft.life / ft.maxLife;
    if (alphaFrac < 0.3 && Math.floor(t * 16) % 2 === 1) continue;
    drawText(ft.text, ft.x, ft.y, 2, pal.fg, { align: 'center', outline: pal.bg });
  }
}

function drawSpeaker(pal, mode) {
  const x = SPEAKER_BOX.x, y = SPEAKER_BOX.y;
  ctx.fillStyle = pal.fg;
  box(x, y + 9, 5, 8);
  box(x + 5, y + 6, 4, 14);
  box(x + 9, y + 3, 3, 20);
  if (mode === 2) { // MUTED
    box(x + 17, y + 6, 2, 14);
    box(x + 15, y + 5, 2, 2); box(x + 19, y + 5, 2, 2);
    box(x + 15, y + 19, 2, 2); box(x + 19, y + 19, 2, 2);
  } else if (mode === 1) { // SFX ONLY
    box(x + 16, y + 7, 2, 12);
  } else { // ALL
    box(x + 15, y + 8, 2, 10);
    box(x + 20, y + 5, 2, 16);
  }
}

function drawScreens(pal, t) {
  clearButtons();

  if (state === 'menu') {
    drawText('CHICKEN RUNNER', W / 2, 40, 5, pal.fg, { gap: 8, align: 'center', outline: pal.bg });
    const seasonsList = ['SPRING 🌸', 'SUMMER ☀️', 'AUTUMN 🍂', 'WINTER ❄️'];
    drawText('WORLD // ' + seasonsList[season], W / 2, 84, 1, pal.fg, { gap: 2, align: 'center', outline: pal.bg });

    // Menu Buttons — width auto-fits the longest label (drawn at scale 2)
    const btnH = 24, step = 27, startY = 100;
    const items = [
      { id: 'btn_play',    label: '1. START RUN', action: () => resetRun() },
      { id: 'btn_roster',  label: '2. CHICKEN: ' + CHICKENS[activeChicken].name, action: () => { state = 'chickens'; rosterSelect = activeChicken; } },
      { id: 'btn_shop',    label: '3. HAT SHOP', action: () => { state = 'shop'; shopSelect = activeHat; } },
      { id: 'btn_help',    label: '4. HOW TO PLAY', action: () => { state = 'howtoplay'; } },
      { id: 'btn_rec',     label: '5. HALL OF FAME', action: () => { state = 'records'; } },
      { id: 'btn_badg',    label: '6. BADGES', action: () => { state = 'badges'; } }
    ];
    const btnW = Math.max(260, Math.max(...items.map(it => textW(it.label, 2, 2))) + 28);
    const bx = W / 2 - btnW / 2;
    const listH = (items.length - 1) * step + btnH;   // 100..259

    // Framed panel behind the list
    ctx.fillStyle = pal.fg; box(bx - 5, startY - 5, btnW + 10, listH + 10);
    ctx.fillStyle = pal.bg; box(bx - 2, startY - 2, btnW + 4, listH + 4);

    items.forEach((item, idx) => {
      const by = startY + idx * step;
      addButton(item.id, bx, by, btnW, btnH, item.action, item.label);
      drawPixelButton(pal, bx, by, btnW, btnH, item.label, hoveredBtn === item.id);
    });

    if (blinkNow(t, 1.3, 0.85)) {
      drawText('[PRESS SPACE / TAP TO RUN · C FOR CHICKENS]', W / 2, 267, 1, pal.fg, { gap: 2, align: 'center', outline: pal.bg });
    }
  } else if (state === 'chickens') {
    drawText('// CHOOSE YOUR CHICKEN //', W / 2, 24, 3, pal.fg, { align: 'center', outline: pal.bg });
    drawText('ROOSTER ROSTER [' + (rosterSelect + 1) + ' / ' + CHICKENS.length + ']', W / 2, 48, 2, pal.fg, { align: 'center', outline: pal.bg });

    const c = CHICKENS[rosterSelect];
    const isCurrent = activeChicken === rosterSelect;

    // Center Stage Box
    const sbW = 460, sbH = 126, sbX = W / 2 - sbW / 2, sbY = 68;
    ctx.fillStyle = pal.fg; box(sbX, sbY, sbW, sbH);
    ctx.fillStyle = pal.bg; box(sbX + 3, sbY + 3, sbW - 6, sbH - 6);

    // Ground line inside stage
    ctx.fillStyle = pal.fg; box(sbX + 16, sbY + 98, 110, 2);

    // Animated Preview of the highlighted chicken
    const prevX = sbX + 36, prevY = sbY + 98 - STAND_H;
    drawChicken(pal, prevX, prevY, 'run', Math.floor(t * 8) % 2, false, rosterSelect);

    // Info panel on right side of stage
    drawText(c.name, sbX + 144, sbY + 16, 3, pal.fg, { outline: pal.bg });
    drawText('★ ' + c.title + ' ★', sbX + 144, sbY + 44, 1, pal.fg);
    drawText(c.desc, sbX + 144, sbY + 64, 1, pal.fg, { gap: 1 });

    if (isCurrent) {
      drawText('ACTIVE RUNNER [SELECTED]', sbX + 144, sbY + 92, 2, pal.fg, { outline: pal.bg });
    }

    // Prev / Next Navigation Buttons
    addButton('btn_c_prev', W / 2 - 270, 110, 50, 42, () => {
      rosterSelect = (rosterSelect - 1 + CHICKENS.length) % CHICKENS.length;
    }, '<');
    drawPixelButton(pal, W / 2 - 270, 110, 50, 42, '<', hoveredBtn === 'btn_c_prev');

    addButton('btn_c_next', W / 2 + 220, 110, 50, 42, () => {
      rosterSelect = (rosterSelect + 1) % CHICKENS.length;
    }, '>');
    drawPixelButton(pal, W / 2 + 220, 110, 50, 42, '>', hoveredBtn === 'btn_c_next');

    // Action button: SELECT & RUN
    const actLabel = isCurrent ? 'RUN WITH ' + c.name : 'SELECT & RUN';
    addButton('btn_c_select', W / 2 - 130, 204, 260, 30, () => {
      activeChicken = rosterSelect;
      saveChicken();
      audio.click();
      vibrate(20);
      showToast('RUNNER: ' + c.name);
      resetRun();
    }, actLabel);
    drawPixelButton(pal, W / 2 - 130, 204, 260, 30, actLabel, hoveredBtn === 'btn_c_select');

    // Back button
    addButton('btn_c_back', W / 2 - 70, 242, 140, 26, () => { state = 'menu'; }, 'BACK');
    drawPixelButton(pal, W / 2 - 70, 242, 140, 26, '< BACK', hoveredBtn === 'btn_c_back');
  } else if (state === 'howtoplay') {
    drawText('// HOW TO PLAY //', W / 2, 30, 3, pal.fg, { align: 'center', outline: pal.bg });

    // Section 1: Jump
    drawText('▲ JUMP [SPACE / UP / RIGHT TAP]', 90, 80, 2, pal.fg, { outline: pal.bg });
    drawText('CLEAR SPIKES, FENCES, FOXES & HAY', 90, 102, 1, pal.fg, { outline: pal.bg });

    // Section 2: Slide
    drawText('▼ SLIDE [DOWN / S / LEFT TAP]', 90, 134, 2, pal.fg, { outline: pal.bg });
    drawText('DUCK UNDER FALCONS, OWLS & FAST-FALL', 90, 156, 1, pal.fg, { outline: pal.bg });

    // Section 3: Eggs & Near Miss
    drawText('🥚 COLLECT EGGS & NEAR-MISS', 90, 188, 2, pal.fg, { outline: pal.bg });
    drawText('CHAIN EGGS FOR STREAKS & BUY HATS IN SHOP', 90, 210, 1, pal.fg, { outline: pal.bg });

    // Back button
    addButton('btn_back', W / 2 - 70, 240, 140, 28, () => { state = 'menu'; }, 'BACK');
    drawPixelButton(pal, W / 2 - 70, 240, 140, 28, '< BACK', hoveredBtn === 'btn_back');
  } else if (state === 'shop') {
    drawText('// 1-BIT HAT BOUTIQUE //', W / 2, 30, 3, pal.fg, { align: 'center', outline: pal.bg });
    drawText('BANK: ' + pad5(bankEggs) + ' EGGS', W / 2, 60, 2, pal.fg, { align: 'center', outline: pal.bg });

    // Central Preview Stage
    const hat = HATS[shopSelect];
    const isUnlocked = unlockedHats[shopSelect];
    const isEquipped = activeHat === shopSelect;

    ctx.fillStyle = pal.fg;
    box(W / 2 - 120, 80, 240, 110);
    ctx.fillStyle = pal.bg;
    box(W / 2 - 116, 84, 232, 102);

    // Draw preview chicken standing with the currently selected hat
    const prevX = W / 2 - STAND_W / 2;
    const prevY = 100;
    drawChicken(pal, prevX, prevY, 'run', Math.floor(t * 8) % 2, false, activeChicken, shopSelect);

    // Hat Details
    drawText(hat.name, W / 2, 160, 2, pal.fg, { align: 'center' });
    drawText(hat.desc, W / 2, 178, 1, pal.fg, { align: 'center' });

    // Prev / Next Buttons
    addButton('btn_prev', W / 2 - 190, 116, 50, 36, () => {
      shopSelect = (shopSelect - 1 + HATS.length) % HATS.length;
    }, '<');
    drawPixelButton(pal, W / 2 - 190, 116, 50, 36, '<', hoveredBtn === 'btn_prev');

    addButton('btn_next', W / 2 + 140, 116, 50, 36, () => {
      shopSelect = (shopSelect + 1) % HATS.length;
    }, '>');
    drawPixelButton(pal, W / 2 + 140, 116, 50, 36, '>', hoveredBtn === 'btn_next');

    // Purchase / Equip Button
    let actionLabel = isEquipped ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : 'BUY (' + hat.cost + ' EGGS)';
    addButton('btn_buy_equip', W / 2 - 100, 204, 200, 30, () => {
      if (isEquipped) return;
      if (isUnlocked) {
        activeHat = shopSelect;
        saveShopData();
        audio.click();
      } else if (bankEggs >= hat.cost) {
        bankEggs -= hat.cost;
        unlockedHats[shopSelect] = true;
        activeHat = shopSelect;
        saveShopData();
        audio.buy();
        showToast('PURCHASED: ' + hat.name);
      } else {
        audio.blip();
        showToast('NOT ENOUGH EGGS!');
      }
    }, actionLabel);
    drawPixelButton(pal, W / 2 - 100, 204, 200, 30, actionLabel, hoveredBtn === 'btn_buy_equip');

    // Back button
    addButton('btn_shop_back', W / 2 - 70, 244, 140, 26, () => { state = 'menu'; }, 'BACK');
    drawPixelButton(pal, W / 2 - 70, 244, 140, 26, '< BACK', hoveredBtn === 'btn_shop_back');
  } else if (state === 'records') {
    drawText('// HALL OF FAME //', W / 2, 30, 3, pal.fg, { align: 'center', outline: pal.bg });

    const rx = W / 2 - 200, ry = 66;
    drawText('RANK   DISTANCE   EGGS   DATE', rx, ry, 2, pal.fg, { gap: 2, outline: pal.bg });
    box(rx, ry + 18, 400, 2);

    if (top5.length === 0) {
      drawText('NO RUNS LOGGED YET!', W / 2, ry + 40, 2, pal.fg, { align: 'center', outline: pal.bg });
    } else {
      top5.forEach((r, idx) => {
        const rowStr = '#' + (idx + 1) + '     ' + pad5(r.score) + 'M     ' + pad5(r.eggs) + '   ' + (r.date || '--/--');
        drawText(rowStr, rx, ry + 28 + idx * 24, 2, pal.fg, { gap: 2, outline: pal.bg });
      });
    }

    addButton('btn_rec_back', W / 2 - 70, 236, 140, 28, () => { state = 'menu'; }, 'BACK');
    drawPixelButton(pal, W / 2 - 70, 236, 140, 28, '< BACK', hoveredBtn === 'btn_rec_back');
  } else if (state === 'badges') {
    drawText('// RETRO ACHIEVEMENTS //', W / 2, 28, 3, pal.fg, { align: 'center', outline: pal.bg });

    const colW = 380, startY = 64;
    BADGES.forEach((b, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = W / 2 - 390 + col * 400;
      const by = startY + row * 46;
      const isUn = unlockedBadges[idx];

      ctx.fillStyle = pal.fg;
      box(bx, by, colW, 40);
      ctx.fillStyle = pal.bg;
      box(bx + 2, by + 2, colW - 4, 36);

      const mark = isUn ? '★' : '□';
      drawText(mark + ' ' + b.title, bx + 10, by + 8, 2, pal.fg);
      drawText(b.desc, bx + 10, by + 24, 1, pal.fg);
    });

    addButton('btn_badg_back', W / 2 - 70, 236, 140, 28, () => { state = 'menu'; }, 'BACK');
    drawPixelButton(pal, W / 2 - 70, 236, 140, 28, '< BACK', hoveredBtn === 'btn_badg_back');
  } else if (state === 'paused') {
    ditherRect(pal, 0, 0, W, H, true);
    drawText('PAUSED', W / 2, 40, 4, pal.fg, { gap: 8, align: 'center', outline: pal.bg });

    const btnW = 180, btnH = 28, startY = 96;
    const pItems = [
      { id: 'btn_resume', label: 'RESUME [P]', action: () => { state = 'playing'; } },
      { id: 'btn_restart', label: 'RESTART [R]', action: () => { resetRun(); } },
      { id: 'btn_p_audio', label: 'AUDIO: ' + (audio.mode === 0 ? 'ALL' : audio.mode === 1 ? 'SFX' : 'OFF'), action: () => { audio.cycleMode(); } },
      { id: 'btn_p_theme', label: 'THEME: ' + PALETTES[currentThemeKey].name, action: () => {
        const idx = (THEME_KEYS.indexOf(currentThemeKey) + 1) % THEME_KEYS.length;
        applyTheme(THEME_KEYS[idx]);
      } },
      { id: 'btn_quit', label: 'QUIT TO MENU', action: () => { state = 'menu'; } }
    ];

    pItems.forEach((item, idx) => {
      const bx = W / 2 - btnW / 2;
      const by = startY + idx * 34;
      addButton(item.id, bx, by, btnW, btnH, item.action, item.label);
      drawPixelButton(pal, bx, by, btnW, btnH, item.label, hoveredBtn === item.id);
    });
  } else if (state === 'dead' && deathT > 0.8) {
    // Arcade Receipt / Scorecard Frame
    const rw = 440, rh = 186, rx = W / 2 - rw / 2, ry = 24;
    ctx.fillStyle = pal.bg; box(rx, ry, rw, rh);
    ctx.fillStyle = pal.fg;
    box(rx, ry, rw, 3); box(rx, ry + rh - 3, rw, 3);
    box(rx, ry, 3, rh); box(rx + rw - 3, ry, 3, rh);

    // Perforated edge marks
    for (let px = rx + 10; px < rx + rw - 10; px += 16) {
      box(px, ry - 3, 8, 3);
      box(px, ry + rh, 8, 3);
    }

    if (hiNew) {
      drawText('★ NEW HIGH SCORE RECORD! ★', W / 2, ry + 12, 2, pal.fg, { align: 'center', outline: pal.bg });
    } else {
      drawText('--- RUN SUMMARY RECEIPT ---', W / 2, ry + 12, 2, pal.fg, { align: 'center', outline: pal.bg });
    }

    box(rx + 16, ry + 32, rw - 32, 2);

    const leftX = rx + 24, rightX = rx + rw - 24;
    const statRows = [
      ['DISTANCE REACHED', pad5(Math.floor(score)) + ' M'],
      ['OBSTACLES CLEARED', pad5(stats.cleared)],
      ['EGGS COLLECTED', pad5(stats.eggs)],
      ['TOP VELOCITY', stats.top + ' PX/S'],
      ['TOTAL BANK EGGS', pad5(bankEggs)]
    ];

    statRows.forEach(([lbl, val], idx) => {
      drawText(lbl, leftX, ry + 44 + idx * 18, 1, pal.fg);
      drawText(val, rightX, ry + 44 + idx * 18, 1, pal.fg, { align: 'right' });
    });

    box(rx + 16, ry + 140, rw - 32, 2);

    // Action Buttons
    addButton('btn_again', rx + 24, ry + 148, 120, 28, () => resetRun(), 'PLAY AGAIN');
    drawPixelButton(pal, rx + 24, ry + 148, 120, 28, 'AGAIN', hoveredBtn === 'btn_again');

    addButton('btn_share', rx + 158, ry + 148, 130, 28, () => copyScoreToClipboard(), 'COPY SCORE');
    drawPixelButton(pal, rx + 158, ry + 148, 130, 28, 'COPY SCORE', hoveredBtn === 'btn_share');

    addButton('btn_d_menu', rx + 302, ry + 148, 114, 28, () => { state = 'menu'; }, 'MENU');
    drawPixelButton(pal, rx + 302, ry + 148, 114, 28, 'MENU', hoveredBtn === 'btn_d_menu');

    if (deathT > 1.3 && blinkNow(t, 1.3, 0.85)) {
      drawText('[SPACE / TAP TO REPLAY]', W / 2, 236, 2, pal.fg, { align: 'center', outline: pal.bg });
    }
  }
}

// ---------- render loop ----------
function drawShadow(pal) {
  if (state === 'dead') return;
  const pb = playerBox();
  const air = clamp((GROUND - (player.y + STAND_H)) / 67, 0, 1);
  const w = Math.round(44 - air * 20);
  ditherRect(pal, pb.x + pb.w / 2 - w / 2, GROUND + 5, w, 4);
}

function drawPlayer(pal, t) {
  const bx = player.x;
  if (state === 'dead') {
    if (deathFalling) {
      // Still dropping: panic pose tumbling down
      drawChicken(pal, bx, player.y, 'jump', Math.floor(t * 12) % 2, false);
      return;
    }
    // Sitting on its butt, legs out, dizzy stars circling the head
    drawChicken(pal, bx, GROUND - 12 * S, 'dead', 0, false);
    ctx.fillStyle = pal.fg;
    // Orbit centre = the seated head (sprite y2..6 → screen GROUND-30..-18, x≈bx+30)
    const hx = bx + 30, hy = GROUND - 30;
    for (const f of deathStars) {
      const sx = hx + Math.cos(f.a) * f.r, sy = hy + Math.sin(f.a) * f.r * 0.55;
      drawText('★', sx, sy, 1, pal.fg, { align: 'center', outline: pal.bg });
    }
    return;
  }
  const bl = blinkT < 0 && state !== 'paused';
  if (player.ducking && player.onGround) drawChicken(pal, bx, player.y + SLIDE_OFF, 'duck', 0, false);
  else if (!player.onGround) drawChicken(pal, bx, player.y, 'jump', player.frame, false);
  else if (state === 'menu' && idleT < 0 && idleT > -0.3) drawChicken(pal, bx, GROUND - 12 * S, 'peck', 0, false);
  else drawChicken(pal, bx, player.y, 'run', state === 'menu' ? Math.floor(t * 9) % 2 : player.frame, bl);
}

function render() {
  const pal = C;
  const t = time;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (shake > 0) ctx.translate(Math.round(rand(-1, 1) * shake * 14), Math.round(rand(-1, 1) * shake * 14));
  ctx.fillStyle = pal.bg;
  ctx.fillRect(-24, -24, W + 48, H + 48);

  drawSky(pal, t, nightTarget, season);
  drawHills(pal, season);
  for (const cl of clouds) drawCloud(pal, cl);
  drawGround(pal, season);
  drawSeasonFx(pal, t, season);

  ctx.fillStyle = pal.fg;
  for (const p of picks) drawEgg(pal, p.x, p.y, p.ph);
  for (const o of obstacles) drawObstacle(pal, t, o);

  drawShadow(pal);
  drawPlayer(pal, t);

  ctx.fillStyle = pal.fg;
  for (const p of parts) {
    const sz = Math.round(p.life > 0.5 ? p.s : p.life > 0.25 ? Math.max(2, p.s - 2) : 1);
    if (p.line) { const ls = Math.round(p.s); box(Math.round(p.x), Math.round(p.y), ls * 6, ls); }
    else box(Math.round(p.x), Math.round(p.y), sz, sz);
  }

  drawHUD(pal, t);
  drawScreens(pal, t);

  // Transition Curtain Wipe
  if (curtainT > 0) {
    const w = (curtainT / 0.35) * W;
    ditherRect(pal, 0, 0, w, H, true);
  }

  // Hard Invert Flash (zero gray)
  if (flash > 0 && Math.floor(flash * 30) % 2 === 0) {
    ctx.fillStyle = pal.fg;
    ctx.fillRect(-24, -24, W + 48, H + 48);
  }
}

// ---------- animation loop ----------
let last = performance.now();
function frame(t) {
  const dt = clamp((t - last) / 1000, 0, 0.05);
  last = t;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// ---------- public test seam (preserved & extended) ----------
window.ChickenRunner = {
  frame,
  die,
  setScore: v => { score = v; },
  resetRun,
  setTheme: applyTheme,
  setChicken: idx => {
    if (idx >= 0 && idx < CHICKENS.length) {
      activeChicken = idx;
      saveChicken();
    }
  },
  getChickens: () => CHICKENS,
  snapshot: () => {
    let next = null;
    for (const o of obstacles) {
      if (o.x + o.w > player.x + 40 && (!next || o.x < next.x)) {
        next = { x: o.x, w: o.w, type: o.type };
      }
    }
    return {
      state, score, deathT, speed, flash, season,
      onGround: player.onGround, px: player.x, next,
      eggs: stats.eggs, bank: bankEggs, activeHat,
      activeChicken, chickenName: CHICKENS[activeChicken].name
    };
  },
  grayCount: () => {
    const d = ctx.getImageData(0, 0, W, H).data;
    let n = 0;
    const bg = curBg(), fg = curFg();
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const isClassic = (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255);
      const isTheme = (r === bg[0] && g === bg[1] && b === bg[2]) || (r === fg[0] && g === fg[1] && b === fg[2]);
      if (!isClassic && !isTheme) n++;
    }
    return n;
  }
};

// Legacy alias — keeps old test scripts working
window.PiRunner = window.ChickenRunner;

requestAnimationFrame(frame);
})();
