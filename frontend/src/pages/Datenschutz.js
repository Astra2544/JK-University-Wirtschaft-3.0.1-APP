/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DATENSCHUTZ PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Datenschutzerklaerung und DSGVO-Informationen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from '../components/Animations';
import { Shield, ExternalLink } from 'lucide-react';

const pv = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export default function Datenschutz() {
  const { t } = useTranslation();

  return (
    <motion.div variants={pv} initial="initial" animate="animate" exit="exit">
      {/* Hero Sektion */}
      <section data-testid="datenschutz-hero" className="relative pt-28 pb-16 md:pt-36 md:pb-20 px-5 overflow-hidden">
        <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-blue-50 blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-32 w-[400px] h-[400px] rounded-full bg-gold-50 blur-3xl opacity-60" />

        <div className="max-w-[800px] mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-gold-500" />
            <span className="text-sm text-slate-500 font-medium">{t('datenschutz.section')}</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight flex items-center gap-4">
            <Shield className="text-blue-500" size={40} />
            {t('datenschutz.title')}
          </motion.h1>
        </div>
      </section>

      {/* Datenschutz Content */}
      <section data-testid="datenschutz-content" className="py-12 px-5">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll>
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 shadow-sm">
              <div className="prose prose-slate max-w-none">
                <div className="space-y-6 text-slate-600 leading-relaxed">
                  <p>
                    {t('datenschutz.p1')}
                  </p>

                  <p>
                    {t('datenschutz.p2')}
                  </p>

                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <p className="font-semibold text-slate-800 mb-3">
                      {t('datenschutz.linkLabel')}
                    </p>
                    <a
                      href="https://oeh.jku.at/datenschutz"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="datenschutz-oeh-link"
                      className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
                    >
                      <ExternalLink size={16} />
                      https://oeh.jku.at/datenschutz
                    </a>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 italic" dangerouslySetInnerHTML={{ __html: t('datenschutz.note') }} />
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </motion.div>
  );
}
