/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  STUDIENPLANER PAGE | ÖH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Beschreibung:
 *  Seite mit Links zu den Studienplanern für verschiedene Studiengänge.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Böhmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from '../components/Animations';
import { BookOpen, ArrowUpRight, ArrowRight, FileText, Download } from 'lucide-react';
import Marquee from '../components/Marquee';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100 hover:border-blue-300',
    icon: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-500',
    btn: 'bg-blue-500 hover:bg-blue-600',
    btnSecondary: 'text-blue-600 hover:bg-blue-50 border-blue-200'
  },
  gold: {
    bg: 'bg-amber-50',
    border: 'border-amber-100 hover:border-amber-300',
    icon: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-500',
    btn: 'bg-amber-500 hover:bg-amber-600',
    btnSecondary: 'text-amber-600 hover:bg-amber-50 border-amber-200'
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-100 hover:border-teal-300',
    icon: 'bg-teal-100 text-teal-600',
    badge: 'bg-teal-500',
    btn: 'bg-teal-500 hover:bg-teal-600',
    btnSecondary: 'text-teal-600 hover:bg-teal-50 border-teal-200'
  }
};

export default function Studienplaner() {
  const { t } = useTranslation();

  const studienplaner = [
    {
      title: 'Wirtschaftswissenschaften',
      shortName: 'WiWi',
      url: 'https://heyzine.com/flip-book/4efdf121a1.html',
      color: 'blue',
      description: t('studienplaner.descriptions.wiwi')
    },
    {
      title: 'Betriebswirtschaftslehre',
      shortName: 'BWL',
      url: 'https://heyzine.com/flip-book/93d13220c6.html',
      color: 'gold',
      description: t('studienplaner.descriptions.bwl')
    },
    {
      title: 'International Business Administration',
      shortName: 'IBA',
      url: 'https://heyzine.com/flip-book/2b404116c1.html',
      color: 'teal',
      description: t('studienplaner.descriptions.iba')
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <section className="pt-28 pb-12 md:pt-40 md:pb-16 px-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div className="absolute top-8 -right-20 md:top-4 md:-right-10 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-gold-50/70 blur-3xl" />
            <div className="absolute -top-20 left-1/3 w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-full bg-blue-500/[0.04] blur-2xl" />
            <div className="absolute bottom-0 -left-10 w-[250px] h-[250px] md:w-[300px] md:h-[300px] rounded-full bg-gold-100/40 blur-3xl" />

            <svg className="absolute top-12 right-[15%] md:top-16 md:right-[20%] w-[120px] h-[120px] md:w-[200px] md:h-[200px] text-gold-500/[0.06]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5">
              <circle cx="100" cy="100" r="80" />
              <circle cx="100" cy="100" r="50" />
              <circle cx="100" cy="100" r="20" />
            </svg>

            <svg className="absolute bottom-8 left-[10%] md:bottom-4 md:left-[15%] w-[80px] h-[80px] md:w-[140px] md:h-[140px] text-blue-500/[0.08]" viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth="0.8">
              <rect x="20" y="20" width="100" height="100" rx="8" transform="rotate(15 70 70)" />
              <rect x="35" y="35" width="70" height="70" rx="4" transform="rotate(15 70 70)" />
            </svg>

            <div className="absolute top-1/3 right-[8%] md:right-[12%] w-[60px] h-[1px] md:w-[100px] bg-gradient-to-r from-transparent via-gold-300/20 to-transparent" />
            <div className="absolute top-[55%] left-[5%] md:left-[10%] w-[40px] h-[1px] md:w-[80px] bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />

            <div className="absolute top-20 left-[20%] w-1.5 h-1.5 rounded-full bg-gold-400/20" />
            <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-blue-500/15" />
            <div className="absolute bottom-16 right-[35%] w-1 h-1 rounded-full bg-gold-500/25" />
          </motion.div>
        </div>

        <div className="absolute top-[60%] right-[15%] sm:top-[58%] sm:right-[20%] md:right-[18%] lg:right-[22%] -translate-y-1/2 pointer-events-none z-[1]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-2 h-2 rounded-full bg-gold-500/50" />
            <div className="absolute -bottom-3 -right-3 w-1.5 h-1.5 rounded-full bg-blue-500/40" />
            <div className="absolute top-1/2 -right-6 w-8 h-[1px] bg-gradient-to-r from-gold-500/20 to-transparent" />

            <div className="relative w-[96px] h-[96px] sm:w-[90px] sm:h-[90px] md:w-[110px] md:h-[110px] lg:w-[135px] lg:h-[135px]">
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-slate-200/30" />

              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-[50px] h-[50px] sm:w-[48px] sm:h-[48px] md:w-[58px] md:h-[58px] lg:w-[70px] lg:h-[70px]" viewBox="0 0 80 80" fill="none">
                  <rect x="18" y="14" width="44" height="52" rx="3" fill="#3B82F6" fillOpacity="0.08" stroke="#3B82F6" strokeWidth="1.5" />
                  <rect x="22" y="14" width="40" height="52" rx="2" fill="white" fillOpacity="0.6" stroke="#3B82F6" strokeWidth="1" />
                  <line x1="18" y1="14" x2="18" y2="66" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="30" y1="26" x2="52" y2="26" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
                  <line x1="30" y1="33" x2="48" y2="33" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.3" />
                  <line x1="30" y1="40" x2="50" y2="40" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.25" />
                  <line x1="30" y1="47" x2="44" y2="47" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.2" />
                  <rect x="28" y="54" width="16" height="5" rx="2" fill="#EAB308" fillOpacity="0.25" stroke="#EAB308" strokeWidth="0.8" />
                  <circle cx="56" cy="20" r="1.5" fill="#EAB308" fillOpacity="0.5" />
                </svg>
              </div>

              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gold-500/80" />
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-1.5 h-1.5 rounded-full bg-blue-400/50" />
            </div>

            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-5 md:h-5 rounded-full border border-dashed border-gold-500/30" />
          </motion.div>
        </div>

        <div className="max-w-[1120px] mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[3px] rounded-full bg-gold-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                {t('studienplaner.section')}
              </p>
            </div>
            <h1
              data-testid="studienplaner-title"
              className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4"
            >
              {t('studienplaner.title')}
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
              {t('studienplaner.desc')}
            </p>
          </motion.div>
        </div>
      </section>

      <Marquee
        items={t('studienplaner.marquee', { returnObjects: true })}
        variant="blue"
        speed={35}
        reverse
      />

      {/* Studienplaner Cards */}
      <section data-testid="studienplaner-cards-section" className="px-5 pt-10 pb-16">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studienplaner.map((planer, index) => {
              const colors = colorClasses[planer.color];
              return (
                <RevealOnScroll key={planer.title} delay={index * 0.1}>
                  <div
                    data-testid={`studienplaner-card-${planer.shortName.toLowerCase()}`}
                    className={`${colors.bg} rounded-2xl border-2 ${colors.border} p-6 transition-all hover:shadow-lg group`}
                  >
                    {/* Icon & Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center`}>
                        <BookOpen size={28} />
                      </div>
                      <span className={`${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {planer.shortName}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {planer.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                      {planer.description}
                    </p>

                    {/* Button */}
                    <a
                      href={planer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`studienplaner-btn-${planer.shortName.toLowerCase()}`}
                      className={`w-full ${colors.btn} text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md group-hover:scale-[1.02]`}
                    >
                      <FileText size={18} />
                      {t('studienplaner.openBtn')}
                      <ArrowUpRight size={16} className="ml-1" />
                    </a>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Info Box */}
      <section className="px-5 pb-16">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Download size={24} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('studienplaner.printTitle')}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {t('studienplaner.printDesc')}
                  </p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20">
        <div className="max-w-[900px] mx-auto">
          <RevealOnScroll>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 md:p-10 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                {t('studienplaner.ctaTitle')}
              </h2>
              <p className="text-blue-100 mb-6 max-w-md mx-auto">
                {t('studienplaner.ctaDesc')}
              </p>
              <Link
                to="/contact"
                data-testid="studienplaner-contact-btn"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-white hover:bg-blue-50 px-6 py-3 rounded-full transition-all"
              >
                {t('studienplaner.ctaBtn')} <ArrowRight size={15} />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

    </motion.div>
  );
}
