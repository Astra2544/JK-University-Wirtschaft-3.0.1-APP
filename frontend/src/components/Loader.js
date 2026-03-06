/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LOADER COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Animierte Ladeseite die beim Start der Applikation angezeigt wird.
 *  Verwendet Framer Motion fuer sanfte Animationen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div data-testid="page-loader" className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <motion.div className="flex items-center gap-1.5 mb-6">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className={`w-2.5 h-2.5 rounded-full ${i === 1 ? 'bg-gold-500' : 'bg-blue-500'}`}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-sm font-medium text-slate-400 tracking-wide">ÖH Wirtschaft</motion.p>
    </div>
  );
}
