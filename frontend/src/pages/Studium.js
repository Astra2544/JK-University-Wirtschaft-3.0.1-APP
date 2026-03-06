/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  STUDIUM PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Uebersicht aller Studiengaenge und aktuelle Updates.
 *  Dynamisch aus der Datenbank geladen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { RevealOnScroll } from '../components/Animations';
import { ChevronDown, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';
import Marquee from '../components/Marquee';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const pv = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.5 } }, exit: { opacity: 0, transition: { duration: 0.2 } } };

const fallbackBrochures = [
  { title: 'Wirtschaftswissenschaften', url: 'https://heyzine.com/flip-book/4efdf121a1.html' },
  { title: 'Betriebswirtschaftslehre', url: 'https://heyzine.com/flip-book/93d13220c6.html' },
  { title: 'International Business Administration', url: 'https://heyzine.com/flip-book/2b404116c1.html' },
];

function Acc({ title, children, testId }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid={testId} className="border-b border-slate-100">
      <button onClick={() => setOpen(!open)} data-testid={`${testId}-toggle`}
        className="w-full flex items-center justify-between py-4 text-left group">
        <span className="text-[15px] font-medium text-slate-800 pr-4 group-hover:text-blue-500 transition-colors">{title}</span>
        <ChevronDown className={`text-slate-300 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} size={16} />
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
        <div className="pb-5 pl-1">{children}</div>
      </motion.div>
    </div>
  );
}

function ProgCard({ title, items, color }) {
  const colorClass = {
    blue: { text: 'text-blue-500', dot: 'bg-blue-500' },
    gold: { text: 'text-amber-500', dot: 'bg-amber-500' },
    green: { text: 'text-emerald-500', dot: 'bg-emerald-500' },
    purple: { text: 'text-purple-500', dot: 'bg-purple-500' },
  };
  const colors = colorClass[color] || colorClass.blue;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${colors.text}`}>{title}</p>
      <ul className="space-y-2">
        {items.map(p => (
          <li key={p.id} className="text-[15px] text-slate-600 flex items-start gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 ${colors.dot}`}/>
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Studium() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, updRes] = await Promise.all([
          fetch(`${API_URL}/api/study/categories`),
          fetch(`${API_URL}/api/study/updates/grouped`)
        ]);

        if (!catRes.ok || !updRes.ok) {
          throw new Error('API nicht erreichbar');
        }

        const catData = await catRes.json();
        const updData = await updRes.json();

        setCategories(catData.sort((a, b) => a.sort_order - b.sort_order));
        setUpdates(updData);
      } catch (err) {
        console.error('Error fetching study data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentSemester = updates.length > 0 && updates[0].updates?.[0]?.semester
    ? updates[0].updates[0].semester
    : 'Wintersemester 2025/26';

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
                  <path d="M40 18L10 30L40 42L70 30L40 18Z" fill="#3B82F6" fillOpacity="0.15" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 30V50L40 62L70 50V30" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                  <path d="M40 42V62" stroke="#3B82F6" strokeWidth="1.5" />
                  <path d="M10 30V50L40 62" fill="#3B82F6" fillOpacity="0.06" />
                  <circle cx="14" cy="50" r="2" fill="#EAB308" fillOpacity="0.6" />
                  <path d="M14 30V55" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 55C11 55 14 52 14 55C14 58 11 55 11 55" stroke="#EAB308" strokeWidth="1" />
                  <path d="M17 55C17 55 14 52 14 55C14 58 17 55 17 55" stroke="#EAB308" strokeWidth="1" />
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
            <div className="flex items-center gap-3 mb-4"><div className="w-8 h-[3px] rounded-full bg-blue-500" /><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('studium.section')}</p></div>
            <h1 data-testid="studium-page-title" className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">{t('studium.title')}</h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">{t('studium.desc')}</p>
          </motion.div>
        </div>
      </section>

      <Marquee
        items={t('studium.marquee', { returnObjects: true })}
        variant="gold"
        speed={36}
        reverse
      />

      <section data-testid="programs-list-section" className="pb-20 px-5">
        <div className="max-w-[1120px] mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-slate-500">
              <p>{t('studium.loadError')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                {categories.map((category, index) => {
                  const isLast = index === categories.length - 1;
                  const isOdd = categories.length % 2 !== 0;
                  return (
                    <RevealOnScroll
                      key={category.id}
                      delay={index * 0.05}
                      className={isLast && isOdd ? 'md:col-span-2' : ''}
                    >
                      <ProgCard
                        title={category.display_name}
                        items={category.programs.sort((a, b) => a.sort_order - b.sort_order)}
                        color={category.color || 'blue'}
                      />
                    </RevealOnScroll>
                  );
                })}
              </div>

              <RevealOnScroll>
                <div className="mb-16 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={20} className="text-blue-500"/>
                    <h2 className="text-xl font-bold text-slate-900">{t('studium.planner')}</h2>
                  </div>
                  <p className="text-[15px] text-slate-500 leading-relaxed mb-5 max-w-2xl">
                    {t('studium.plannerDesc')}
                  </p>
                  <Link
                    to="/studienplaner"
                    data-testid="studienplaner-link-btn"
                    className="inline-flex items-center gap-2 text-base font-semibold text-white bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full transition-all shadow-sm hover:shadow-md"
                  >
                    {t('studium.plannerBtn')} <ArrowRight size={18}/>
                  </Link>
                </div>
              </RevealOnScroll>

              <RevealOnScroll>
                <div className="flex items-center gap-3 mb-2"><div className="w-8 h-[3px] rounded-full bg-gold-500"/><p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('studium.updates')}</p></div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{t('studium.updatesTitle')}</h2>
                <p className="text-sm text-slate-500 mb-1 max-w-2xl">{t('studium.updatesSub')}</p>
                <p className="text-xs text-slate-400 mb-6">{t('studium.updatesDate')} <strong className="text-slate-500">{currentSemester}</strong></p>

                {updates.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
                    {t('studium.noUpdates')}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden px-6">
                    {updates.map((u, i) => (
                      <Acc key={u.program_id} title={u.program_name} testId={`update-${i}`}>
                        <ul className="space-y-2">
                          {u.updates.map((item, j) => (
                            <li key={item.id || j} className="text-sm text-slate-500 leading-relaxed flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-blue-500 mt-[8px] shrink-0"/>
                              {item.content}
                            </li>
                          ))}
                        </ul>
                      </Acc>
                    ))}
                  </div>
                )}
              </RevealOnScroll>
            </>
          )}
        </div>
      </section>

    </motion.div>
  );
}
