/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN MISC SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Sonstige Einstellungen (Instagram, etc.).
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Instagram, Save, RefreshCw, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

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

export default function AdminMisc() {
  const [instagramUsername, setInstagramUsername] = useState('');
  const [embedSocialId, setEmbedSocialId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/misc-settings');
      setInstagramUsername(data.instagram_username || '');
      setEmbedSocialId(data.instagram_widget_url || data.instagram_embed_code || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await apiRequest('/api/admin/misc-settings', {
        method: 'PUT',
        body: JSON.stringify({
          instagram_username: instagramUsername.trim().replace('@', ''),
          instagram_widget_url: embedSocialId.trim(),
        }),
      });
      setMessage({ type: 'success', text: 'Einstellungen gespeichert! Der Feed wird jetzt auf der Startseite angezeigt.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Sonstiges</h2>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
              <Instagram className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Instagram Feed (EmbedSocial)</h3>
              <p className="text-sm text-slate-500">100% kostenlos - 2.000 Views/Monat</p>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl mb-4 text-sm flex items-center gap-2 ${
              message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Instagram Benutzername
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                <input
                  type="text"
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value.replace('@', ''))}
                  placeholder="oeh_wirtschaft_wipaed"
                  className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Wird fur den Link zum Instagram-Profil verwendet
              </p>
            </div>

            {instagramUsername && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Profil-Link:</p>
                <a
                  href={`https://www.instagram.com/${instagramUsername}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                >
                  instagram.com/{instagramUsername}
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <div className="border-t border-slate-100 pt-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                EmbedSocial Embed-Code (vollständig)
              </label>
              <textarea
                value={embedSocialId}
                onChange={(e) => setEmbedSocialId(e.target.value)}
                placeholder='<div class="embedsocial-hashtag" data-ref="abc123...">...</div><script>...</script>'
                rows={6}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
              <p className="text-xs text-slate-400 mt-2">
                Füge den kompletten Embed-Code von EmbedSocial hier ein (inkl. Script-Tag)
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-xl transition-colors"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Speichern
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gradient-to-br from-pink-50 via-red-50 to-yellow-50 rounded-2xl border border-pink-100 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shrink-0">
              <Instagram className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-slate-800 mb-3">Anleitung: EmbedSocial Widget erstellen</p>
              <ol className="text-sm text-slate-700 space-y-3">
                <li className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>
                    Gehe zu{' '}
                    <a
                      href="https://embedsocial.com/free-instagram-widget/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 font-medium underline hover:text-pink-700"
                    >
                      embedsocial.com/free-instagram-widget
                    </a>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Klicke auf "Create Free Widget" und registriere dich kostenlos</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Verbinde euren Instagram-Account (@oeh_wirtschaft_wipaed)</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <span>Wahle ein Layout (z.B. Grid mit 3 oder 6 Posts)</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
                  <span>Klicke auf "Embed" und kopiere die <strong>Widget-ID</strong> aus dem Code</span>
                </li>
              </ol>

              <div className="mt-4 p-4 bg-white/70 rounded-xl border border-pink-200">
                <p className="text-xs font-medium text-slate-600 mb-2">Beispiel Embed-Code:</p>
                <div className="bg-slate-800 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`<div class="embedsocial-hashtag" data-ref="a9db327...">
  <a class="feed-powered-by-es..." href="...">...</a>
</div>
<script>...</script>`}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Kopiere den gesamten Code und fuege ihn oben ein
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle size={14} className="text-green-500" />
                <span>100% kostenlos, kein Wasserzeichen, 2.000 Views/Monat inklusive</span>
              </div>
            </div>
          </div>
        </div>

        {embedSocialId && (
          <div className="bg-green-50 rounded-2xl border border-green-100 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="font-medium text-green-800">Widget konfiguriert!</p>
                <p className="text-sm text-green-600">ID: {embedSocialId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
