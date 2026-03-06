/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DISABLED PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Angezeigt wenn eine Seite vom Admin deaktiviert wurde.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShieldOff, ArrowLeft, Mail } from 'lucide-react';

export default function DisabledPage() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-5 py-20 relative overflow-hidden"
    >
      <div className="absolute top-20 -right-40 w-[500px] h-[500px] rounded-full bg-blue-50 blur-3xl opacity-50" />
      <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-gold-50 blur-3xl opacity-50" />

      <div className="text-center relative max-w-lg">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-8 flex justify-center"
        >
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center shadow-lg shadow-slate-200/50">
            <ShieldOff size={56} className="text-slate-400" strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            {t('disabledPage.title')}
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed max-w-md mx-auto">
            {t('disabledPage.desc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/20"
          >
            <ArrowLeft size={16} /> {t('disabledPage.backHome')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"
        >
          <Mail size={14} />
          <span>{t('disabledPage.contact')}</span>
          <a href="mailto:wirtschaft@oeh.jku.at" className="text-blue-500 hover:underline">
            wirtschaft@oeh.jku.at
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}
