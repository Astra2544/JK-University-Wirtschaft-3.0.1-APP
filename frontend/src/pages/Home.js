/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HOME PAGE | ÖH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 *  Beschreibung:
 *  Die Startseite der ÖH Wirtschaft Website. Enthält:
 *  - Hero-Bereich mit Willkommenstext
 *  - Quick-Links zu allen wichtigen Bereichen
 *  - Über uns Sektion mit Statistiken
 *  - Studiengänge-Übersicht (Bachelor/Master)
 *  - Call-to-Action zum Mitmachen
 * 
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Böhmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from '../components/Animations';
import { ArrowRight, Users, BookOpen, Headphones, Newspaper, Instagram, Linkedin, Mail, TrendingUp, GraduationCap } from 'lucide-react';
import InstagramFeed from '../components/InstagramFeed';
import Marquee from '../components/Marquee';
import PartnerMarquee from '../components/PartnerMarquee';
import PageHelper from '../components/PageHelper';
import { useAssets } from '../hooks/useAsset';
import { ASSET_KEYS } from '../utils/assets';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HOME_ASSETS = [
  ASSET_KEYS.HERO_MAIN,
  ASSET_KEYS.HERO_SMALL1,
  ASSET_KEYS.HERO_SMALL2,
  ASSET_KEYS.ABOUT_MAIN,
  ASSET_KEYS.ABOUT_SMALL,
  ASSET_KEYS.PORTRAIT_MAXIMILIAN,
];


const pv = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const cardIcons = [Users, BookOpen, Headphones, Newspaper];
const cardRoutes = ['/team', '/studium', '/contact', '/magazine'];
const cardAccents = ['blue', 'gold', 'blue', 'gold'];

const categoryColors = ['blue', 'gold', 'blue', 'gold'];

export default function Home() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const { assets } = useAssets(HOME_ASSETS);

  useEffect(() => {
    fetch(`${API_URL}/api/study/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  const cards = [
    { icon: cardIcons[0], label: t('home.cards.team.label'), sub: t('home.cards.team.sub'), to: cardRoutes[0], accent: cardAccents[0] },
    { icon: cardIcons[1], label: t('home.cards.studium.label'), sub: t('home.cards.studium.sub'), to: cardRoutes[1], accent: cardAccents[1] },
    { icon: cardIcons[2], label: t('home.cards.kontakt.label'), sub: t('home.cards.kontakt.sub'), to: cardRoutes[2], accent: cardAccents[2] },
    { icon: cardIcons[3], label: t('home.cards.magazine.label'), sub: t('home.cards.magazine.sub'), to: cardRoutes[3], accent: cardAccents[3] },
  ];

  return (
    <motion.div variants={pv} initial="initial" animate="animate" exit="exit">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SEKTION
          Willkommensbereich mit Hauptüberschrift und CTA-Buttons
      ═══════════════════════════════════════════════════════════════════ */}
      <section data-testid="hero-section" className="relative pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28 px-4 md:px-6 overflow-hidden">
        {/* Dekorative Blur-Kreise im Hintergrund */}
        <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-blue-50 blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-32 w-[400px] h-[400px] rounded-full bg-gold-50 blur-3xl opacity-60" />
        
        <div className="max-w-[1200px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Linke Seite - Text */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Untertitel */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
                className="inline-flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-gold-500" />
                <span className="text-sm text-slate-500 font-medium">{t('home.subtitle')}</span>
              </motion.div>
              
              {/* Hauptüberschrift */}
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-bold text-slate-900 leading-[1.1] mb-5 tracking-tight">
                {t('home.title')}{' '}<span className="text-blue-500">{t('home.titleHighlight')}</span>
              </motion.h1>
              
              {/* Beschreibungstext */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
                className="text-base md:text-lg text-slate-500 leading-relaxed mb-7 max-w-lg mx-auto lg:mx-0">
                {t('home.desc')}
              </motion.p>
              
              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-7">
                <Link to="/team" data-testid="hero-cta-team"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-6 py-3.5 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/20">
                  {t('home.ctaTeam')} <ArrowRight size={16} />
                </Link>
                <Link to="/contact" data-testid="hero-cta-contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 border-2 border-slate-200 hover:border-blue-200 hover:text-blue-600 px-6 py-3.5 rounded-full transition-all">
                  {t('home.ctaContact')}
                </Link>
              </motion.div>
              
              {/* Social Media Icons + ÖH Link */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-4 text-slate-400">
                  <a href="https://www.instagram.com/oeh_wirtschaft_wipaed/" target="_blank" rel="noopener noreferrer" data-testid="hero-instagram" className="hover:text-blue-500 transition-colors"><Instagram size={20}/></a>
                  <a href="http://linkedin.com/company/wirtschaft-wipaed" target="_blank" rel="noopener noreferrer" data-testid="hero-linkedin" className="hover:text-blue-500 transition-colors"><Linkedin size={20}/></a>
                  <a href="mailto:wirtschaft@oeh.jku.at" data-testid="hero-mail" className="hover:text-blue-500 transition-colors"><Mail size={20}/></a>
                </div>
                <span className="hidden sm:block w-px h-5 bg-slate-200" />
                <a 
                  href="https://oeh.jku.at/wirtschaft" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="hero-oeh-jku-link"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-full text-xs font-medium text-slate-600 hover:text-blue-600 transition-all"
                >
                  <span className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">ÖH</span>
                  ÖH JKU
                  <ArrowRight size={12} />
                </a>
              </motion.div>
            </div>
            
            {/* Rechte Seite - Bilder Collage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
              className="relative order-1 lg:order-2 mx-auto max-w-[320px] sm:max-w-[380px] lg:max-w-none"
            >
              {/* Hauptbild */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-slate-100">
                {assets[ASSET_KEYS.HERO_MAIN] && (
                  <img
                    src={assets[ASSET_KEYS.HERO_MAIN]}
                    alt="JKU Campus"
                    className="w-full h-[190px] sm:h-[240px] lg:h-[380px] object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <div className="absolute inset-0 ring-1 ring-black/5 rounded-xl sm:rounded-2xl" />
              </div>

              {/* Kleines Bild links unten */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
                className="absolute -bottom-3 -left-3 sm:-bottom-5 sm:-left-5 lg:-bottom-6 lg:-left-6 w-24 h-18 sm:w-36 sm:h-26 lg:w-48 lg:h-36 rounded-lg sm:rounded-xl overflow-hidden shadow-xl border-2 sm:border-3 lg:border-4 border-white bg-slate-100"
              >
                {assets[ASSET_KEYS.HERO_SMALL1] && (
                  <img
                    src={assets[ASSET_KEYS.HERO_SMALL1]}
                    alt="Team bei der Arbeit"
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>

              {/* Kleines Bild rechts oben */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
                className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 lg:-top-4 lg:-right-4 w-20 h-16 sm:w-28 sm:h-22 lg:w-40 lg:h-28 rounded-lg sm:rounded-xl overflow-hidden shadow-xl border-2 sm:border-3 lg:border-4 border-white bg-slate-100"
              >
                {assets[ASSET_KEYS.HERO_SMALL2] && (
                  <img
                    src={assets[ASSET_KEYS.HERO_SMALL2]}
                    alt="Studenten"
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Marquee
        items={t('home.marquee', { returnObjects: true })}
        variant="blue"
        speed={25}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK-LINKS SEKTION
          4 Karten mit Links zu den Hauptbereichen
      ═══════════════════════════════════════════════════════════════════ */}
      <section data-testid="quick-links-section" className="py-20 px-5 bg-slate-50/60">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-[3px] rounded-full bg-gold-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('home.quickLinks')}</p>
            </div>
          </RevealOnScroll>
          
          {/* Karten-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c, i) => (
              <RevealOnScroll key={c.to} delay={i * 0.08}>
                <Link to={c.to} data-testid={`quick-link-${c.to.replace('/', '')}`}
                  className="group block bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1">
                  <c.icon size={22} className={`mb-4 ${c.accent === 'blue' ? 'text-blue-500' : 'text-gold-500'}`} />
                  <p className="font-semibold text-slate-900 mb-1 group-hover:text-blue-500 transition-colors">{c.label}</p>
                  <p className="text-sm text-slate-400">{c.sub}</p>
                  <ArrowRight size={15} className="mt-3 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Partner/Sponsoren Marquee */}
      <PartnerMarquee />

      {/* ═══════════════════════════════════════════════════════════════════
          ÜBER UNS SEKTION
          Beschreibung der Studienvertretung + Bilder
      ═══════════════════════════════════════════════════════════════════ */}
      <section data-testid="about-section" className="py-16 md:py-24 lg:py-28 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Linke Spalte: Bilder-Grid */}
          <RevealOnScroll direction="left">
            <div className="relative mx-auto max-w-[320px] sm:max-w-[380px] lg:max-w-[480px]">
              {/* Hauptbild - Querformat */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
                {assets[ASSET_KEYS.ABOUT_MAIN] && (
                  <img
                    src={assets[ASSET_KEYS.ABOUT_MAIN]}
                    alt="Team Meeting"
                    className="w-full h-[160px] sm:h-[190px] lg:h-[260px] object-cover object-center"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
              </div>

              {/* Zweites Bild - überlappt unten rechts */}
              <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-32 h-20 sm:w-40 sm:h-26 lg:w-52 lg:h-32 rounded-lg sm:rounded-xl overflow-hidden shadow-xl border-2 sm:border-3 lg:border-4 border-white">
                {assets[ASSET_KEYS.ABOUT_SMALL] && (
                  <img
                    src={assets[ASSET_KEYS.ABOUT_SMALL]}
                    alt="Gruppenfoto"
                    className="w-full h-full object-cover object-center"
                  />
                )}
              </div>
            </div>
          </RevealOnScroll>
          
          {/* Rechte Spalte: Text + Statistik */}
          <RevealOnScroll direction="right">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-8 h-[3px] rounded-full bg-blue-500" />
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('home.about')}</p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                {t('home.aboutTitle')}
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-500 leading-[1.8] mb-3">
                {t('home.aboutP1')}
              </p>
              <p className="text-sm sm:text-[15px] text-slate-500 leading-[1.8] mb-6">
                {t('home.aboutP2')}
              </p>
              
              {/* Statistik-Grid - separat unter dem Text */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto lg:mx-0 mb-3">
                {[
                  { n: '3500+', l: t('home.stats.students'), c: 'blue' },
                  { n: '30+', l: t('home.stats.members'), c: 'gold' },
                  { n: '20+', l: t('home.stats.programs'), c: 'blue' },
                  { n: '1', l: t('home.stats.mission'), c: 'gold' },
                ].map(s => (
                  <div key={s.l} className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center border border-slate-100">
                    <p className={`text-lg sm:text-xl font-bold mb-0.5 ${s.c === 'blue' ? 'text-blue-500' : 'text-gold-500'}`}>{s.n}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 leading-tight">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-gold-50 rounded-xl p-4 text-center border border-slate-100 max-w-md mx-auto lg:mx-0">
                <p className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">100%</p>
                <p className="text-xs sm:text-sm text-slate-500">{t('home.stats.volunteerEngagement')}</p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <Marquee
        items={t('home.marquee2', { returnObjects: true })}
        variant="gold"
        speed={38}
        reverse
      />

      {/* ═══════════════════════════════════════════════════════════════════
          LVA BEWERTUNGEN BANNER
          Einfacher Banner mit Link zur LVA-Seite
      ═══════════════════════════════════════════════════════════════════ */}
      <section data-testid="lva-banner-section" className="py-16 px-5 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="text-blue-500" size={28} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">{t('home.lvaBanner')}</h2>
                  <p className="text-sm text-slate-500">{t('home.lvaBannerSub')}</p>
                </div>
              </div>
              <Link 
                to="/lva"
                data-testid="lva-banner-btn"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full transition-colors text-sm whitespace-nowrap"
              >
                {t('home.lvaBannerBtn')} <ArrowRight size={16} />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STUDIENGÄNGE SEKTION
          Übersicht der Kategorien
      ═══════════════════════════════════════════════════════════════════ */}
      <section data-testid="programs-section" className="py-20 px-5 bg-slate-50/60">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[3px] rounded-full bg-gold-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('home.programs')}</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">{t('home.programsTitle')}</h2>
            <p className="text-[15px] text-slate-500 mb-10">{t('home.programsSub')}</p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat, idx) => {
              const color = categoryColors[idx % categoryColors.length];
              return (
                <RevealOnScroll key={cat.id} delay={idx * 0.06}>
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100 hover:border-blue-200 transition-all hover:shadow-lg hover:shadow-blue-500/5 group text-center">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center ${
                      color === 'blue' ? 'bg-blue-50' : 'bg-gold-50'
                    }`}>
                      <GraduationCap size={20} className={`sm:hidden ${color === 'blue' ? 'text-blue-500' : 'text-gold-500'}`} />
                      <GraduationCap size={28} className={`hidden sm:block ${color === 'blue' ? 'text-blue-500' : 'text-gold-500'}`} />
                    </div>
                    <p className={`text-sm sm:text-lg font-bold leading-tight ${
                      color === 'blue' ? 'text-slate-900 group-hover:text-blue-500' : 'text-slate-900 group-hover:text-gold-600'
                    } transition-colors`}>
                      {cat.display_name}
                    </p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

          <RevealOnScroll delay={0.15}>
            <div className="mt-8 text-center">
              <Link to="/studium" data-testid="programs-more-btn"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full transition-colors text-sm">
                {t('home.programsMore')} <ArrowRight size={16} />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          INSTAGRAM SEKTION
          Die letzten 3 Instagram Posts
      ═══════════════════════════════════════════════════════════════════ */}
      <section data-testid="instagram-section" className="py-14 md:py-16 lg:py-20 px-4 md:px-6 bg-slate-50">
        <div className="max-w-[600px] mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-6 md:mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-6 sm:w-8 h-[3px] rounded-full bg-gradient-to-r from-pink-500 to-yellow-500" />
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('home.instagram')}</p>
                <div className="w-6 sm:w-8 h-[3px] rounded-full bg-gradient-to-r from-yellow-500 to-pink-500" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{t('home.instagramTitle')}</h2>
            </div>
          </RevealOnScroll>

          {/* Instagram Feed */}
          <RevealOnScroll>
            <InstagramFeed />
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CALL-TO-ACTION SEKTION
          Aufruf zum Mitmachen im Team - mit Maximilian Pilsner
      ═══════════════════════════════════════════════════════════════════ */}
      <section data-testid="cta-section" className="pt-16 md:pt-24 pb-0 px-5 overflow-visible">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 md:p-10 pr-[120px] md:pr-[180px] lg:pr-[320px] relative overflow-hidden w-full shadow-2xl shadow-blue-500/25">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-gold-500/20 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-white/10 rounded-full" />

                <div className="relative lg:max-w-[550px]">
                  <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-2 md:mb-3">{t('home.cta')}</p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 md:mb-4 leading-tight">
                    {t('home.ctaTitle')}
                  </h2>
                  <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-3 md:mb-4">
                    {t('home.ctaDesc')}
                  </p>
                  <p className="text-blue-200 text-xs md:text-sm mb-5 md:mb-8" dangerouslySetInnerHTML={{ __html: t('team.interviewStat') }} />

                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <Link to="/contact" data-testid="cta-email-btn"
                      className="text-xs md:text-sm font-semibold text-blue-700 bg-gold-500 hover:bg-gold-600 px-4 md:px-6 py-2.5 md:py-3 rounded-full transition-all hover:shadow-lg hover:shadow-gold-500/30">
                      {t('home.ctaBtn')}
                    </Link>
                    <Link to="/team" data-testid="cta-team-btn"
                      className="text-xs md:text-sm font-semibold text-white border-2 border-white/30 hover:border-white/60 px-4 md:px-6 py-2.5 md:py-3 rounded-full transition-all">
                      {t('home.ctaTeamBtn')}
                    </Link>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="absolute right-2 md:right-4 lg:right-8 bottom-0 z-10"
              >
                <div className="relative h-[200px] w-[140px] md:h-[300px] md:w-[220px] lg:h-[420px] lg:w-[340px]">
                  {assets[ASSET_KEYS.PORTRAIT_MAXIMILIAN] && (
                    <img
                      src={assets[ASSET_KEYS.PORTRAIT_MAXIMILIAN]}
                      alt="Maximilian Pilsner"
                      className="h-full w-full object-contain object-bottom drop-shadow-2xl"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </motion.div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

    </motion.div>
  );
}
