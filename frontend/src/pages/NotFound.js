/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  404 NOT FOUND PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Fehlerseite fuer nicht gefundene URLs.
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
import { Home, Search, BookOpen, Users, HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  const quickLinks = [
    { to: '/', label: t('notFound.home'), icon: Home },
    { to: '/news', label: 'News', icon: Search },
    { to: '/team', label: 'Team', icon: Users },
    { to: '/studium', label: t('nav.studium'), icon: BookOpen },
    { to: '/contact', label: t('notFound.contactFaq'), icon: HelpCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-5 py-20 relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-20 -right-40 w-[500px] h-[500px] rounded-full bg-blue-50 blur-3xl opacity-50" />
      <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-gold-50 blur-3xl opacity-50" />

      <div className="text-center relative max-w-lg" data-testid="not-found-page">
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-6"
        >
          <span className="text-[150px] md:text-[180px] font-bold leading-none bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent">
            404
          </span>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            {t('notFound.title')}
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {t('notFound.desc')}
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
        >
          {quickLinks.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`404-link-${link.to.replace('/', '') || 'home'}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all group"
            >
              <link.icon size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium text-slate-600 group-hover:text-blue-500 transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            to="/"
            data-testid="not-found-home-btn"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/20"
          >
            <ArrowLeft size={16} /> {t('notFound.backHome')}
          </Link>
        </motion.div>

        {/* Fun Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-slate-400"
        >
          {t('notFound.fallback')}{' '}
          <a href="mailto:wirtschaft@oeh.jku.at" className="text-blue-500 hover:underline">
            wirtschaft@oeh.jku.at
          </a>
        </motion.p>
      </div>
    </motion.div>
  );
}
