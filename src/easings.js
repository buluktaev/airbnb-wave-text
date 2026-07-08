// Canonical set of named curves from https://easing.dev (same set as easings.net).
// Bounce/elastic can't be expressed as a single cubic-bezier (multiple oscillations),
// so all 30 are computed from a closed-form formula in one uniform way — no branching
// on "bezier vs. not" for the other 24.

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

function bounceOut(x) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

export const EASINGS = {
  linear: (x) => x,
  easeInSine: (x) => 1 - Math.cos((x * Math.PI) / 2),
  easeOutSine: (x) => Math.sin((x * Math.PI) / 2),
  easeInOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  easeInQuad: (x) => x * x,
  easeOutQuad: (x) => 1 - (1 - x) * (1 - x),
  easeInOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) ** 2) / 2),
  easeInCubic: (x) => x ** 3,
  easeOutCubic: (x) => 1 - (1 - x) ** 3,
  easeInOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - ((-2 * x + 2) ** 3) / 2),
  easeInQuart: (x) => x ** 4,
  easeOutQuart: (x) => 1 - (1 - x) ** 4,
  easeInOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - ((-2 * x + 2) ** 4) / 2),
  easeInQuint: (x) => x ** 5,
  easeOutQuint: (x) => 1 - (1 - x) ** 5,
  easeInOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - ((-2 * x + 2) ** 5) / 2),
  easeInExpo: (x) => (x === 0 ? 0 : 2 ** (10 * x - 10)),
  easeOutExpo: (x) => (x === 1 ? 1 : 1 - 2 ** (-10 * x)),
  easeInOutExpo: (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? (2 ** (20 * x - 10)) / 2 : (2 - 2 ** (-20 * x + 10)) / 2),
  easeInCirc: (x) => 1 - Math.sqrt(1 - x ** 2),
  easeOutCirc: (x) => Math.sqrt(1 - (x - 1) ** 2),
  easeInOutCirc: (x) => (x < 0.5 ? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2 : (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2),
  easeInBack: (x) => c3 * x ** 3 - c1 * x ** 2,
  easeOutBack: (x) => 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2,
  easeInOutBack: (x) => (x < 0.5
    ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2
    : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2),
  easeInElastic: (x) => (x === 0 || x === 1 ? x : -(2 ** (10 * x - 10)) * Math.sin((x * 10 - 10.75) * c4)),
  easeOutElastic: (x) => (x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1),
  easeInOutElastic: (x) => (x === 0 || x === 1 ? x : x < 0.5
    ? -((2 ** (20 * x - 10)) * Math.sin((20 * x - 11.125) * c5)) / 2
    : ((2 ** (-20 * x + 10)) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1),
  easeInBounce: (x) => 1 - bounceOut(1 - x),
  easeOutBounce: bounceOut,
  easeInOutBounce: (x) => (x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2),
};

export const EASING_NAMES = Object.keys(EASINGS);

// Samples a named curve into steps+1 points over [0,1] → [0,1] (endpoints are exact).
export function sampleEasing(name, steps = 24) {
  const fn = EASINGS[name] || EASINGS.linear;
  const out = [];
  for (let i = 0; i <= steps; i++) out.push(fn(i / steps));
  out[0] = 0;
  out[out.length - 1] = 1;
  return out;
}
