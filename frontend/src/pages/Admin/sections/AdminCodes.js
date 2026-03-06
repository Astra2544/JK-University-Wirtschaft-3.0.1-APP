/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN CODES SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung von Admin-Codes fuer LVA-Bewertungen ohne E-Mail.
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
  Key, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Info, Copy, Check, Pencil, X, Save
} from 'lucide-react';

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

// ─── EDIT MODAL COMPONENT ──────────────────────────────────────────────────
function EditCodeModal({ code, onClose, onSave }) {
  const [maxUses, setMaxUses] = useState(String(code.max_uses));
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [name, setName] = useState(code.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest(`/api/admin/codes/${code.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          max_uses: parseInt(maxUses) || code.max_uses,
          expires_in_days: parseInt(expiresInDays) || null,
          name: name.trim() || null
        })
      });
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Pencil className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Code bearbeiten</h3>
              <p className="text-sm text-slate-500 font-mono">{code.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name / Beschreibung
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Tutorium WS24"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Max Uses */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Maximale Verwendungen
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="5"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Aktuell: {code.use_count} verwendet</p>
          </div>

          {/* Extend validity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gültigkeit verlängern um (Tage)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="30"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">Ab heute + {expiresInDays || 0} Tage</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── MAIN ADMIN CODES COMPONENT ────────────────────────────────────────────
export default function AdminCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copiedCode, setCopiedCode] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  
  // Form state
  const [codeName, setCodeName] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresInDays, setExpiresInDays] = useState('30');

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/codes');
      setCodes(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Codes' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreateCode = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage({ type: '', text: '' });

    const uses = parseInt(maxUses) || 1;
    const days = parseInt(expiresInDays) || 30;

    try {
      const data = await apiRequest('/api/admin/codes', {
        method: 'POST',
        body: JSON.stringify({
          name: codeName.trim() || null,
          max_uses: Math.max(1, uses),
          expires_in_days: Math.max(1, days)
        })
      });
      
      setMessage({ type: 'success', text: `Code "${data.code}" erfolgreich erstellt!` });
      setCodeName('');
      setMaxUses('1');
      setExpiresInDays('30');
      fetchCodes();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCode = async (codeId) => {
    if (!window.confirm('Code wirklich löschen?')) return;
    
    try {
      await apiRequest(`/api/admin/codes/${codeId}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Code gelöscht' });
      fetchCodes();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEditSave = () => {
    setEditingCode(null);
    setMessage({ type: 'success', text: 'Code aktualisiert' });
    fetchCodes();
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div>
      {/* Edit Modal */}
      <AnimatePresence>
        {editingCode && (
          <EditCodeModal 
            code={editingCode} 
            onClose={() => setEditingCode(null)} 
            onSave={handleEditSave}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Bewertungs-Codes</h2>
        <button
          onClick={fetchCodes}
          disabled={loading}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Info className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 text-sm mb-1">Admin-Codes für LVA-Bewertungen</h3>
            <p className="text-blue-700 text-sm leading-relaxed">
              Erstelle spezielle Codes, die Benutzer direkt eingeben können – ohne E-Mail-Verifizierung.
              Du kannst festlegen, wie oft ein Code verwendet werden kann.
            </p>
          </div>
        </div>
      </div>

      {/* Create Code Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Plus className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Neuen Code erstellen</h3>
            <p className="text-sm text-slate-500">Code wird automatisch generiert</p>
          </div>
        </div>

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

        <form onSubmit={handleCreateCode} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name (optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name / Beschreibung <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                placeholder="z.B. Für Tutorium WS24"
                maxLength={100}
                data-testid="code-name-input"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Max Uses */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maximale Verwendungen
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1"
                data-testid="max-uses-input"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Expires in Days */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gültig für (Tage)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="30"
                data-testid="expires-days-input"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            data-testid="create-code-btn"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-xl transition-colors"
          >
            {creating ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
            {creating ? 'Erstellen...' : 'Code generieren'}
          </button>
        </form>
      </div>

      {/* Codes List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Key className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Vorhandene Codes</h3>
            <p className="text-sm text-slate-500">{codes.length} Code(s) erstellt</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Key size={48} className="mx-auto mb-4 opacity-30" />
            <p>Noch keine Codes erstellt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => (
              <motion.div
                key={code.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  code.is_active 
                    ? 'bg-white border-slate-200' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    code.is_active ? 'bg-green-100' : 'bg-slate-200'
                  }`}>
                    <Key className={code.is_active ? 'text-green-600' : 'text-slate-400'} size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-slate-900">{code.code}</span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Kopieren"
                      >
                        {copiedCode === code.code ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                    {code.name && (
                      <p className="text-sm text-slate-600 mt-0.5">{code.name}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className={`px-2 py-0.5 rounded-full ${
                        code.use_count >= code.max_uses 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {code.use_count} / {code.max_uses} verwendet
                      </span>
                      <span>Gültig bis {formatDate(code.expires_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingCode(code)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Bearbeiten"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteCode(code.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
