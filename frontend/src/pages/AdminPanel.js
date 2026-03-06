/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN PANEL | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Zentrales Admin-Panel zur Verwaltung aller Website-Inhalte.
 *  News, Events, Team, LVAs, Partner, und mehr.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Newspaper, Users, Activity, Settings, LogOut,
  Plus, Edit2, Trash2, Eye, EyeOff, Pin, PinOff, Save, X,
  AlertTriangle, AlertCircle, Bell, Info, Clock,
  BarChart3, TrendingUp, User, Shield, Crown,
  Check, RefreshCw, Calendar, GraduationCap, BookOpen, Mail, Globe, MoreHorizontal,
  Building2, Cog, UserPlus, Menu, ClipboardList, History, MessageSquare, LayoutGrid
} from 'lucide-react';
import NotificationCenter from './Admin/components/NotificationCenter';
import AdminEvents from './Admin/sections/AdminEvents';
import AdminSGU from './Admin/sections/AdminSGU';
import AdminLVA from './Admin/sections/AdminLVA';
import AdminEmail from './Admin/sections/AdminEmail';
import AdminCodes from './Admin/sections/AdminCodes';
import AdminSites from './Admin/sections/AdminSites';
import AdminMisc from './Admin/sections/AdminMisc';
import AdminPartners from './Admin/sections/AdminPartners';
import AdminVerwaltung, { PERMISSION_SECTIONS } from './Admin/sections/AdminVerwaltung';
import AdminRegistrations from './Admin/sections/AdminRegistrations';
import AdminSurvey from './Admin/sections/AdminSurvey';
import AdminChangelog from './Admin/sections/AdminChangelog';
import AdminKanban from './Admin/sections/AdminKanban';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const priorityOptions = [
  { value: 'low', label: 'Info', icon: Info, color: 'slate' },
  { value: 'medium', label: 'Normal', icon: Bell, color: 'blue' },
  { value: 'high', label: 'Wichtig', icon: AlertCircle, color: 'orange' },
  { value: 'urgent', label: 'Dringend', icon: AlertTriangle, color: 'red' },
];

const colorOptions = [
  { value: 'blue', label: 'Blau', class: 'bg-blue-500' },
  { value: 'gold', label: 'Gold', class: 'bg-gold-500' },
  { value: 'green', label: 'Grün', class: 'bg-green-500' },
  { value: 'red', label: 'Rot', class: 'bg-red-500' },
  { value: 'purple', label: 'Lila', class: 'bg-purple-500' },
  { value: 'slate', label: 'Grau', class: 'bg-slate-500' },
];

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
];

// ─── API HELPER ────────────────────────────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '/login';
    throw new Error('Session abgelaufen');
  }
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Anfrage fehlgeschlagen');
  return data;
}

const PERMISSION_ICON_MAP = {
  news: Newspaper,
  events: Calendar,
  sgu: GraduationCap,
  lva: BookOpen,
  kanban: LayoutGrid,
  misc: MoreHorizontal,
  partners: Building2,
  sites: Globe,
  email: Mail,
  users: User,
};

// ─── SIDEBAR COMPONENT ─────────────────────────────────────────────────────
function Sidebar({ active, setActive, admin, onLogout, onClose, isMobile, unreadCounts = {} }) {
  const hasPermission = (section, action = 'view') => {
    if (admin?.is_master) return true;
    return admin?.permissions?.[section]?.[action] || false;
  };

  const getSectionUnreadCount = (sectionId) => {
    const mapping = {
      events: 'events',
      registrations: 'events',
      email: 'email',
      lva: 'lva',
      kanban: 'kanban',
      survey: 'misc',
      misc: 'misc',
      changelog: 'changelog',
      news: 'news',
      sgu: 'sgu',
      partners: 'partners',
      sites: 'sites',
      users: 'users',
    };
    const key = mapping[sectionId];
    return key ? (unreadCounts[key] || 0) : 0;
  };

  const buildNavItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, always: true },
    ];

    PERMISSION_SECTIONS.forEach(section => {
      if (section.id === 'misc') {
        items.push({ id: 'survey', label: 'Umfrage', icon: ClipboardList, permission: 'misc' });
      }

      if (section.id === 'events') {
        items.push({
          id: section.id,
          label: section.label,
          icon: PERMISSION_ICON_MAP[section.id] || MoreHorizontal,
          permission: section.id,
        });
        items.push({ id: 'registrations', label: 'Anmeldungen', icon: UserPlus, permission: 'events' });
      } else if (section.id === 'misc') {
        items.push({
          id: 'misc',
          label: 'Sonstiges',
          icon: MoreHorizontal,
          permission: 'misc',
        });
      } else {
        items.push({
          id: section.id,
          label: section.label,
          icon: PERMISSION_ICON_MAP[section.id] || MoreHorizontal,
          permission: section.id,
        });
      }
    });

    items.push({ id: 'verwaltung', label: 'Verwaltung', icon: Cog, masterOnly: true });
    items.push({ id: 'activity', label: 'Aktivität', icon: Activity, always: true });
    items.push({ id: 'settings', label: 'Einstellungen', icon: Settings, always: true });
    items.push({ id: 'changelog', label: 'Developer History', icon: History, always: true });

    return items;
  };

  const navItems = buildNavItems();

  const getRoleDisplay = () => {
    if (admin?.is_master) return 'Master Admin';
    if (admin?.role_name) return admin.role_name;
    return admin?.role || 'Benutzer';
  };

  const getRoleColorClass = () => {
    if (admin?.is_master) return 'bg-red-500/20';
    const colorMap = {
      blue: 'bg-blue-500/20',
      green: 'bg-green-500/20',
      gold: 'bg-amber-500/20',
      red: 'bg-red-500/20',
      purple: 'bg-purple-500/20',
      teal: 'bg-teal-500/20',
      orange: 'bg-orange-500/20',
      slate: 'bg-slate-500/20',
    };
    return colorMap[admin?.role_color] || 'bg-blue-500/20';
  };

  const handleNavClick = (itemId) => {
    setActive(itemId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`w-64 bg-slate-900 flex flex-col ${isMobile ? 'h-full overflow-hidden' : 'min-h-screen max-h-screen'}`}>
      <div className="p-5 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              ÖH
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Admin Panel</p>
              <p className="text-slate-500 text-xs">ÖH Wirtschaft</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto overscroll-contain min-h-0">
        {navItems.map(item => {
          if (item.masterOnly && !admin?.is_master) return null;
          if (item.permission && !hasPermission(item.permission)) return null;
          const unreadCount = getSectionUnreadCount(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              data-testid={`nav-${item.id}`}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all relative ${
                active === item.id
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="relative">
                <item.icon size={18} />
                {unreadCount > 0 && active !== item.id && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-slate-900" />
                )}
              </div>
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              {unreadCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active === item.id
                    ? 'bg-white/20 text-white'
                    : 'bg-orange-400/20 text-orange-400'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className="bg-slate-800 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full ${getRoleColorClass()} flex items-center justify-center`}>
              {admin?.is_master ? <Crown className="text-amber-400" size={18} /> : <User className="text-blue-400" size={18} />}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{admin?.display_name}</p>
              <p className="text-slate-500 text-xs truncate">{getRoleDisplay()}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          data-testid="logout-btn"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
        >
          <LogOut size={16} /> Abmelden
        </button>
      </div>
    </aside>
  );
}

// ─── LIVE CLOCK COMPONENT ──────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('de-AT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">
            {formatTime(time)}
          </p>
          <p className="text-slate-400 text-sm mt-1 capitalize">
            {formatDate(time)}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
          <Clock size={24} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}

// ─── WEATHER WIDGET COMPONENT ──────────────────────────────────────────────
function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const lat = 48.3369;
        const lon = 14.3194;
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=Europe/Vienna`
        );
        if (!response.ok) throw new Error('Wetter konnte nicht geladen werden');
        const data = await response.json();
        setWeather(data.current);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code) => {
    if (code === 0) return { icon: 'sun', bg: 'from-amber-400 to-orange-500' };
    if (code <= 3) return { icon: 'cloud-sun', bg: 'from-slate-400 to-slate-500' };
    if (code <= 48) return { icon: 'cloud', bg: 'from-slate-500 to-slate-600' };
    if (code <= 67) return { icon: 'cloud-rain', bg: 'from-blue-500 to-blue-600' };
    if (code <= 77) return { icon: 'cloud-snow', bg: 'from-cyan-400 to-cyan-500' };
    if (code <= 82) return { icon: 'cloud-rain', bg: 'from-blue-600 to-blue-700' };
    if (code <= 86) return { icon: 'cloud-snow', bg: 'from-slate-400 to-slate-500' };
    return { icon: 'cloud-lightning', bg: 'from-slate-600 to-slate-700' };
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Klar';
    if (code <= 3) return 'Teilweise bewolkt';
    if (code <= 48) return 'Nebelig';
    if (code <= 55) return 'Nieselregen';
    if (code <= 67) return 'Regen';
    if (code <= 77) return 'Schneefall';
    if (code <= 82) return 'Regenschauer';
    if (code <= 86) return 'Schneeschauer';
    return 'Gewitter';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-center h-20">
          <RefreshCw size={24} className="animate-spin text-white/70" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="font-medium">Wetter nicht verfugbar</p>
            <p className="text-sm text-white/70">Linz, Altenberger Str.</p>
          </div>
        </div>
      </div>
    );
  }

  const weatherStyle = getWeatherIcon(weather?.weather_code || 0);

  return (
    <div className={`bg-gradient-to-br ${weatherStyle.bg} rounded-2xl p-5 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl sm:text-5xl font-bold">
            {Math.round(weather?.temperature_2m || 0)}°
          </p>
          <p className="text-white/80 text-sm mt-1">
            {getWeatherDescription(weather?.weather_code || 0)}
          </p>
          <p className="text-white/60 text-xs mt-0.5">
            Linz, JKU
          </p>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
            {weatherStyle.icon === 'sun' && (
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            )}
            {weatherStyle.icon === 'cloud-sun' && (
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                <path d="M22 10a6 6 0 0 0-6-6 6 6 0 0 0-5.59 3.8"/>
              </svg>
            )}
            {weatherStyle.icon === 'cloud' && (
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
            )}
            {weatherStyle.icon === 'cloud-rain' && (
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                <path d="M16 14v6M8 14v6M12 16v6"/>
              </svg>
            )}
            {weatherStyle.icon === 'cloud-snow' && (
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01"/>
              </svg>
            )}
            {weatherStyle.icon === 'cloud-lightning' && (
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/>
                <path d="m13 12-3 5h4l-3 5"/>
              </svg>
            )}
          </div>
          <div className="text-xs text-white/70 space-y-0.5">
            <p>Luftfeucht.: {weather?.relative_humidity_2m || 0}%</p>
            <p>Wind: {Math.round(weather?.wind_speed_10m || 0)} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD SECTION ─────────────────────────────────────────────────────
function DashboardSection({ stats, loading, onRefresh, onNotificationUpdate, unreadCounts, onNavigateToSection, versions }) {
  const [visitors24h, setVisitors24h] = useState(0);
  const totalUnread = unreadCounts?.total || 0;

  useEffect(() => {
    const fetchVisitorCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/stats/visitors-24h`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setVisitors24h(data.count || 0);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Besucherzahlen:', err);
      }
    };
    fetchVisitorCount();
  }, []);

  const statCards = [
    { label: 'Besucher (24h)', value: visitors24h, icon: TrendingUp, color: 'blue' },
    { label: 'Ungelesene Nachrichten', value: totalUnread, icon: Bell, color: totalUnread > 0 ? 'orange' : 'green' },
    { label: 'Events', value: stats?.total_events || 0, icon: Calendar, color: 'teal' },
    { label: 'Anmeldungen', value: stats?.total_registrations || 0, icon: UserPlus, color: 'green' },
    { label: 'LVA Bewertungen', value: stats?.total_lva_ratings || 0, icon: BookOpen, color: 'amber' },
    { label: 'Umfrage-Teilnahmen', value: stats?.total_survey_responses || 0, icon: ClipboardList, color: 'slate' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors shrink-0"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Aktualisieren
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LiveClock />
        <WeatherWidget />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map(card => (
          <div key={card.label} className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border ${colorMap[card.color]}`}>
            <card.icon size={20} className="mb-2 sm:mb-3 sm:w-6 sm:h-6" />
            <p className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{card.value}</p>
            <p className="text-xs sm:text-sm opacity-80 truncate">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <NotificationCenter onUnreadCountUpdate={onNotificationUpdate} onNavigateToSection={onNavigateToSection} />

        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Activity size={16} className="sm:w-[18px] sm:h-[18px]" /> Letzte Aktivitaten
          </h3>
          {stats?.recent_activity?.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
              {stats.recent_activity.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-lg sm:rounded-xl">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Activity size={12} className="text-blue-600 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-slate-700 break-words">{log.description}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">{log.admin_name} - {new Date(log.created_at).toLocaleString('de-AT')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs sm:text-sm text-center py-4">Keine Aktivitaten vorhanden</p>
          )}
        </div>
      </div>

      {(versions?.website || versions?.app) && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex justify-center items-center gap-4 text-xs text-slate-400">
            {versions?.website && (
              <span>
                Website <span className="font-medium text-slate-500">v{versions.website}</span>
              </span>
            )}
            {versions?.website && versions?.app && (
              <span className="text-slate-300">|</span>
            )}
            {versions?.app && (
              <span>
                App <span className="font-medium text-slate-500">v{versions.app}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NEWS EDITOR MODAL ─────────────────────────────────────────────────────
function NewsEditorModal({ news, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    title: news?.title || '',
    content: news?.content || '',
    excerpt: news?.excerpt || '',
    priority: news?.priority || 'medium',
    color: news?.color || 'blue',
    is_published: news?.is_published || false,
    is_pinned: news?.is_pinned || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {news ? 'News bearbeiten' : 'Neue News erstellen'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Titel *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Überschrift der News"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Inhalt *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Der vollständige Inhalt der News..."
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Kurzfassung (optional)</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Eine kurze Zusammenfassung für die Vorschau..."
            />
          </div>

          {/* Priority & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priorität</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityOptions.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Farbe</label>
              <div className="flex gap-2">
                {colorOptions.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={`w-8 h-8 rounded-full ${c.class} ${
                      form.color === c.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Veröffentlichen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-slate-700">Anpinnen</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {news ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── NEWS SECTION ──────────────────────────────────────────────────────────
function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/news/all');
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/api/news/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiRequest('/api/news', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowEditor(false);
      setEditing(null);
      fetchNews();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('News wirklich löschen?')) return;
    try {
      await apiRequest(`/api/news/${id}`, { method: 'DELETE' });
      fetchNews();
    } catch (err) {
      alert(err.message);
    }
  };

  const togglePublish = async (item) => {
    try {
      await apiRequest(`/api/news/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !item.is_published })
      });
      fetchNews();
    } catch (err) {
      alert(err.message);
    }
  };

  const togglePin = async (item) => {
    try {
      await apiRequest(`/api/news/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_pinned: !item.is_pinned })
      });
      fetchNews();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">News verwalten</h2>
        <button
          onClick={() => { setEditing(null); setShowEditor(true); }}
          data-testid="create-news-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Neue News
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <Newspaper size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Noch keine News vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map(item => (
            <motion.div
              key={item.id}
              layout
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4"
            >
              {/* Color Indicator */}
              <div className={`w-1 h-12 rounded-full bg-${item.color}-500`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900 truncate">{item.title}</h4>
                  {item.is_pinned && <Pin size={14} className="text-gold-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className={`px-2 py-0.5 rounded-full ${
                    item.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.is_published ? 'Veröffentlicht' : 'Entwurf'}
                  </span>
                  <span>{item.priority}</span>
                  <span>•</span>
                  <span>{item.author_name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {item.views}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePin(item)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.is_pinned ? 'bg-gold-100 text-gold-600' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                  title={item.is_pinned ? 'Nicht mehr anpinnen' : 'Anpinnen'}
                >
                  {item.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <button
                  onClick={() => togglePublish(item)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.is_published ? 'bg-green-100 text-green-600' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                  title={item.is_published ? 'Verbergen' : 'Veröffentlichen'}
                >
                  {item.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => { setEditing(item); setShowEditor(true); }}
                  className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  title="Löschen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showEditor && (
          <NewsEditorModal
            news={editing}
            onSave={handleSave}
            onClose={() => { setShowEditor(false); setEditing(null); }}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── USER EDITOR MODAL ─────────────────────────────────────────────────────
function UserEditorModal({ user, roles, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    display_name: user?.display_name || '',
    role_id: user?.role_id || (roles[0]?.id || null),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.password) delete data.password;
    onSave(data);
  };

  const getRoleColorClass = (colorId) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      gold: 'bg-amber-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      teal: 'bg-teal-500',
      orange: 'bg-orange-500',
      slate: 'bg-slate-500',
    };
    return colorMap[colorId] || 'bg-blue-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md"
      >
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {user ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Benutzername *</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={!!user}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Anzeigename *</label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">E-Mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Passwort {user ? '(leer = unverändert)' : '*'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!user}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rolle *</label>
            <div className="space-y-2">
              {roles.map(role => (
                <label
                  key={role.id}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    form.role_id === role.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={form.role_id === role.id}
                    onChange={() => setForm({ ...form, role_id: role.id })}
                    className="sr-only"
                    disabled={user?.is_master}
                  />
                  <div className={`w-3 h-3 rounded-full ${getRoleColorClass(role.color)}`} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{role.display_name}</p>
                  </div>
                  {form.role_id === role.id && (
                    <Check size={16} className="text-blue-500" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-xl flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Speichern
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── USERS SECTION ─────────────────────────────────────────────────────────
function UsersSection({ admin: currentAdmin }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        apiRequest('/api/admins'),
        apiRequest('/api/roles/available'),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/api/admins/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiRequest('/api/admins', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowEditor(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Benutzer wirklich löschen?')) return;
    try {
      await apiRequest(`/api/admins/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (user) => {
    try {
      await apiRequest(`/api/admins/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !user.is_active })
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleColorClass = (colorId) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      gold: 'bg-amber-100 text-amber-700',
      red: 'bg-red-100 text-red-700',
      purple: 'bg-purple-100 text-purple-700',
      teal: 'bg-teal-100 text-teal-700',
      orange: 'bg-orange-100 text-orange-700',
      slate: 'bg-slate-100 text-slate-700',
    };
    return colorMap[colorId] || 'bg-blue-100 text-blue-700';
  };

  const canEdit = currentAdmin?.is_master;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Benutzer verwalten</h2>
          <p className="text-sm text-slate-500 mt-1">Benutzer erstellen und Rollen zuweisen</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditing(null); setShowEditor(true); }}
            data-testid="create-user-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium"
          >
            <Plus size={16} /> Neuer Benutzer
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                user.is_master ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {user.is_master ? <Crown className="text-amber-600" size={20} /> : <User className="text-blue-600" size={20} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">{user.display_name}</h4>
                  {user.is_master ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Master</span>
                  ) : user.role_name && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColorClass(user.role_color)}`}>
                      {user.role_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>@{user.username}</span>
                  <span>-</span>
                  <span>{user.email}</span>
                  <span>-</span>
                  <span className={user.is_active ? 'text-green-600' : 'text-red-500'}>
                    {user.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>

              {!user.is_master && canEdit && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(user)}
                    className={`p-2 rounded-lg transition-colors ${
                      user.is_active ? 'hover:bg-red-100 text-slate-400 hover:text-red-600' : 'hover:bg-green-100 text-slate-400 hover:text-green-600'
                    }`}
                    title={user.is_active ? 'Deaktivieren' : 'Aktivieren'}
                  >
                    {user.is_active ? <EyeOff size={16} /> : <Check size={16} />}
                  </button>
                  <button
                    onClick={() => { setEditing(user); setShowEditor(true); }}
                    className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg"
                    title="Bearbeiten"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg"
                    title="Löschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showEditor && (
          <UserEditorModal
            user={editing}
            roles={roles}
            onSave={handleSave}
            onClose={() => { setShowEditor(false); setEditing(null); }}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// ─── ACTIVITY SECTION ──────────────────────────────────────────────────────
function LicenseSection() {
  const [licenses, setLicenses] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [amount, setAmount] = useState(1);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  const charToValue = (c) => {
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
    return parseInt(c) + 26; // 0=26, 1=27, ..., 9=35
  };

  const valueToChar = (v) => {
    if (v < 26) return String.fromCharCode(65 + v); // 0-25 = A-Z
    return String(v - 26); // 26-35 = 0-9
  };

  const generateSingleLicense = () => {
    // Generate 4 random characters
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * 36)];
    }
    // Calculate weighted sum: pos1*1 + pos2*2 + pos3*3 + pos4*4
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      sum += charToValue(code[i]) * (i + 1);
    }
    // Find pos5 so that (sum + pos5*5) mod 36 = 0
    let pos5 = ((-sum * 29) % 36 + 36) % 36;
    code += valueToChar(pos5);
    return code;
  };

  const generateLicenses = () => {
    setGenerating(true);
    setTimeout(() => {
      const newLicenses = [];
      for (let i = 0; i < amount; i++) {
        newLicenses.push({
          id: Date.now() + i,
          code: generateSingleLicense(),
          created: new Date().toLocaleString('de-AT'),
          status: 'active'
        });
      }
      setLicenses(prev => [...newLicenses, ...prev]);
      setGenerating(false);
    }, 300);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
  };

  const copyAllToClipboard = () => {
    const allCodes = licenses.map(l => l.code).join('\n');
    navigator.clipboard.writeText(allCodes);
  };

  const exportAsCSV = () => {
    const header = 'Code,Erstellt\n';
    const rows = licenses.map(l => `${l.code},${l.created}`).join('\n');
    const csv = header + rows;
    downloadFile(csv, 'lizenzen.csv', 'text/csv');
  };

  const exportAsTXT = () => {
    const txt = licenses.map(l => l.code).join('\n');
    downloadFile(txt, 'lizenzen.txt', 'text/plain');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeLicense = (id) => {
    setLicenses(prev => prev.filter(l => l.id !== id));
  };

  const clearAll = () => {
    setLicenses([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">ReviewLicense</h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <p className="text-sm text-slate-500 mb-4">
          Generiere einzigartige 5-stellige Lizenzcodes für die Verifizierung.
        </p>
        
        {/* Generator Controls */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Anzahl:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={generateLicenses}
            disabled={generating}
            data-testid="generate-license-btn"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            Generieren
          </button>
          {licenses.length > 0 && (
            <>
              <button
                onClick={copyAllToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Check size={16} /> Alle kopieren
              </button>
              <button
                onClick={exportAsCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                CSV
              </button>
              <button
                onClick={exportAsTXT}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                TXT
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 size={16} /> Löschen
              </button>
            </>
          )}
        </div>
        
        {licenses.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <Shield size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Noch keine Lizenzen generiert</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">
                Generierte Lizenzen: <span className="text-blue-500">{licenses.length}</span>
              </p>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {licenses.map(license => (
                <div key={license.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <code className="text-lg font-mono font-bold text-slate-900 bg-white px-4 py-2 rounded-lg border border-slate-200">
                      {license.code}
                    </code>
                    <span className="text-xs text-slate-400">{license.created}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(license.code)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      title="Kopieren"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => removeLicense(license.id)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      title="Entfernen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ACTIVITY SECTION ──────────────────────────────────────────────────────
function ActivitySection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiRequest('/api/activity?limit=100');
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    if (action.includes('CREATE')) return <Plus size={14} />;
    if (action.includes('UPDATE')) return <Edit2 size={14} />;
    if (action.includes('DELETE')) return <Trash2 size={14} />;
    if (action.includes('LOGIN')) return <User size={14} />;
    return <Activity size={14} />;
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-600';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-600';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-600';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-600';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Aktivitätsprotokoll</h2>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <Activity size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Keine Aktivitäten vorhanden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{log.description}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {log.admin_name} • {new Date(log.created_at).toLocaleString('de-AT')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS SECTION ──────────────────────────────────────────────────────
function SettingsSection({ admin, onLogout }) {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (form.new_password !== form.confirm_password) {
      setMessage({ type: 'error', text: 'Passwörter stimmen nicht überein' });
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: form.current_password,
          new_password: form.new_password,
        }),
      });
      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert' });
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Einstellungen</h2>

      <div className="max-w-lg space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Profil</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Benutzername</span>
              <span className="text-slate-900 text-sm font-medium">{admin?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">E-Mail</span>
              <span className="text-slate-900 text-sm font-medium">{admin?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 text-sm">Rolle</span>
              <span className="text-slate-900 text-sm font-medium">{admin?.role === 'master' ? 'Master Admin' : admin?.role}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Passwort ändern</h3>
          
          {admin?.is_master ? (
            /* Master-Admin Sperre */
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6V9a3 3 0 00-6 0v2" />
                  </svg>
                </div>
                <div>
                  <p className="text-amber-800 font-medium text-sm">Passwortänderung nicht möglich</p>
                  <p className="text-amber-700 text-sm mt-1">Der Master admin ist nicht befugt sein Passwort zu ändern. Verwaltung liegt bei Astra Capital e.U.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Normales Passwort-Formular für andere Admins */
            <>
              {message.text && (
                <div className={`p-3 rounded-xl mb-4 text-sm ${
                  message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Aktuelles Passwort</label>
                  <input
                    type="password"
                    value={form.current_password}
                    onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Neues Passwort</label>
                  <input
                    type="password"
                    value={form.new_password}
                    onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Passwort bestätigen</label>
                  <input
                    type="password"
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Passwort ändern
                </button>
              </form>
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors"
        >
          <LogOut size={18} /> Abmelden
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PANEL ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [versions, setVersions] = useState({ website: null, app: null });

  const token = localStorage.getItem('token');

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const data = await apiRequest('/api/notifications/unread-counts');
      setUnreadCounts(data);
    } catch (err) {
      console.error('Fehler beim Laden der Benachrichtigungen:', err);
    }
  }, []);

  const fetchVersions = useCallback(async () => {
    try {
      const data = await apiRequest('/api/changelog/latest');
      setVersions({
        website: data.website?.version || null,
        app: data.app?.version || null
      });
    } catch (err) {
      console.error('Fehler beim Laden der Versionen:', err);
    }
  }, []);

  useEffect(() => {
    const adminData = localStorage.getItem('admin');

    if (!token || !adminData) {
      navigate('/login');
      return;
    }

    setAdmin(JSON.parse(adminData));
    fetchStats();
    fetchUnreadCounts();
    fetchVersions();

    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [navigate, token, fetchUnreadCounts, fetchVersions]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await apiRequest('/api/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    navigate('/login');
  };

  const getSectionTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      news: 'News',
      events: 'Kalender',
      registrations: 'Anmeldungen',
      sgu: 'SGU',
      lva: 'LVA',
      kanban: 'Kanban',
      partners: 'Partner',
      sites: 'Sites',
      misc: 'Sonstiges',
      email: 'E-Mail',
      users: 'Benutzer',
      verwaltung: 'Verwaltung',
      activity: 'Aktivität',
      settings: 'Einstellungen',
    };
    return titles[activeSection] || 'Admin';
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-slate-100" data-testid="admin-panel">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Menu öffnen"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            ÖH
          </div>
          <span className="text-white font-medium text-sm">{getSectionTitle()}</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 h-full"
              style={{ maxHeight: '100dvh' }}
            >
              <Sidebar
                active={activeSection}
                setActive={setActiveSection}
                admin={admin}
                onLogout={handleLogout}
                onClose={() => setMobileMenuOpen(false)}
                isMobile={true}
                unreadCounts={unreadCounts}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64">
          <div className="fixed left-0 top-0 bottom-0 w-64 z-30">
            <Sidebar
              active={activeSection}
              setActive={setActiveSection}
              admin={admin}
              onLogout={handleLogout}
              isMobile={false}
              unreadCounts={unreadCounts}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 pt-16 lg:pt-0 min-h-screen overflow-x-hidden pb-8 w-full lg:w-[calc(100%-16rem)]">
          <div className="p-3 sm:p-5 lg:p-8 overflow-x-hidden max-w-full">
            {activeSection === 'dashboard' && (
              <DashboardSection
                stats={stats}
                loading={statsLoading}
                onRefresh={fetchStats}
                onNotificationUpdate={fetchUnreadCounts}
                unreadCounts={unreadCounts}
                onNavigateToSection={setActiveSection}
                versions={versions}
              />
            )}
            {activeSection === 'news' && <NewsSection />}
            {activeSection === 'events' && <AdminEvents />}
            {activeSection === 'registrations' && <AdminRegistrations />}
            {activeSection === 'sgu' && <AdminSGU />}
            {activeSection === 'lva' && <AdminLVA />}
            {activeSection === 'kanban' && <AdminKanban />}
            {activeSection === 'survey' && <AdminSurvey token={token} />}
            {activeSection === 'partners' && <AdminPartners />}
            {activeSection === 'sites' && <AdminSites />}
            {activeSection === 'misc' && <AdminMisc />}
            {activeSection === 'email' && <AdminEmail />}
            {activeSection === 'users' && <UsersSection admin={admin} />}
            {activeSection === 'verwaltung' && <AdminVerwaltung />}
            {activeSection === 'activity' && <ActivitySection />}
            {activeSection === 'settings' && <SettingsSection admin={admin} onLogout={handleLogout} />}
            {activeSection === 'changelog' && <AdminChangelog isMaster={admin?.is_master} />}
          </div>
        </main>
      </div>
    </div>
  );
}
