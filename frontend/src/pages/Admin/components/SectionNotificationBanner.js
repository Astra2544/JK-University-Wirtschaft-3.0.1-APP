/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SECTION NOTIFICATION BANNER | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Benachrichtigungs-Banner fuer einzelne Admin-Sektionen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Bell, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function SectionNotificationBanner({ section, onNavigateToDashboard }) {
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await apiRequest('/api/notifications/unread-counts');
        setCount(data[section] || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCount();
  }, [section]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest(`/api/notifications/mark-section-read/${section}`, { method: 'POST' });
      setCount(0);
      setDismissed(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (count === 0 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Bell className="text-orange-600" size={18} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-orange-800">
              {count} neue Nachricht{count !== 1 ? 'en' : ''} in diesem Bereich
            </p>
            <p className="text-sm text-orange-600">
              Sieh dir die Details im Dashboard unter "Nachrichten" an
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
              >
                Zum Dashboard
                <ArrowRight size={14} />
              </button>
            )}
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
            >
              Alle gelesen
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
