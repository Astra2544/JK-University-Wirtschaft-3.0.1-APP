/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  NOTIFICATION CENTER | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Benachrichtigungszentrale fuer Admin-Aktionen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, ChevronDown, ChevronUp, Clock, Mail, Calendar,
  BookOpen, ClipboardList, X, AlertCircle, RefreshCw, ArrowRight,
  LayoutGrid, Newspaper, Users, Building2, Globe, History
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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

const SECTION_CONFIG = {
  events: { icon: Calendar, label: 'Kalender', color: 'blue', navId: 'events' },
  email: { icon: Mail, label: 'E-Mail / Anfragen', color: 'green', navId: 'email' },
  lva: { icon: BookOpen, label: 'LVA', color: 'amber', navId: 'lva' },
  misc: { icon: ClipboardList, label: 'Umfrage', color: 'teal', navId: 'survey' },
  kanban: { icon: LayoutGrid, label: 'Kanban', color: 'blue', navId: 'kanban' },
  changelog: { icon: History, label: 'Developer News', color: 'slate', navId: 'changelog' },
  news: { icon: Newspaper, label: 'News', color: 'blue', navId: 'news' },
  sgu: { icon: Bell, label: 'SGU', color: 'green', navId: 'sgu' },
  partners: { icon: Building2, label: 'Partner', color: 'amber', navId: 'partners' },
  sites: { icon: Globe, label: 'Sites', color: 'slate', navId: 'sites' },
  users: { icon: Users, label: 'Benutzer', color: 'red', navId: 'users' },
  team: { icon: Users, label: 'Team', color: 'teal', navId: 'team' },
};

function NotificationItem({ notification, onMarkRead, onNavigate, isExpanded, onToggle }) {
  const config = SECTION_CONFIG[notification.section] || { icon: Bell, label: notification.section, color: 'slate', navId: null };
  const Icon = config.icon;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min.`;
    if (hours < 24) return `vor ${hours} Std.`;
    if (days < 7) return `vor ${days} Tagen`;
    return date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    teal: 'bg-teal-50 border-teal-200 text-teal-600',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  };

  const bgClass = notification.is_read ? 'bg-slate-50/50' : 'bg-white';
  const borderClass = notification.is_read ? 'border-slate-100' : 'border-l-4 border-l-orange-400 border-slate-200';

  const handleNavigateToSection = (e) => {
    e.stopPropagation();
    if (config.navId && onNavigate) {
      if (!notification.is_read) {
        onMarkRead(notification.id);
      }
      onNavigate(config.navId);
    }
  };

  return (
    <motion.div
      layout
      className={`rounded-xl border ${borderClass} ${bgClass} overflow-hidden transition-all`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[config.color]}`}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[config.color]}`}>
                {config.label}
              </span>
              {!notification.is_read && (
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              )}
            </div>
            <h4 className={`font-medium text-sm ${notification.is_read ? 'text-slate-500' : 'text-slate-900'}`}>
              {notification.title}
            </h4>
            <p className={`text-sm mt-1 ${notification.is_read ? 'text-slate-400' : 'text-slate-600'}`}>
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <Clock size={12} />
              <span>{formatDate(notification.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {config.navId && onNavigate && (
              <button
                onClick={handleNavigateToSection}
                className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                title={`Zu ${config.label} gehen`}
              >
                <ArrowRight size={16} />
              </button>
            )}
            {!notification.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition-colors"
                title="Als gelesen markieren"
              >
                <Check size={16} />
              </button>
            )}
            <button className="p-1 text-slate-400">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && notification.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100"
          >
            <div className="p-4 bg-slate-50/50">
              <h5 className="text-xs font-medium text-slate-500 uppercase mb-3">Details</h5>
              <div className="space-y-2">
                {Object.entries(notification.details).map(([key, value]) => {
                  if (value === null || value === undefined) return null;
                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  let displayValue = value;
                  if (typeof value === 'boolean') displayValue = value ? 'Ja' : 'Nein';
                  if (Array.isArray(value)) displayValue = value.join(', ');
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-slate-500">{displayKey}:</span>
                      <span className="text-slate-700 font-medium">{String(displayValue)}</span>
                    </div>
                  );
                })}
              </div>
              {config.navId && onNavigate && (
                <button
                  onClick={handleNavigateToSection}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Zu {config.label} gehen
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function NotificationCenter({ onUnreadCountUpdate, onNavigateToSection }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiRequest('/api/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Fehler beim Laden der Benachrichtigungen:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (notificationId) => {
    setMarkingRead(true);
    try {
      await apiRequest(`/api/notifications/${notificationId}/mark-read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      if (onUnreadCountUpdate) {
        onUnreadCountUpdate();
      }
    } catch (err) {
      console.error('Fehler:', err);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await apiRequest('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onUnreadCountUpdate) {
        onUnreadCountUpdate();
      }
    } catch (err) {
      console.error('Fehler:', err);
    } finally {
      setMarkingRead(false);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center relative">
            <Bell className="text-orange-600" size={20} />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Nachrichten</h3>
            <p className="text-xs text-slate-500">
              {unreadNotifications.length > 0
                ? `${unreadNotifications.length} ungelesen`
                : 'Keine neuen Nachrichten'}
            </p>
          </div>
        </div>
        {unreadNotifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingRead}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {markingRead ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
            Alle gelesen
          </button>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Keine Benachrichtigungen vorhanden</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {unreadNotifications.length > 0 && (
              <>
                <div className="text-xs font-medium text-orange-600 uppercase flex items-center gap-2">
                  <AlertCircle size={12} />
                  Ungelesen ({unreadNotifications.length})
                </div>
                {unreadNotifications.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkRead={handleMarkRead}
                    onNavigate={onNavigateToSection}
                    isExpanded={expandedId === notif.id}
                    onToggle={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
                  />
                ))}
              </>
            )}

            {readNotifications.length > 0 && (
              <>
                <div className="text-xs font-medium text-slate-400 uppercase mt-4">
                  Gelesen ({readNotifications.length})
                </div>
                {readNotifications.slice(0, 10).map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkRead={handleMarkRead}
                    onNavigate={onNavigateToSection}
                    isExpanded={expandedId === notif.id}
                    onToggle={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
