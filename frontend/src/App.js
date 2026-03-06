/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ÖH WIRTSCHAFT - OFFIZIELLE WEBSITE
 *  Studienvertretung Wirtschaft | Johannes-Kepler-Universität Linz
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 *  PROJEKTBESCHREIBUNG:
 *  Multi-Page Website für die ÖH Wirtschaft (Studierendenvertretung).
 *  Enthält Informationen zu Studiengängen, Team, Services und dem 
 *  Magazin "Ceteris Paribus".
 * 
 *  TECH STACK:
 *  - React 18          → Frontend Framework
 *  - TailwindCSS       → Styling
 *  - Framer Motion     → Animationen
 *  - React Router      → Seitennavigation
 * 
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Böhmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── IMPORTS ───────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Komponenten
import Loader from './components/Loader';             // Ladeanimation beim Start
import Navbar from './components/Navbar';             // Navigation oben
import Footer from './components/Footer';             // Footer unten
import ScrollToTop from './components/ScrollToTop';   // Scrollt nach oben bei Seitenwechsel
import CustomCursor from './components/CustomCursor'; // Animierter Custom Cursor
import OEHliChat from './components/OEHli';           // OEHli Assistent
import SurveyBanner from './components/SurveyBanner'; // Umfrage Banner
import TestmodeGate from './components/TestmodeGate'; // Testmodus-Passwortschutz
import UnderDevelopment from './components/UnderDevelopment'; // Under Development Wartungsseite

// Seiten
import Home from './pages/Home';                  // Startseite
import News from './pages/News';                  // News & Ankündigungen
import Team from './pages/Team';                  // Team-Mitglieder
import Studium from './pages/Studium';            // Studiengänge & Updates
import Magazine from './pages/Magazine';          // Ceteris Paribus Magazin
import Contact from './pages/Contact';            // Kontakt, Services & FAQ
import Studienplaner from './pages/Studienplaner'; // Studienplaner
import Kalender from './pages/Kalender';          // Kalender
import LVA from './pages/LVA';                    // LVA-Bewertungen
import Impressum from './pages/Impressum';        // Impressum
import Datenschutz from './pages/Datenschutz';    // Datenschutz
import Login from './pages/Login';                // Admin Login
import AdminPanel from './pages/AdminPanel';      // Admin Panel
import NotFound from './pages/NotFound';          // 404 Fehlerseite
import Umfrage from './pages/Umfrage';            // Umfrage/Survey
import DisabledPage from './pages/DisabledPage';  // Deaktivierte Seite

import './App.css';
import { preloadAssets, ASSET_KEYS } from './utils/assets';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PRELOAD_ASSET_KEYS = [
  ASSET_KEYS.HERO_MAIN,
  ASSET_KEYS.HERO_SMALL1,
  ASSET_KEYS.HERO_SMALL2,
  ASSET_KEYS.ABOUT_MAIN,
  ASSET_KEYS.ABOUT_SMALL,
  ASSET_KEYS.PORTRAIT_MAXIMILIAN,
  ASSET_KEYS.LOGO,
];

const ROUTE_KEY_MAP = {
  '/': 'home',
  '/news': 'news',
  '/kalender': 'kalender',
  '/team': 'team',
  '/studium': 'studium',
  '/lva': 'lva',
  '/studienplaner': 'studienplaner',
  '/magazine': 'magazine',
};

// ─── ANIMATED ROUTES ───────────────────────────────────────────────────────
/**
 * AnimatedRoutes
 * Ermöglicht sanfte Übergangsanimationen zwischen den Seiten.
 * Verwendet Framer Motion's AnimatePresence für fade-in/fade-out Effekte.
 */
function AnimatedRoutes({ disabledPaths }) {
  const location = useLocation();

  const guard = (path, element) => {
    if (disabledPaths.has(path)) return <DisabledPage />;
    return element;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={guard('/', <Home />)} />
        <Route path="/news" element={guard('/news', <News />)} />
        <Route path="/kalender" element={guard('/kalender', <Kalender />)} />
        <Route path="/team" element={guard('/team', <Team />)} />
        <Route path="/studium" element={guard('/studium', <Studium />)} />
        <Route path="/lva" element={guard('/lva', <LVA />)} />
        <Route path="/magazine" element={guard('/magazine', <Magazine />)} />
        <Route path="/studienplaner" element={guard('/studienplaner', <Studienplaner />)} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/umfrage" element={<Umfrage />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

// ─── HAUPTKOMPONENTE ───────────────────────────────────────────────────────
/**
 * App (Hauptkomponente)
 * 
 * Struktur der Website:
 * ┌─────────────────────────────────┐
 * │           Navbar               │  ← Navigation
 * ├─────────────────────────────────┤
 * │                                 │
 * │        Seiteninhalt            │  ← Wechselt je nach Route
 * │                                 │
 * ├─────────────────────────────────┤
 * │           Footer               │  ← Fußzeile mit Links
 * └─────────────────────────────────┘
 * 
 * Beim ersten Laden wird 2.2 Sekunden ein Loader angezeigt.
 */
function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin' || location.pathname === '/login';
  const [disabledPaths, setDisabledPaths] = useState(new Set());

  const fetchSiteSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/site-settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.nav_items) {
          const disabled = new Set();
          data.nav_items.forEach(item => {
            if (!item.visible) {
              disabled.add(item.path);
            }
          });
          setDisabledPaths(disabled);
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchSiteSettings();
  }, [fetchSiteSettings]);

  return (
    <>
      <ScrollToTop />
      <CustomCursor />
      <div className="min-h-screen bg-white flex flex-col relative">
        {!isAdminRoute && <Navbar />}
        <main className="flex-1">
          <AnimatedRoutes disabledPaths={disabledPaths} />
        </main>
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <OEHliChat />}
        {!isAdminRoute && <SurveyBanner />}
      </div>
    </>
  );
}


function App() {
  const [loading, setLoading] = useState(true);
  const isUnderDevelopment = process.env.REACT_APP_UNDER_DEVELOPMENT === 'true';

  useEffect(() => {
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 2200));
    const assetsLoaded = preloadAssets(PRELOAD_ASSET_KEYS);

    Promise.all([minLoadTime, assetsLoaded]).then(() => {
      setLoading(false);
    });
  }, []);

  if (isUnderDevelopment) {
    return <UnderDevelopment />;
  }

  if (loading) return <Loader />;

  return (
    <TestmodeGate>
      <Router>
        <AppContent />
      </Router>
    </TestmodeGate>
  );
}

export default App;
