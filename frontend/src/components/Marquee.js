/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MARQUEE COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Endlos scrollender Text-Banner mit verschiedenen Farbvarianten.
 *  Verwendet CSS-Animationen fuer performante Darstellung.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

const variants = {
  blue: {
    wrapper: 'bg-blue-500',
    text: 'text-white/90',
    dot: 'bg-white/30',
  },
  gold: {
    wrapper: 'bg-gradient-to-r from-gold-50 via-amber-50 to-gold-50 border-y border-gold-200/40',
    text: 'text-amber-700/70',
    dot: 'bg-amber-400/40',
  },
  dark: {
    wrapper: 'bg-slate-900',
    text: 'text-white/60',
    dot: 'bg-white/20',
  },
  subtle: {
    wrapper: 'bg-slate-50/80 border-y border-slate-200/50',
    text: 'text-slate-400',
    dot: 'bg-slate-300/60',
  },
};

export default function Marquee({
  items = [],
  variant = 'blue',
  speed = 35,
  reverse = false,
  className = '',
}) {
  const style = variants[variant] || variants.blue;
  const expanded = [...items, ...items, ...items];

  const renderSet = (prefix) =>
    expanded.map((item, i) => (
      <React.Fragment key={`${prefix}-${i}`}>
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] shrink-0 whitespace-nowrap ${style.text}`}
        >
          {item}
        </span>
        <span className={`w-[5px] h-[5px] rounded-full shrink-0 mx-8 ${style.dot}`} />
      </React.Fragment>
    ));

  return (
    <div className={`overflow-hidden py-4 select-none ${style.wrapper} ${className}`}>
      <div
        className={`flex items-center ${reverse ? 'marquee-reverse' : 'marquee'}`}
        style={{ '--marquee-speed': `${speed}s` }}
      >
        {renderSet('a')}
        {renderSet('b')}
      </div>
    </div>
  );
}
