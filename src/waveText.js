import { spring } from 'motion';
import { sampleEasing } from './easings.js';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(n, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function mixColor(a, b, t) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Engine for Airbnb's wave-text effect. Each character is its own span; it carries
// two WAAPI tracks (color and scale), both starting after initialDelay + stagger*i.
// Default values and keyframe structure are lifted 1:1 from the real
// element.animate() calls on airbnb.ru (reverse-engineered by patching Element.prototype.animate).

// Sample the Motion spring (the same one that draws the preview in DialKit's
// spring editor) so the scale tail matches the editor and can be baked into the export.
export function sampleSpring(springOpts, from, to, fps = 60) {
  const opts = { ...springOpts };
  delete opts.type; // motion spring() takes visualDuration/bounce or stiffness/damping/mass
  const gen = spring({ keyframes: [from, to], ...opts });
  const dt = 1000 / fps;
  const values = [];
  const maxMs = 6000;
  let settleMs = maxMs;
  let stable = 0;
  for (let t = 0; t <= maxMs; t += dt) {
    const r = gen.next(t);
    values.push(Math.round(r.value * 10000) / 10000);
    if (Math.abs(r.value - to) < 0.001) {
      if (++stable >= 3) { settleMs = t; break; }
    } else stable = 0;
    if (r.done) { settleMs = t; break; }
  }
  values[values.length - 1] = to;
  return { values, settleMs: Math.max(settleMs, 1) };
}

const RAMP_STEPS = 24;

// Color: base → accent, the rise shape is the selected named curve (sampled into
// points, so regular curves and bounce/elastic get the same handling) →
// hold (flash) → base (colorTail). Everything before the start is base.
export function buildColorKeyframes(base, accent, ramp, flash, colorTail, easingName) {
  const dur = Math.max(ramp + flash + colorTail, 1);
  const rampT = sampleEasing(easingName, RAMP_STEPS);
  const kf = rampT.map((t, i) => ({
    color: mixColor(base, accent, t),
    offset: (ramp * i) / RAMP_STEPS / dur,
    easing: 'linear',
  }));
  kf.push({ color: accent, offset: (ramp + flash) / dur, easing: 'ease' });
  kf.push({ color: base, offset: 1 });
  return { dur, kf };
}

// Scale: 1 → peak on the same named curve → spring decay back to 1 (Motion samples).
export function buildScaleKeyframes(peak, ramp, easingName, springValues, settleMs) {
  const total = Math.max(ramp + settleMs, 1);
  const rampT = sampleEasing(easingName, RAMP_STEPS);
  const kf = rampT.map((t, i) => ({
    transform: `scale(${1 + (peak - 1) * t})`,
    offset: (ramp * i) / RAMP_STEPS / total,
    easing: 'linear',
  }));
  const n = springValues.length;
  springValues.forEach((v, i) => {
    kf.push({ transform: `scale(${v})`, offset: (ramp + (settleMs * (i + 1)) / n) / total, easing: 'linear' });
  });
  kf[kf.length - 1].offset = 1;
  return { dur: total, kf };
}

// Plays the wave on an array of character elements. Returns the active Animations.
export function playWave(els, p) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => { el.style.color = p.base; el.style.transform = 'scale(1)'; });
    return [];
  }
  const { values, settleMs } = sampleSpring(p.spring, p.peak, 1);
  const color = buildColorKeyframes(p.base, p.accent, p.ramp, p.flash, p.colorTail, p.easing);
  const scale = buildScaleKeyframes(p.peak, p.ramp, p.easing, values, settleMs);
  const anims = [];
  els.forEach((el, i) => {
    const delay = p.initialDelay + p.stagger * i;
    anims.push(el.animate(color.kf, { duration: color.dur, delay, fill: 'both' }));
    anims.push(el.animate(scale.kf, { duration: scale.dur, delay, fill: 'both' }));
  });
  return anims;
}

// Self-contained vanilla snippet for the current params (no dependencies, no motion).
// The spring is baked into a plain number array, so motion isn't needed in the export.
// No trigger is wired in — the export just exposes a bare playWaveText(); the calling
// code decides when to call it (autoplay/scroll/hover/click is its own integration).
export function exportCode(p) {
  const { values, settleMs } = sampleSpring(p.spring, p.peak, 1);
  const rampT = sampleEasing(p.easing, RAMP_STEPS);
  const rampColor = rampT.map((t) => mixColor(p.base, p.accent, t));
  const rampScale = rampT.map((t) => Math.round((1 + (p.peak - 1) * t) * 10000) / 10000);
  const cfg = {
    accent: p.accent, base: p.base, peak: p.peak,
    ramp: p.ramp, flash: p.flash, colorTail: p.colorTail,
    stagger: p.stagger, initialDelay: p.initialDelay,
  };
  return `<span id="wave-text" style="font-size:${p.fontSize}px;font-weight:${p.fontWeight};color:${p.base}">${p.text}</span>
<script>
(function () {
  var el = document.getElementById('wave-text');
  var P = ${JSON.stringify(cfg)};
  var RAMP_COLOR = ${JSON.stringify(rampColor)}; // base→accent rise on the chosen curve (easing.dev), precomputed
  var RAMP_SCALE = ${JSON.stringify(rampScale)}; // the same rise, for scale
  var SPRING = ${JSON.stringify(values)};
  var SETTLE = ${Math.round(settleMs)};
  var text = el.textContent; el.textContent = '';
  var chars = [];
  function mk(c) {
    var s = document.createElement('span');
    s.textContent = c;
    s.style.display = 'inline-block';
    s.style.whiteSpace = 'pre';
    s.style.transformOrigin = '50% 100%';
    s.style.color = P.base;
    return s;
  }
  text.split(' ').forEach(function (w, wi, arr) {
    var we = document.createElement('span');
    we.style.display = 'inline-block'; we.style.whiteSpace = 'nowrap';
    Array.from(w).forEach(function (c) { var s = mk(c); we.appendChild(s); chars.push(s); });
    el.appendChild(we);
    if (wi < arr.length - 1) { var sp = mk(' '); el.appendChild(sp); chars.push(sp); }
  });
  function colorKf() {
    var D = P.ramp + P.flash + P.colorTail || 1;
    var n = RAMP_COLOR.length - 1;
    var kf = RAMP_COLOR.map(function (c, i) { return { color: c, offset: (P.ramp * i / n) / D, easing: 'linear' }; });
    kf.push({ color: P.accent, offset: (P.ramp + P.flash) / D, easing: 'ease' });
    kf.push({ color: P.base, offset: 1 });
    return { dur: D, kf: kf };
  }
  function scaleKf() {
    var total = P.ramp + SETTLE || 1;
    var n = RAMP_SCALE.length - 1;
    var kf = RAMP_SCALE.map(function (s, i) { return { transform: 'scale(' + s + ')', offset: (P.ramp * i / n) / total, easing: 'linear' }; });
    SPRING.forEach(function (v, i) {
      kf.push({ transform: 'scale(' + v + ')', offset: (P.ramp + SETTLE * (i + 1) / SPRING.length) / total, easing: 'linear' });
    });
    kf[kf.length - 1].offset = 1;
    return { dur: total, kf: kf };
  }
  function play() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = colorKf(), s = scaleKf();
    chars.forEach(function (el, i) {
      var d = P.initialDelay + P.stagger * i;
      el.animate(c.kf, { duration: c.dur, delay: d, fill: 'both' });
      el.animate(s.kf, { duration: s.dur, delay: d, fill: 'both' });
    });
  }
  window.playWaveText = play; // call it yourself: on load, on scroll, hover, click — your call
  // Examples:
  // el.addEventListener('mouseenter', play);         // on hover
  // el.addEventListener('click', play);               // on click
  // new IntersectionObserver(function (es) {           // on scroll into view
  //   es.forEach(function (e) { if (e.isIntersecting) play(); });
  // }, { threshold: 0.5 }).observe(el);
  play(); // default — right away on load
})();
<\/script>`;
}
