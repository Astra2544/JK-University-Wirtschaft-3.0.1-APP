/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KALENDER PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Kalenderansicht fuer Events und Veranstaltungen.
 *  Monats- und Listenansicht mit Tag-Filterung.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealOnScroll } from '../components/Animations';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MapPin,
  Clock,
  Tag,
  Grid3X3,
  List,
  CalendarDays,
  X,
  Download,
  Users,
  UserPlus,
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';
import Marquee from '../components/Marquee';
import PageHelper from '../components/PageHelper';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const colorMap = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  gold: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
};

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export default function Kalender() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    study_program: '',
    participation_type: 'yes',
  });

  const monthNames = t('kalender.months', { returnObjects: true });
  const dayNames = t('kalender.days', { returnObjects: true });

  useEffect(() => {
    fetchEvents();
    fetchTags();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchEvents = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await fetch(`${API_URL}/api/events?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setEvents(data);
      } else {
        console.error('Error fetching events:', data);
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/tags`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllTags(data);
      } else {
        setAllTags([]);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      setAllTags([]);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || (event.tags && event.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    });
  }, [events, searchQuery, selectedTag]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7;
    return { daysInMonth, startingDay };
  };

  const getEventsForDay = (day) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setRegistrationLoading(true);
    setRegistrationError('');

    try {
      const response = await fetch(`${API_URL}/api/events/${selectedEvent.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Anmeldung fehlgeschlagen');
      }

      setRegistrationSuccess(true);
      setShowRegistrationForm(false);
      setRegistrationForm({ name: '', email: '', study_program: '', participation_type: 'yes' });
    } catch (err) {
      setRegistrationError(err.message);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const openRegistrationForm = () => {
    setShowRegistrationForm(true);
    setRegistrationSuccess(false);
    setRegistrationError('');
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setShowRegistrationForm(false);
    setRegistrationSuccess(false);
    setRegistrationError('');
    setRegistrationForm({ name: '', email: '', study_program: '', participation_type: 'yes' });
  };

  const dateLocale = i18n.language === 'en' ? 'en-GB' : 'de-DE';

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatICSDate = (dateStr, allDay = false) => {
    const date = new Date(dateStr);
    if (allDay) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    }
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const downloadICS = (event) => {
    const uid = `event-${event.id}@oehwirtschaft.at`;
    const now = formatICSDate(new Date().toISOString());
    const startDate = formatICSDate(event.start_date, event.all_day);
    const endDate = event.end_date
      ? formatICSDate(event.end_date, event.all_day)
      : event.all_day
        ? formatICSDate(new Date(new Date(event.start_date).getTime() + 86400000).toISOString(), true)
        : formatICSDate(new Date(new Date(event.start_date).getTime() + 3600000).toISOString());

    const escapeICS = (str) => {
      if (!str) return '';
      return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OEH Wirtschaft//Kalender//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
    ];

    if (event.all_day) {
      icsContent.push(`DTSTART;VALUE=DATE:${startDate}`);
      icsContent.push(`DTEND;VALUE=DATE:${endDate}`);
    } else {
      icsContent.push(`DTSTART:${startDate}`);
      icsContent.push(`DTEND:${endDate}`);
    }

    icsContent.push(`SUMMARY:${escapeICS(event.title)}`);

    if (event.description) {
      icsContent.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }
    if (event.location) {
      icsContent.push(`LOCATION:${escapeICS(event.location)}`);
    }

    icsContent.push('END:VEVENT', 'END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCalendarGrid = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const days = [];
    const today = new Date();

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-28 bg-slate-50/50" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = today.getDate() === day &&
                      today.getMonth() === currentDate.getMonth() &&
                      today.getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={day}
          className={`h-24 md:h-28 p-1 md:p-2 border-t border-slate-100 transition-colors hover:bg-blue-50/30 ${
            isToday ? 'bg-blue-50/50' : ''
          }`}
        >
          <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
            isToday ? 'bg-blue-500 text-white' : 'text-slate-600'
          }`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 2).map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate ${
                  colorMap[event.color]?.bg || 'bg-blue-100'
                } ${colorMap[event.color]?.text || 'text-blue-700'} hover:opacity-80 transition-opacity`}
              >
                {event.title}
              </button>
            ))}
            {dayEvents.length > 2 && (
              <p className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2} {t('kalender.more')}</p>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderListView = () => {
    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    if (sortedEvents.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('kalender.noEvents')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedEvents.map(event => (
          <button
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className={`w-full text-left p-4 rounded-xl border ${
              colorMap[event.color]?.border || 'border-slate-200'
            } bg-white hover:shadow-md transition-all`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${colorMap[event.color]?.dot || 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{event.title}</h3>
                  {event.registration_required && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full flex items-center gap-0.5">
                      <UserPlus size={10} /> Anmeldung
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {event.all_day ? t('kalender.allDay') : formatTime(event.start_date)}
                  </span>
                  <span>{formatDate(event.start_date)}</span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.location}
                    </span>
                  )}
                  {event.registration_required && (
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {event.registration_count || 0}{event.max_participants ? `/${event.max_participants}` : ''}
                    </span>
                  )}
                </div>
                {event.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.tags.split(',').map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <section className="pt-28 pb-8 md:pt-40 md:pb-12 px-5 relative overflow-hidden">
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

              <div className="absolute top-0 left-0 right-0 h-3.5 sm:h-5 md:h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg sm:rounded-t-xl" />

              <div className="absolute top-4 sm:top-6 md:top-7 left-1 right-1 bottom-1 sm:left-1.5 sm:right-1.5 sm:bottom-1.5 md:left-2 md:right-2 md:bottom-2">
                <div className="grid grid-cols-7 gap-[1px] md:gap-0.5">
                  {[...Array(21)].map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-[1px] sm:rounded-[2px] ${
                        i === 10 ? 'bg-gold-500' : i === 5 || i === 16 ? 'bg-blue-500/40' : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute -top-1 left-2 sm:left-3 md:left-4 w-0.5 sm:w-1 md:w-1.5 h-2 sm:h-3 md:h-4 bg-slate-300 rounded-full" />
              <div className="absolute -top-1 right-2 sm:right-3 md:right-4 w-0.5 sm:w-1 md:w-1.5 h-2 sm:h-3 md:h-4 bg-slate-300 rounded-full" />
            </div>

            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-5 md:h-5 rounded-full border border-dashed border-gold-500/30" />
          </motion.div>
        </div>


        <div className="max-w-[1120px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[3px] rounded-full bg-gold-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('kalender.section')}</p>
            </div>
            <h1 data-testid="kalender-title" className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              {t('kalender.title')}
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              {t('kalender.desc')}
            </p>
          </motion.div>
        </div>
      </section>

      <Marquee
        items={t('kalender.marquee', { returnObjects: true })}
        variant="gold"
        speed={36}
        reverse
      />

      <section className="px-5 pt-8 pb-6">
        <div className="max-w-[1120px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateMonth(-1)}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                {t('kalender.today')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('kalender.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-44 md:w-56 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                  selectedTag ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter size={18} />
              </button>

              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    view === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && allTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedTag('')}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      !selectedTag ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t('kalender.all')}
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        selectedTag === tag ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Tag size={12} className="inline mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section data-testid="kalender-content" className="px-5 pb-20">
        <div className="max-w-[1120px] mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : view === 'month' ? (
            <RevealOnScroll>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-7 bg-slate-50">
                  {dayNames.map(day => (
                    <div key={day} className="py-3 text-center text-sm font-semibold text-slate-600">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {renderCalendarGrid()}
                </div>
              </div>
            </RevealOnScroll>
          ) : (
            <RevealOnScroll>
              {renderListView()}
            </RevealOnScroll>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeEventModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 ${colorMap[selectedEvent.color]?.bg || 'bg-blue-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedEvent.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays size={16} />
                      {formatDate(selectedEvent.start_date)}
                    </div>
                    {selectedEvent.registration_required && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full flex items-center gap-1">
                          <UserPlus size={12} /> Anmeldung erforderlich
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeEventModal}
                    className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {!selectedEvent.all_day && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock size={18} className="text-slate-400" />
                    <span>{formatTime(selectedEvent.start_date)}{selectedEvent.end_date && ` - ${formatTime(selectedEvent.end_date)}`}</span>
                  </div>
                )}
                {selectedEvent.all_day && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock size={18} className="text-slate-400" />
                    <span>{t('kalender.allDay')}</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin size={18} className="text-slate-400" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.registration_required && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Users size={18} className="text-slate-400" />
                    <span>
                      {selectedEvent.registration_count || 0}
                      {selectedEvent.max_participants ? ` / ${selectedEvent.max_participants}` : ''} Teilnehmer
                    </span>
                  </div>
                )}
                {selectedEvent.description && (
                  <p className="text-slate-600 pt-2 border-t border-slate-100">
                    {selectedEvent.description}
                  </p>
                )}
                {selectedEvent.tags && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedEvent.tags.split(',').map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {selectedEvent.registration_required && !registrationSuccess && !showRegistrationForm && selectedEvent.registration_open && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Anmeldung erforderlich</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Für dieses Event ist eine Anmeldung notwendig.
                          {selectedEvent.registration_deadline && (
                            <> Anmeldefrist: {new Date(selectedEvent.registration_deadline).toLocaleDateString('de-DE')}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={openRegistrationForm}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                    >
                      <UserPlus size={16} /> Jetzt anmelden
                    </button>
                  </div>
                )}

                {selectedEvent.registration_required && !selectedEvent.registration_open && !registrationSuccess && (
                  <div className="bg-slate-100 rounded-xl p-4 text-center">
                    <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">
                      {selectedEvent.max_participants && selectedEvent.registration_count >= selectedEvent.max_participants
                        ? 'Maximale Teilnehmerzahl erreicht'
                        : 'Anmeldefrist abgelaufen'}
                    </p>
                  </div>
                )}

                {registrationSuccess && (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">Anmeldung eingegangen!</p>
                        <p className="text-sm text-green-600">Du erhältst eine Bestätigung per E-Mail.</p>
                      </div>
                    </div>
                  </div>
                )}

                {showRegistrationForm && (
                  <form onSubmit={handleRegistrationSubmit} className="bg-slate-50 rounded-xl p-4 space-y-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <UserPlus size={18} /> Event-Anmeldung
                    </h3>

                    {registrationError && (
                      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} /> {registrationError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={registrationForm.name}
                        onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Dein vollstaendiger Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail *</label>
                      <input
                        type="email"
                        required
                        value={registrationForm.email}
                        onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="deine@email.at"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Studiengang</label>
                      <input
                        type="text"
                        value={registrationForm.study_program}
                        onChange={(e) => setRegistrationForm({ ...registrationForm, study_program: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="z.B. Wirtschaftswissenschaften"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Teilnahme</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="participation"
                            value="yes"
                            checked={registrationForm.participation_type === 'yes'}
                            onChange={(e) => setRegistrationForm({ ...registrationForm, participation_type: e.target.value })}
                            className="text-blue-500"
                          />
                          <span className="text-sm text-slate-700">Ja, ich nehme teil</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="participation"
                            value="maybe"
                            checked={registrationForm.participation_type === 'maybe'}
                            onChange={(e) => setRegistrationForm({ ...registrationForm, participation_type: e.target.value })}
                            className="text-blue-500"
                          />
                          <span className="text-sm text-slate-700">Vielleicht</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRegistrationForm(false)}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        disabled={registrationLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        {registrationLoading ? (
                          <><Loader2 size={16} className="animate-spin" /> Wird gesendet...</>
                        ) : (
                          <><Check size={16} /> Anmelden</>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                <button
                  onClick={() => downloadICS(selectedEvent)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                >
                  <Download size={18} />
                  {t('kalender.saveToCalendar')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
