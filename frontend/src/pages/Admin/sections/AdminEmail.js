/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN EMAIL SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Konfiguration der Empfaenger-E-Mails fuer das Kontaktformular.
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
  Mail, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Info, Send
} from 'lucide-react';
import SectionNotificationBanner from '../components/SectionNotificationBanner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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

// ─── MAIN ADMIN EMAIL COMPONENT ────────────────────────────────────────────
export default function AdminEmail() {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/settings/contact_emails');
      // Emails are stored as comma-separated string
      const emailList = data.value ? data.value.split(',').map(e => e.trim()).filter(e => e) : [];
      setEmails(emailList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const saveEmails = async (emailList) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await apiRequest('/api/admin/settings/contact_emails', {
        method: 'POST',
        body: JSON.stringify({ value: emailList.join(',') || null })
      });
      setMessage({ type: 'success', text: 'Änderungen gespeichert!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    
    // Validate email
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Ungültige E-Mail-Adresse' });
      return;
    }
    if (emails.includes(email)) {
      setMessage({ type: 'error', text: 'E-Mail bereits vorhanden' });
      return;
    }

    const newList = [...emails, email];
    setEmails(newList);
    setNewEmail('');
    await saveEmails(newList);
  };

  const handleRemoveEmail = async (emailToRemove) => {
    const newList = emails.filter(e => e !== emailToRemove);
    setEmails(newList);
    await saveEmails(newList);
  };

  return (
    <div>
      <SectionNotificationBanner section="email" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">E-Mail Einstellungen</h2>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Info className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 text-sm mb-1">Kontaktformular E-Mail-Versand</h3>
            <p className="text-blue-700 text-sm leading-relaxed">
              Hier kannst du festlegen, an welche E-Mail-Adressen Nachrichten aus dem Kontaktformular 
              gesendet werden sollen. Du kannst mehrere Empfänger hinzufügen – alle erhalten die Nachricht.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Mail className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Empfänger-E-Mails</h3>
            <p className="text-sm text-slate-500">Kontaktanfragen werden an diese Adressen gesendet</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Message */}
            <AnimatePresence>
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                    message.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span className="text-sm font-medium">{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Email Form */}
            <form onSubmit={handleAddEmail} className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Neue E-Mail-Adresse hinzufügen
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="wirtschaft@oeh.jku.at"
                    data-testid="new-email-input"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || !newEmail.trim()}
                  data-testid="add-email-btn"
                  className="px-5 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                  Hinzufügen
                </button>
              </div>
            </form>

            {/* Email List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Aktive Empfänger ({emails.length})
              </p>
              
              {emails.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-amber-700 text-sm">
                    Keine Empfänger konfiguriert – E-Mails werden nicht versendet
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {emails.map((email) => (
                    <motion.div
                      key={email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Mail className="text-green-600" size={16} />
                        </div>
                        <span className="text-slate-900 font-medium">{email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        disabled={saving}
                        data-testid={`remove-email-${email}`}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Entfernen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
        )}
      </div>

      {/* Test Info */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Send className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 text-sm mb-1">Hinweis</h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              Der E-Mail-Versand funktioniert nur, wenn die SMTP-Einstellungen (Host, User, Passwort) 
              in den Umgebungsvariablen korrekt konfiguriert sind. Bei Problemen kontaktiere den 
              System-Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
