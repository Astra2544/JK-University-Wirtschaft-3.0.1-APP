/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TEAM PAGE | ÖH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 *  Beschreibung:
 *  Zeigt alle Teammitglieder der ÖH Wirtschaft an basierend auf Teamübersicht.xlsx
 *  Struktur: Vorsitzender (ganz groß) > Bereichsleiter (groß) > 
 *            Stellvertreter/Wichtige (mittel) > Weitere Mitglieder (klein)
 * 
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Böhmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RevealOnScroll } from '../components/Animations';
import { Mail, ArrowRight, Globe, Camera, PartyPopper, Newspaper, Users, Award, UserPlus } from 'lucide-react';
import Marquee from '../components/Marquee';
import { loadAssetsBatch } from '../utils/assets';


// ─── ANIMATION VARIANTEN ───────────────────────────────────────────────────
const pv = { 
  initial: { opacity: 0 }, 
  animate: { opacity: 1, transition: { duration: 0.5 } }, 
  exit: { opacity: 0, transition: { duration: 0.2 } } 
};

// ─── VORSITZENDER (ganz groß) ──────────────────────────────────────────────
const vorsitzender = {
  name: 'Maximilian Pilsner',
  email: 'maximilian.pilsner@oeh.jku.at',
  role: 'Vorsitzender',
  assetKey: 'team/maximilian-pilsner'
};

// ─── BEREICHSLEITER (groß) ─────────────────────────────────────────────────
const bereichsleiter = [
  { name: 'Lucia Schoisswohl', email: 'lucia.schoisswohl@oeh.jku.at', area: 'Medien', color: 'purple', icon: 'camera', assetKey: 'team/lucia-schoisswohl' },
  { name: 'Stefan Gstöttenmayer', email: 'wirtschaft@oeh.jku.at', area: 'Events', color: 'gold', icon: 'party', assetKey: 'team/stefan-gstoettenmayer' },
  { name: 'Sebastian Jensen', email: 'sebastian.jensen@oeh.jku.at', area: 'Internationals', color: 'blue', icon: 'globe', assetKey: 'team/sebastian-jensen' },
  { name: 'Carolina Götsch', email: 'wirtschaft@oeh.jku.at', area: 'Social Media', color: 'pink', icon: 'camera', assetKey: 'team/carolina-goetsch' },
];

// ─── STELLVERTRETER & WICHTIGE MITGLIEDER (mittel) ─────────────────────────
const stellvertreter = [
  { name: 'Simon Plangger', email: 'simon.plangger@oeh.jku.at', role: '1. Stv. SoWi-Fakultätsvorsitzender', assetKey: 'team/simon-plangger' },
  { name: 'Matej Kromka', email: 'wirtschaft@oeh.jku.at', role: 'Internationals', assetKey: 'team/matej-kromka' },
  { name: 'Florian Zimmermann', email: 'wirtschaft@oeh.jku.at', role: 'Events', assetKey: 'team/florian-zimmermann' },
  { name: 'Maxim Tafincev', email: 'wirtschaft@oeh.jku.at', role: 'Events', assetKey: 'team/maxim-tafincev' },
  { name: 'Simon Reisinger', email: 'wirtschaft@oeh.jku.at', role: 'Events', assetKey: 'team/simon-reisinger' },
  { name: 'Paul Mairleitner', email: 'wirtschaft@oeh.jku.at', role: 'Chefredakteur Ceteris Paribus', assetKey: 'team/paul-mairleitner' },
  { name: 'Sarika Bimanaviona', email: 'wirtschaft@oeh.jku.at', role: 'Global', assetKey: 'team/sarika-bimanaviona' },
  { name: 'Thomas Kreilinger', email: 'wirtschaft@oeh.jku.at', role: 'Medien', assetKey: 'team/thomas-kreilinger' },
  { name: 'Lilli Huber', email: 'lilli.huber@oeh.jku.at', role: 'ÖH WiPäd-Vorsitzende', assetKey: 'team/lilli-huber' },
  { name: 'Theresa Kloibhofer', email: 'theresa.kloibhofer@oeh.jku.at', role: 'ÖH Wirtschaft', assetKey: 'team/theresa-kloibhofer' },
  { name: 'Philipp Bergsmann', email: 'philipp.bergsmann@oeh.jku.at', role: 'ehem. ÖH Vorsitzender', assetKey: 'team/philipp-bergsmann' },
  { name: 'Paul Hamminger', email: 'paul.hamminger@oeh.jku.at', role: 'ÖH Referent für Internationales', assetKey: 'team/paul-hamminger' },
  { name: 'Alex Sighireanu', email: 'wirtschaft@oeh.jku.at', role: 'Internationals', assetKey: 'team/alex-sighireanu' },
  { name: 'Victoria Riener', email: 'victoria.riener@oeh.jku.at', role: 'ehem. ÖH Generalsekretärin', assetKey: 'team/victoria-riener' },
];

// ─── WEITERE MITGLIEDER (klein) ────────────────────────────────────────────
const weitereMitglieder = [
  { name: 'Louis Jacquemain', email: 'wirtschaft@oeh.jku.at', role: 'Internationals' },
  { name: 'Leon Avant', email: 'wirtschaft@oeh.jku.at', role: 'Internationals' },
  { name: 'Nicolas Kaufman', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Matthias Pilz', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Moritz Siebert', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Lukas Gutmann', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Moritz Strachon', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Ioana Vasilache', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Anna Schaur', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Melanie Derntl', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Johannes Neuhuber', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
  { name: 'Michael Tremetsberger', email: 'wirtschaft@oeh.jku.at', role: 'ÖH Wirtschaft' },
];

// ─── VORTEILE DER MITARBEIT ────────────────────────────────────────────────

// ─── INITIALEN-KOMPONENTE ──────────────────────────────────────────────────
function Initials({ name, className = '' }) {
  const ini = name.split(' ').map(n => n[0]).join('');
  return <span className={className}>{ini}</span>;
}

const allTeamAssetKeys = [
  vorsitzender.assetKey,
  ...bereichsleiter.map(p => p.assetKey),
  ...stellvertreter.map(p => p.assetKey),
  'portrait/team-transparent',
];

// ─── BEREICHSLEITER KARTE (groß) ───────────────────────────────────────────
function BereichsleiterCard({ person, index, t, teamAssets }) {
  const colorStyles = {
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
      border: 'border-purple-200/60',
      hoverBorder: 'hover:border-purple-300',
      badge: 'bg-purple-500 text-white',
      initials: 'bg-purple-500/10 text-purple-600 border-purple-200',
      icon: <Camera size={12} />,
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50/50',
      border: 'border-blue-200/60',
      hoverBorder: 'hover:border-blue-300',
      badge: 'bg-blue-500 text-white',
      initials: 'bg-blue-500/10 text-blue-600 border-blue-200',
      icon: <Globe size={12} />,
    },
    gold: {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50/50',
      border: 'border-amber-200/60',
      hoverBorder: 'hover:border-amber-300',
      badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      initials: 'bg-amber-500/10 text-amber-600 border-amber-200',
      icon: <PartyPopper size={12} />,
    },
    pink: {
      bg: 'bg-gradient-to-br from-pink-50 to-rose-100/50',
      border: 'border-pink-200/60',
      hoverBorder: 'hover:border-pink-300',
      badge: 'bg-pink-500 text-white',
      initials: 'bg-pink-500/10 text-pink-600 border-pink-200',
      icon: <Camera size={12} />,
    },
  };
  
  const style = colorStyles[person.color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`${style.bg} ${style.border} ${style.hoverBorder} border rounded-2xl p-5 hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl ${style.initials} border overflow-hidden shrink-0`}>
          {teamAssets[person.assetKey] && (
            <img
              src={teamAssets[person.assetKey]}
              alt={person.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
              {style.icon} {person.area}
            </span>
          </div>
          <p className="text-base font-bold text-slate-900 mb-0.5">{person.name}</p>
          <a href={`mailto:${person.email}`} className="text-xs text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1 truncate">
            <Mail size={11} className="shrink-0"/>{person.email}
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── STELLVERTRETER KARTE (mittel) ─────────────────────────────────────────
function StellvertreterCard({ person, index, t, teamAssets }) {
  return (
    <RevealOnScroll delay={index * 0.04}>
      <div
        data-testid={`team-stellvertreter-${index}`}
        className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300"
      >
        <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 ${
          index % 3 === 0 ? 'ring-2 ring-blue-100' :
          index % 3 === 1 ? 'ring-2 ring-gold-100' :
          'ring-2 ring-purple-100'
        }`}>
          {teamAssets[person.assetKey] && (
            <img
              src={teamAssets[person.assetKey]}
              alt={person.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{person.name}</p>
          <p className="text-xs text-slate-500 mb-1">{person.role}</p>
          <a href={`mailto:${person.email}`} className="text-[11px] text-slate-300 hover:text-blue-500 transition-colors flex items-center gap-1 truncate">
            <Mail size={10} className="shrink-0"/>{person.email}
          </a>
        </div>
      </div>
    </RevealOnScroll>
  );
}

// ─── KLEINE MITGLIEDER KARTE ───────────────────────────────────────────────
function KleineMitgliederCard({ person, index }) {
  const nameParts = person.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  return (
    <RevealOnScroll delay={index * 0.03}>
      <div
        data-testid={`team-member-klein-${index}`}
        className="group flex items-center gap-3 bg-slate-50/50 rounded-lg p-3 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all duration-200"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
          index % 2 === 0 ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-500'
        }`}>
          <Initials name={person.name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700">
            <span className="whitespace-nowrap">{firstName}</span>
            {lastName && <><br className="sm:hidden" /><span className="sm:ml-1">{lastName}</span></>}
          </p>
          <p className="text-[10px] text-slate-400">{person.role}</p>
        </div>
      </div>
    </RevealOnScroll>
  );
}

export default function Team() {
  const { t } = useTranslation();
  const benefits = t('team.benefits', { returnObjects: true });
  const [teamAssets, setTeamAssets] = useState({});

  useEffect(() => {
    loadAssetsBatch(allTeamAssetKeys).then(setTeamAssets);
  }, []);

  return (
    <motion.div variants={pv} initial="initial" animate="animate" exit="exit">
      {/* Header */}
      <section className="pt-28 pb-12 md:pt-40 md:pb-16 px-5 relative overflow-hidden">
        <div className="absolute top-10 -right-40 w-[500px] h-[500px] rounded-full bg-blue-50 blur-3xl opacity-50" />

        <div className="absolute top-[60%] right-16 md:right-28 lg:right-40 -translate-y-1/2 pointer-events-none">
          <div className="absolute -top-8 -left-8 w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-blue-500/20 animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute -bottom-4 -right-4 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-gold-500/15 to-gold-500/5" />
          <div className="absolute top-1/2 -left-12 w-3 h-3 md:w-4 md:h-4 rounded-full bg-blue-500/30" />
          <div className="absolute -top-4 right-1/4 w-2 h-2 md:w-3 md:h-3 rounded-full bg-gold-500/40" />
          <div className="absolute bottom-1/4 -right-8 w-5 h-5 md:w-6 md:h-6 rotate-45 border-2 border-blue-500/15" />
          <div className="absolute -top-12 -right-6 w-8 h-8 md:w-10 md:h-10 rounded-lg border border-gold-500/20 rotate-12" />
          <div className="absolute bottom-0 left-1/4 w-12 h-12 md:w-16 md:h-16 rounded-full border border-dashed border-blue-500/15" />
          <svg className="absolute -bottom-10 -left-6 w-6 h-6 md:w-8 md:h-8 text-gold-500/25" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
          </svg>
          <div className="absolute top-1/3 -right-10 w-1 h-8 md:h-12 bg-gradient-to-b from-blue-500/20 to-transparent rounded-full" />

          <div
            className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] lg:w-[280px] lg:h-[280px] bg-contain bg-center bg-no-repeat opacity-[0.95]"
            style={{ backgroundImage: teamAssets['portrait/team-transparent'] ? `url(${teamAssets['portrait/team-transparent']})` : 'none' }}
          />
        </div>

        <div className="max-w-[1120px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[3px] rounded-full bg-gold-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('team.section')}</p>
            </div>
            <h1 data-testid="team-page-title" className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">{t('team.title')}</h1>
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed bg-white/25 backdrop-blur-sm px-1 py-0.5 rounded-sm">
              {t('team.desc')}
            </p>
          </motion.div>
        </div>
      </section>

      <Marquee
        items={t('team.marquee', { returnObjects: true })}
        variant="dark"
        speed={32}
      />

      {/* Vorsitzender (ganz groß) */}
      <section className="px-5 pt-10 pb-10">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div data-testid="team-lead-card" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/20 overflow-hidden shrink-0">
                {teamAssets[vorsitzender.assetKey] && (
                  <img
                    src={teamAssets[vorsitzender.assetKey]}
                    alt={vorsitzender.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-1">{vorsitzender.role}</p>
                <p className="text-2xl font-bold text-white mb-1">{vorsitzender.name}</p>
                <a href={`mailto:${vorsitzender.email}`} className="text-sm text-blue-100 hover:text-white transition-colors flex items-center gap-1.5 justify-center sm:justify-start">
                  <Mail size={14}/>{vorsitzender.email}
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Bereichsleiter (groß) */}
      <section data-testid="team-area-leads" className="px-5 pb-12">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bereichsleiter.map((person, i) => (
              <BereichsleiterCard key={person.name} person={person} index={i} t={t} teamAssets={teamAssets} />
            ))}
          </div>
        </div>
      </section>

      {/* Stellvertreter & Wichtige Mitglieder (mittel) */}
      <section data-testid="team-stellvertreter-section" className="px-5 pb-12">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {stellvertreter.map((person, i) => (
              <StellvertreterCard key={person.name} person={person} index={i} t={t} teamAssets={teamAssets} />
            ))}
          </div>
        </div>
      </section>

      {/* Weitere Mitglieder (klein) */}
      <section data-testid="team-weitere-section" className="px-5 pb-12">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {weitereMitglieder.map((person, i) => (
              <KleineMitgliederCard key={person.name} person={person} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* "Und du?" CTA Karte */}
      <section data-testid="team-und-du-section" className="px-5 pb-16">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div className="bg-gradient-to-br from-gold-50 via-amber-50 to-orange-50 border border-gold-200/60 rounded-2xl p-8 md:p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border-2 border-gold-300 flex items-center justify-center shadow-lg">
                <UserPlus size={38} className="text-gold-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{t('team.andYou')}</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {t('team.andYouDesc')}
              </p>
              <Link
                to="/contact"
                data-testid="team-und-du-btn"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 px-6 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-gold-500/30"
              >
                {t('team.joinNow')} <ArrowRight size={15} />
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Mitmachen Vorteile */}
      <section data-testid="team-join-section" className="py-20 px-5 bg-slate-50/60">
        <div className="max-w-[900px] mx-auto">
          <RevealOnScroll>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[3px] rounded-full bg-blue-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('team.whyJoin')}</p>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">
              {t('team.whyJoinTitle')}
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
              {t('team.whyJoinDesc')}
            </p>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {benefits.map((b, i) => (
              <RevealOnScroll key={b.t} delay={i * 0.04}>
                <div className="bg-white rounded-xl p-4 border border-slate-100 hover:border-gold-200 transition-colors">
                  <p className="text-sm font-semibold text-slate-800 mb-0.5">{b.t}</p>
                  <p className="text-sm text-slate-400">{b.d}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
          <RevealOnScroll>
            <p className="text-sm text-slate-500 mb-6" dangerouslySetInnerHTML={{ __html: t('team.interviewStat') }} />
            <Link to="/contact" data-testid="team-join-btn"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/20">
              {t('team.contactBtn')} <ArrowRight size={15} />
            </Link>
          </RevealOnScroll>
        </div>
      </section>

    </motion.div>
  );
}
