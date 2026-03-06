/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SURVEY BANNER COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Zeigt ein Banner am unteren Bildschirmrand an, wenn eine aktive
 *  Umfrage verfuegbar ist. Kann vom Benutzer geschlossen werden.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Gift, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function SurveyBanner() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [survey, setSurvey] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language === 'en' ? 'en' : 'de';

  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname === '/login';
  const isUmfragePage = location.pathname === '/umfrage';

  useEffect(() => {
    if (isAdminPage || isUmfragePage) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/survey/active`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.id && data.show_banner) {
          const dismissedId = localStorage.getItem('survey_banner_dismissed');
          if (dismissedId === String(data.id)) {
            setDismissed(true);
          }
          setSurvey(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAdminPage, isUmfragePage]);

  const handleDismiss = () => {
    if (survey) {
      localStorage.setItem('survey_banner_dismissed', String(survey.id));
    }
    setDismissed(true);
  };

  if (loading || !survey || dismissed || isAdminPage || isUmfragePage) return null;

  const title = lang === 'en' && survey.title_en ? survey.title_en : survey.title_de;
  const bannerText = lang === 'en' && survey.banner_text_en ? survey.banner_text_en : survey.banner_text_de;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/25 overflow-hidden">
          <div className="relative px-4 py-3 sm:px-6 sm:py-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            
            <div className="relative flex items-center gap-3 sm:gap-4">
              {/* Icon */}
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-white/20 backdrop-blur items-center justify-center shrink-0">
                <ClipboardList className="text-white" size={24} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                    {lang === 'en' ? 'Survey' : 'Umfrage'}
                  </span>
                  {survey.raffle_enabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full">
                      <Gift size={10} /> {lang === 'en' ? 'Win prizes!' : 'Gewinnspiel!'}
                    </span>
                  )}
                </div>
                <p className="text-white font-semibold text-sm sm:text-base truncate">
                  {bannerText || title}
                </p>
              </div>
              
              {/* CTA Button */}
              <Link
                to="/umfrage"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                <span className="hidden sm:inline">{lang === 'en' ? 'Participate' : 'Teilnehmen'}</span>
                <ArrowRight size={18} />
              </Link>
              
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="shrink-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
