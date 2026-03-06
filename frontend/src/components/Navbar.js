/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NAVBAR COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Responsive Navigation mit:
 *  - Desktop-Navigation mit allen Hauptseiten
 *  - Mobile Hamburger-Menue
 *  - Sprachumschalter (DE/EN)
 *  - User-Login/Logout Funktionalitaet
 *  - Dynamische Navigation basierend auf Admin-Einstellungen
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAsset } from '../hooks/useAsset';
import { ASSET_KEYS } from '../utils/assets';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const defaultLinkKeys = [
  { path: '/', key: 'home' },
  { path: '/news', key: 'news' },
  { path: '/kalender', key: 'kalender' },
  { path: '/team', key: 'team' },
  { path: '/studium', key: 'studium' },
  { path: '/lva', key: 'lva' },
  { path: '/studienplaner', key: 'studienplaner' },
  { path: '/magazine', key: 'magazine' },
];

function LangSwitch({ className = '' }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const toggle = () => {
    const next = lang === 'de' ? 'en' : 'de';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <button
      onClick={toggle}
      data-testid="lang-switch"
      className={`flex items-center gap-0.5 rounded-full border transition-all text-[13px] font-semibold select-none ${className}`}
    >
      <span className={`px-2 py-[5px] rounded-full transition-colors ${lang === 'de' ? 'bg-blue-500 text-white' : 'text-slate-500'}`}>
        DE
      </span>
      <span className={`px-2 py-[5px] rounded-full transition-colors ${lang === 'en' ? 'bg-blue-500 text-white' : 'text-slate-500'}`}>
        EN
      </span>
    </button>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navSettings, setNavSettings] = useState(null);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const loc = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { src: logoSrc } = useAsset(ASSET_KEYS.LOGO);

  const admin = localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')) : null;
  const isLoggedIn = !!localStorage.getItem('token');

  const fetchNavSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/site-settings`);
      if (res.ok) {
        const data = await res.json();
        setNavSettings(data);
      }
    } catch (err) {
      console.error('Failed to load nav settings:', err);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/survey/active`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.id) {
          setActiveSurvey(data);
        } else {
          setActiveSurvey(null);
        }
      })
      .catch(() => setActiveSurvey(null));
  }, []);

  useEffect(() => {
    fetchNavSettings();
  }, [fetchNavSettings]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setOpen(false), [loc]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setShowUserMenu(false);
    navigate('/');
  };

  if (loc.pathname.startsWith('/admin') || loc.pathname === '/login') {
    return null;
  }

  let linkKeys = defaultLinkKeys;
  if (navSettings?.nav_items) {
    const visibleItems = navSettings.nav_items
      .filter(item => item.visible)
      .sort((a, b) => a.order - b.order);
    linkKeys = visibleItems.map(item => ({ path: item.path, key: item.key }));
  }

  // Add survey link if active
  let navLinks = linkKeys.map(l => ({ ...l, label: t(`nav.${l.key}`) }));
  if (activeSurvey) {
    navLinks = [...navLinks, { path: '/umfrage', key: 'umfrage', label: t('nav.umfrage') || 'Umfrage' }];
  }

  return (
    <>
      <div className="fixed top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-gold-500 to-blue-500 z-[60]" />

      <motion.header
        data-testid="navbar"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-[3px] inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[58px]">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 group shrink-0">
            {logoSrc && (
              <img
                src={logoSrc}
                alt="ÖH Wirtschaft Logo"
                className="w-12 h-12 object-contain group-hover:scale-105 transition-transform"
              />
            )}
            <div className="leading-none">
              <span className="text-[17px] font-bold text-slate-900">Wirtschaft</span>
              <span className="block text-[11px] text-slate-400 font-medium mt-0.5">ÖH JKU Linz</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.path}
                to={l.path}
                data-testid={`nav-link-${l.path.replace('/', '') || 'home'}`}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  loc.pathname === l.path
                    ? 'text-blue-500 bg-blue-50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <LangSwitch className="border-slate-200 mr-1" />
            <Link
              to="/contact"
              data-testid="nav-contact-btn"
              className="inline-flex items-center text-[13px] font-semibold text-white bg-blue-500 hover:bg-blue-600 px-4 py-[7px] rounded-full transition-colors"
            >
              {t('nav.kontakt')}
            </Link>

            <div className="relative" data-user-menu>
              <button
                onClick={() => isLoggedIn ? setShowUserMenu(!showUserMenu) : navigate('/login')}
                data-testid="nav-user-btn"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isLoggedIn
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <User size={18} />
              </button>

              <AnimatePresence>
                {showUserMenu && isLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{admin?.display_name}</p>
                      <p className="text-xs text-slate-400">{admin?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/admin"
                        data-testid="nav-admin-link"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <User size={16} /> {t('nav.adminPanel')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        data-testid="nav-logout-btn"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut size={16} /> {t('nav.abmelden')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LangSwitch className="border-slate-200" />
            <button
              onClick={() => isLoggedIn ? navigate('/admin') : navigate('/login')}
              data-testid="nav-user-mobile"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isLoggedIn
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <User size={18} />
            </button>
            <button
              data-testid="nav-mobile-toggle"
              onClick={() => setOpen(!open)}
              className="text-slate-600 p-1 -mr-1"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6 lg:hidden"
          >
            <nav className="flex flex-col gap-1 mt-2">
              {navLinks.map((l, i) => (
                <motion.div
                  key={l.path}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={l.path}
                    data-testid={`mobile-nav-${l.path.replace('/', '') || 'home'}`}
                    className={`block py-3 px-3 rounded-xl text-lg font-semibold transition-colors ${
                      loc.pathname === l.path
                        ? 'text-blue-500 bg-blue-50'
                        : 'text-slate-800'
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to="/contact"
                  className="block mt-4 text-center text-white bg-blue-500 rounded-full py-3 font-semibold"
                >
                  {t('nav.kontakt')}
                </Link>
              </motion.div>

              {isLoggedIn ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="mt-2 flex gap-2"
                >
                  <Link
                    to="/admin"
                    className="flex-1 text-center text-blue-600 bg-blue-50 rounded-full py-3 font-semibold"
                  >
                    {t('nav.adminPanel')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex-1 text-center text-red-600 bg-red-50 rounded-full py-3 font-semibold"
                  >
                    {t('nav.abmelden')}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link
                    to="/login"
                    className="mt-2 block text-center text-slate-600 bg-slate-100 rounded-full py-3 font-semibold"
                  >
                    {t('nav.adminLogin')}
                  </Link>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
