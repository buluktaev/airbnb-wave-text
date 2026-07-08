import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDialKitController, DialRoot } from 'dialkit';
import 'dialkit/styles.css';
import { playWave, exportCode } from './waveText.js';
import CodeSheet from './CodeSheet.jsx';

const DEFAULT_EASING = 'easeOutCubic';

export default function App() {
  const waveRef = useRef(null);
  const playRef = useRef(() => {});
  const [sheetOpen, setSheetOpen] = useState(false);

  // Theme comes from the OS. The wave text's resting color follows it (--ink
  // from styles.css: near-black on light, near-white on dark) instead of a
  // fixed hex — that's why there's no manual "Base" swatch anymore.
  const [, forceThemeUpdate] = useState(0);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => forceThemeUpdate((t) => t + 1);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  const base = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();

  const dial = useDialKitController(
    'Wave Text',
    {
      text: { type: 'text', default: "I'm on a seafood diet. I see food and I eat it.", placeholder: 'Text' },
      accent: { type: 'color', default: '#178b49' },
      peak: [1.2, 1, 1.6, 0.01],
      stagger: [12, 0, 60, 1],
      initialDelay: [150, 0, 2000, 10],
      ramp: [200, 40, 600, 10],
      flash: [130, 0, 800, 10],
      colorTail: [130, 0, 800, 10],
      spring: { type: 'spring', visualDuration: 0.83, bounce: 0.5 },
      font: {
        size: [16, 10, 48, 1],
        weight: { type: 'select', options: ['400', '500', '600', '700'], default: '600' },
      },
      reset: { type: 'action', label: 'Reset to defaults' },
    },
    {
      persist: { key: 'wave-text', presets: true },
      onAction: (path) => { if (path === 'reset') dial.resetValues(); },
    },
  );
  const p = dial.values;

  const params = useMemo(() => ({
    text: p.text,
    accent: p.accent,
    base,
    peak: p.peak,
    stagger: p.stagger,
    initialDelay: p.initialDelay,
    ramp: p.ramp,
    flash: p.flash,
    colorTail: p.colorTail,
    easing: DEFAULT_EASING,
    spring: p.spring,
    fontSize: p.font.size,
    fontWeight: p.font.weight,
  }), [p.text, p.accent, base, p.peak, p.stagger, p.initialDelay, p.ramp, p.flash, p.colorTail, JSON.stringify(p.spring), p.font.size, p.font.weight]);

  // Split text into words→characters. Spaces are also .ch so the wave index stays continuous.
  const words = useMemo(() => params.text.split(' '), [params.text]);

  useEffect(() => {
    const wave = waveRef.current;
    if (!wave) return;

    const els = Array.from(wave.querySelectorAll('.ch'));
    els.forEach((el) => { el.style.color = params.base; }); // resting state = base color

    // Play immediately — on mount and on every param change.
    // The "Animate" button just replays the same run on click.
    let anims = playWave(els, params);
    playRef.current = () => {
      anims.forEach((a) => a.cancel && a.cancel());
      anims = playWave(els, params);
    };

    return () => { anims.forEach((a) => a.cancel && a.cancel()); };
  }, [params, words]);

  return (
    <div className="page">
      <span
        className="wave"
        ref={waveRef}
        style={{ fontSize: `${params.fontSize}px`, fontWeight: Number(params.fontWeight) }}
        aria-label={params.text}
      >
        {words.map((word, wi) => (
          <React.Fragment key={wi}>
            <span className="word">
              {Array.from(word).map((ch, ci) => (
                <span className="ch" key={ci} aria-hidden="true">{ch}</span>
              ))}
            </span>
            {wi < words.length - 1 && <span className="ch" aria-hidden="true">{' '}</span>}
          </React.Fragment>
        ))}
      </span>

      <div className="actions">
        <button type="button" className="animate-btn" onClick={() => playRef.current()}>
          Animate
        </button>
        <button type="button" className="icon-btn" onClick={() => setSheetOpen(true)} aria-label="Show code">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m8 8-4 4 4 4" />
            <path d="m16 8 4 4-4 4" />
          </svg>
        </button>
      </div>

      <aside className="dial-dock">
        <DialRoot mode="inline" productionEnabled />
      </aside>

      <CodeSheet open={sheetOpen} code={exportCode(params)} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
