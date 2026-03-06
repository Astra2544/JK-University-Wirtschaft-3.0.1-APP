/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ANIMATIONS COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Scroll-basierte Animationen mit Framer Motion.
 *  Elemente werden animiert sobald sie in den Viewport kommen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

export function RevealOnScroll({ children, className = '', delay = 0, direction = 'up' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const controls = useAnimation();
  const d = { up: { y: 30 }, down: { y: -30 }, left: { x: -30 }, right: { x: 30 } };

  useEffect(() => {
    if (isInView) controls.start({ opacity: 1, x: 0, y: 0, transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] } });
  }, [isInView, controls, delay]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, ...d[direction] }} animate={controls} className={className}>
      {children}
    </motion.div>
  );
}
