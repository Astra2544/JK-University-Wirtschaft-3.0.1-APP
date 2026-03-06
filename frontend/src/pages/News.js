/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NEWS PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  News und Ankuendigungen der OeH Wirtschaft.
 *  Filterbar nach Prioritaet und mit Detailansicht.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from '../components/Animations';
import { AlertCircle, Clock, User, Pin, Eye, ChevronRight, Bell, Megaphone, AlertTriangle, Info } from 'lucide-react';
import Marquee from '../components/Marquee';

const pv = { 
  initial: { opacity: 0 }, 
  animate: { opacity: 1, transition: { duration: 0.5 } }, 
  exit: { opacity: 0, transition: { duration: 0.2 } } 
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Priority Icons and Styles
const priorityConfig = {
  urgent: { icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  high: { icon: AlertCircle, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  medium: { icon: Bell, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  low: { icon: Info, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' },
};

// Color Styles
const colorConfig = {
  blue: { accent: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  gold: { accent: 'bg-gold-500', light: 'bg-gold-50', text: 'text-gold-600', border: 'border-gold-200' },
  green: { accent: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  red: { accent: 'bg-red-500', light: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  purple: { accent: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  slate: { accent: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

function formatDate(dateString, t) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('news.justNow');
  if (diffMins < 60) return t('news.minAgo', { count: diffMins });
  if (diffHours < 24) return t('news.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('news.daysAgo', { count: diffDays });

  return date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function NewsCard({ news, featured = false }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const priority = priorityConfig[news.priority] || priorityConfig.medium;
  const color = colorConfig[news.color] || colorConfig.blue;
  const PriorityIcon = priority.icon;
  const priorityLabels = { urgent: t('news.urgent'), high: t('news.important'), medium: t('news.normal'), low: t('news.info') };

  return (
    <motion.div
      layout
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
        featured ? 'lg:col-span-2' : ''
      } ${news.is_pinned ? 'ring-2 ring-gold-500/50' : ''} ${color.border}`}
    >
      {/* Color Accent Bar */}
      <div className={`h-1 ${color.accent}`} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {news.is_pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold-600 bg-gold-50 px-2 py-1 rounded-full">
                <Pin size={12} /> {t('news.pinned')}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${priority.badge}`}>
              <PriorityIcon size={12} /> {priorityLabels[news.priority] || priorityLabels.medium}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Eye size={12} /> {news.views}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatDate(news.published_at || news.created_at, t)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-lg font-bold text-slate-900 mb-2 ${featured ? 'text-xl' : ''}`}>
          {news.title}
        </h3>

        {/* Content */}
        <div className={`text-sm text-slate-500 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {expanded ? news.content : news.excerpt || news.content}
        </div>

        {/* Expand Button */}
        {news.content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm font-medium text-blue-500 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
          >
            {expanded ? t('news.showLess') : t('news.readMore')}
            <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <User size={14} />
            <span>{news.author_name}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function News() {
  const { t } = useTranslation();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/news`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      setNews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(n => n.priority === filter);

  const pinnedNews = filteredNews.filter(n => n.is_pinned);
  const regularNews = filteredNews.filter(n => !n.is_pinned);

  return (
    <motion.div variants={pv} initial="initial" animate="animate" exit="exit">
      {/* Header */}
      <section className="pt-28 pb-12 md:pt-40 md:pb-16 px-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div className="absolute top-8 -right-20 md:top-4 md:-right-10 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-blue-50/70 blur-3xl" />
            <div className="absolute -top-20 left-1/3 w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-full bg-gold-500/[0.04] blur-2xl" />
            <div className="absolute bottom-0 -left-10 w-[250px] h-[250px] md:w-[300px] md:h-[300px] rounded-full bg-blue-100/40 blur-3xl" />

            <svg className="absolute top-12 right-[15%] md:top-16 md:right-[20%] w-[120px] h-[120px] md:w-[200px] md:h-[200px] text-blue-500/[0.06]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5">
              <circle cx="100" cy="100" r="80" />
              <circle cx="100" cy="100" r="50" />
              <circle cx="100" cy="100" r="20" />
            </svg>

            <svg className="absolute bottom-8 left-[10%] md:bottom-4 md:left-[15%] w-[80px] h-[80px] md:w-[140px] md:h-[140px] text-gold-500/[0.08]" viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth="0.8">
              <rect x="20" y="20" width="100" height="100" rx="8" transform="rotate(15 70 70)" />
              <rect x="35" y="35" width="70" height="70" rx="4" transform="rotate(15 70 70)" />
            </svg>

            <div className="absolute top-1/3 right-[8%] md:right-[12%] w-[60px] h-[1px] md:w-[100px] bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />
            <div className="absolute top-[55%] left-[5%] md:left-[10%] w-[40px] h-[1px] md:w-[80px] bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />

            <div className="absolute top-20 left-[20%] w-1.5 h-1.5 rounded-full bg-blue-400/20" />
            <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-gold-500/15" />
            <div className="absolute bottom-16 right-[35%] w-1 h-1 rounded-full bg-blue-500/25" />
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
            <div className="absolute top-1/2 -right-6 w-8 h-[1px] bg-gradient-to-r from-blue-500/20 to-transparent" />

            <div className="relative w-[96px] h-[96px] sm:w-[90px] sm:h-[90px] md:w-[110px] md:h-[110px] lg:w-[135px] lg:h-[135px]">
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-slate-200/30" />

              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-[50px] h-[50px] sm:w-[48px] sm:h-[48px] md:w-[58px] md:h-[58px] lg:w-[70px] lg:h-[70px]" viewBox="0 0 80 80" fill="none">
                  <rect x="12" y="16" width="42" height="50" rx="3" fill="#3B82F6" fillOpacity="0.08" stroke="#3B82F6" strokeWidth="1.5" />
                  <rect x="16" y="20" width="34" height="42" rx="1.5" fill="white" fillOpacity="0.5" stroke="#3B82F6" strokeWidth="0.8" />
                  <rect x="20" y="24" width="26" height="8" rx="1" fill="#3B82F6" fillOpacity="0.12" />
                  <line x1="20" y1="37" x2="42" y2="37" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
                  <line x1="20" y1="42" x2="38" y2="42" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.3" />
                  <line x1="20" y1="47" x2="35" y2="47" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25" />
                  <line x1="20" y1="52" x2="40" y2="52" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.2" />
                  <path d="M54 22 L54 60 C54 62 56 64 58 64 C60 64 62 62 62 60 L62 28 L54 22Z" fill="#EAB308" fillOpacity="0.1" stroke="#EAB308" strokeWidth="1" strokeLinejoin="round" />
                  <line x1="58" y1="32" x2="58" y2="56" stroke="#EAB308" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.3" />
                  <circle cx="58" cy="18" r="1.5" fill="#EAB308" fillOpacity="0.5" />
                  <circle cx="14" cy="62" r="1" fill="#3B82F6" fillOpacity="0.3" />
                </svg>
              </div>

              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gold-500/80" />
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-1.5 h-1.5 rounded-full bg-blue-400/50" />
            </div>

            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-5 md:h-5 rounded-full border border-dashed border-blue-500/30" />
          </motion.div>
        </div>

        <div className="max-w-[1120px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[3px] rounded-full bg-blue-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('news.section')}</p>
            </div>
            <h1 data-testid="news-page-title" className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              {t('news.title')}
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              {t('news.desc')}
            </p>
          </motion.div>
        </div>
      </section>

      <Marquee
        items={t('news.marquee', { returnObjects: true })}
        variant="subtle"
        speed={34}
      />

      {/* Filter Bar */}
      <section className="px-5 pt-8 pb-8">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-500 mr-2">{t('news.filter')}</span>
              {[
                { value: 'all', label: t('news.all') },
                { value: 'urgent', label: t('news.urgent'), color: 'red' },
                { value: 'high', label: t('news.important'), color: 'orange' },
                { value: 'medium', label: t('news.normal'), color: 'blue' },
                { value: 'low', label: t('news.info'), color: 'slate' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  data-testid={`news-filter-${f.value}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === f.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* News Content */}
      <section className="px-5 pb-20">
        <div className="max-w-[1120px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div 
                className="flex items-center gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </motion.div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
              <p className="text-slate-500">{t('news.loadError')}: {error}</p>
            </div>
          ) : news.length === 0 ? (
            <RevealOnScroll>
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                <Megaphone className="mx-auto mb-4 text-slate-300" size={64} />
                <p className="text-xl font-semibold text-slate-700 mb-2">{t('news.noNews')}</p>
                <p className="text-slate-500">{t('news.noNewsSub')}</p>
              </div>
            </RevealOnScroll>
          ) : (
            <>
              {/* Pinned News */}
              {pinnedNews.length > 0 && (
                <div className="mb-8">
                  <RevealOnScroll>
                    <div className="flex items-center gap-2 mb-4">
                      <Pin size={16} className="text-gold-500" />
                      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('news.pinnedPosts')}</h2>
                    </div>
                  </RevealOnScroll>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pinnedNews.map((item, i) => (
                      <RevealOnScroll key={item.id} delay={i * 0.05}>
                        <NewsCard news={item} featured={i === 0} />
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular News */}
              {regularNews.length > 0 && (
                <div>
                  {pinnedNews.length > 0 && (
                    <RevealOnScroll>
                      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{t('news.moreNews')}</h2>
                    </RevealOnScroll>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularNews.map((item, i) => (
                      <RevealOnScroll key={item.id} delay={i * 0.05}>
                        <NewsCard news={item} />
                      </RevealOnScroll>
                    ))}
                  </div>
                </div>
              )}

              {filteredNews.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl">
                  <p className="text-slate-500">{t('news.noFilter')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

    </motion.div>
  );
}
