/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MAGAZINE PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Ceteris Paribus Magazin - Zeitschrift der OeH Wirtschaft.
 *  Enthaelt alle Ausgaben und Informationen zur Teilnahme.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { RevealOnScroll } from '../components/Animations';
import { ArrowUpRight } from 'lucide-react';
import Marquee from '../components/Marquee';

const pv = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.5 } }, exit: { opacity: 0, transition: { duration: 0.2 } } };
const editions = [
  { title: '1. Ausgabe (DE)', url: 'https://heyzine.com/flip-book/53367d0f95.html', lang: 'Deutsch' },
  { title: '1. Ausgabe (EN)', url: 'https://heyzine.com/flip-book/5ca1bd17d0.html', lang: 'English' },
];
const timeline = [
  { sem: 'Wintersemester 25/26', status: 'done', color: 'green', desc: 'Einreichfrist abgeschlossen. Du hast trotzdem eine Idee? Reiche sie für eine nächste Ausgabe ein!' },
  { sem: 'Sommersemester 26', status: 'progress', color: 'gold', desc: 'Die Sommerausgabe 2026 ist in Arbeit. Einreichfrist: 05.02.2026. Veröffentlichung: Ende April/Anfang Mai 2026.', form: 'https://docs.google.com/forms/d/e/1FAIpQLSdlWveMxwNX-kSZE_EXwTtKFELM5GPyy8gLycBlXrOfPU1j_w/viewform' },
  { sem: 'Wintersemester 26/27', status: 'planned', color: 'blue', desc: 'In Planung. Jetzt ist der beste Zeitpunkt für Themenvorschläge per Mail an wirtschaft@oeh.jku.at.' },
];

export default function Magazine() {
  const { t } = useTranslation();

  const statusLabel = (status) => {
    if (status === 'done') return t('magazine.statusDone');
    if (status === 'progress') return t('magazine.statusProgress');
    return t('magazine.statusPlanned');
  };

  return (
    <motion.div variants={pv} initial="initial" animate="animate" exit="exit">
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
                  <path d="M12 18C12 16 14 14 16 14H34C36 14 40 16 40 18V64C40 62 36 60 34 60H16C14 60 12 58 12 56V18Z" fill="#EAB308" fillOpacity="0.1" stroke="#EAB308" strokeWidth="1.5" />
                  <path d="M68 18C68 16 66 14 64 14H46C44 14 40 16 40 18V64C40 62 44 60 46 60H64C66 60 68 58 68 56V18Z" fill="#EAB308" fillOpacity="0.08" stroke="#EAB308" strokeWidth="1.5" />
                  <line x1="40" y1="16" x2="40" y2="62" stroke="#EAB308" strokeWidth="1.2" strokeOpacity="0.4" />
                  <line x1="18" y1="24" x2="34" y2="24" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
                  <line x1="18" y1="30" x2="32" y2="30" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
                  <line x1="18" y1="36" x2="30" y2="36" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25" />
                  <line x1="18" y1="42" x2="28" y2="42" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.2" />
                  <line x1="46" y1="24" x2="62" y2="24" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
                  <line x1="46" y1="30" x2="60" y2="30" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
                  <line x1="46" y1="36" x2="58" y2="36" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25" />
                  <rect x="46" y="42" width="14" height="10" rx="1" fill="#EAB308" fillOpacity="0.12" stroke="#EAB308" strokeWidth="0.6" />
                  <circle cx="62" cy="18" r="1.5" fill="#EAB308" fillOpacity="0.5" />
                  <circle cx="16" cy="54" r="1" fill="#3B82F6" fillOpacity="0.3" />
                </svg>
              </div>

              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gold-500/80" />
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-1.5 h-1.5 rounded-full bg-blue-400/50" />
            </div>

            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-5 md:h-5 rounded-full border border-dashed border-gold-500/30" />
          </motion.div>
        </div>

        <div className="max-w-[1120px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4"><div className="w-8 h-[3px] rounded-full bg-gold-500"/><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('magazine.section')}</p></div>
            <h1 data-testid="magazine-page-title" className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">{t('magazine.title')}</h1>
            <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">{t('magazine.desc')}</p>
          </motion.div>
        </div>
      </section>

      <Marquee
        items={t('magazine.marquee', { returnObjects: true })}
        variant="dark"
        speed={33}
      />

      <section className="pb-20 px-5 pt-10">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-16">
            <RevealOnScroll className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 h-full">
                <h2 className="text-xl font-bold text-slate-900 mb-4">{t('magazine.about')}</h2>
                <p className="text-[15px] text-slate-500 leading-[1.8] mb-3">{t('magazine.aboutP1')}</p>
                <p className="text-[15px] text-slate-500 leading-[1.8]">{t('magazine.aboutP2')}</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.05} className="lg:col-span-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 md:p-8 h-full">
                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-4">{t('magazine.currentEditions')}</p>
                <div className="space-y-3">
                  {editions.map(ed => (
                    <a key={ed.title} href={ed.url} target="_blank" rel="noopener noreferrer" data-testid={`edition-${ed.lang.toLowerCase()}`}
                      className="flex items-center justify-between py-3 border-b border-white/15 last:border-0 group">
                      <div><p className="text-white font-medium text-sm">{ed.title}</p><p className="text-blue-200 text-xs">{ed.lang}</p></div>
                      <ArrowUpRight size={15} className="text-blue-200 group-hover:text-gold-500 transition-colors"/>
                    </a>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-5"><div className="w-8 h-[3px] rounded-full bg-blue-500"/><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('magazine.contribute')}</p></div>
              <p className="text-[15px] text-slate-500 leading-relaxed mb-8 max-w-2xl">{t('magazine.contributeSub')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { id: 'who', t: t('magazine.who'), d: t('magazine.whoDesc') },
                  { id: 'what', t: t('magazine.what'), d: t('magazine.whatDesc') },
                  { id: 'how', t: t('magazine.how'), d: t('magazine.howDesc') },
                ].map(c => (
                  <div key={c.id} data-testid={`contribute-${c.id}`} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-sm font-bold text-slate-800 mb-2">{c.t}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">{c.d}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-sm font-bold text-slate-800 mb-2">{t('magazine.files')}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{t('magazine.filesDesc')}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-sm font-bold text-slate-800 mb-2">{t('magazine.rights')}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{t('magazine.rightsDesc')}</p>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div data-testid="submission-timeline">
              <div className="flex items-center gap-3 mb-5"><div className="w-8 h-[3px] rounded-full bg-gold-500"/><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('magazine.submissions')}</p></div>
              <div className="space-y-3">
                {timeline.map((tl, i) => {
                  const dotC = { green: 'bg-green-500', gold: 'bg-gold-500', blue: 'bg-blue-500' };
                  const badgeC = { green: 'bg-green-50 text-green-600', gold: 'bg-gold-50 text-gold-600', blue: 'bg-blue-50 text-blue-500' };
                  return (
                    <div key={tl.sem} data-testid={`timeline-${i}`} className="bg-white rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotC[tl.color]}`}/>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeC[tl.color]}`}>{statusLabel(tl.status)}</span>
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-slate-900 mb-1">{tl.sem}</p>
                        <p className="text-sm text-slate-400">{tl.desc}</p>
                        {tl.form && <a href={tl.form} target="_blank" rel="noopener noreferrer" data-testid="submit-form-btn"
                          className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors">{t('magazine.submitBtn')} <ArrowUpRight size={13}/></a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

    </motion.div>
  );
}
