/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN LVA SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung von Lehrveranstaltungen und deren Bewertungen.
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
  BookOpen, Plus, Edit2, Trash2, Save, X, RefreshCw, Search,
  Eye, EyeOff, Upload, Check, AlertCircle
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

// ─── LVA EDITOR MODAL ──────────────────────────────────────────────────────
function LVAEditorModal({ lva, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name: lva?.name || '',
    description: lva?.description || '',
    is_active: lva?.is_active ?? true,
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
        className="bg-white rounded-2xl w-full max-w-lg"
      >
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {lva ? 'LVA bearbeiten' : 'Neue LVA erstellen'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. KS Buchhaltung nach UGB"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Beschreibung (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Zusätzliche Informationen zur LVA..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Aktiv (sichtbar für Studierende)</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Speichern
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN ADMIN LVA COMPONENT ──────────────────────────────────────────────
export default function AdminLVA() {
  const [lvas, setLvas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchLvas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/lvas');
      setLvas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLvas();
  }, [fetchLvas]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/api/admin/lvas/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiRequest('/api/admin/lvas', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowEditor(false);
      setEditing(null);
      fetchLvas();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`LVA "${name}" wirklich löschen? Alle Bewertungen werden ebenfalls gelöscht!`)) return;
    try {
      await apiRequest(`/api/admin/lvas/${id}`, { method: 'DELETE' });
      fetchLvas();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (lva) => {
    try {
      await apiRequest(`/api/admin/lvas/${lva.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !lva.is_active })
      });
      fetchLvas();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImport = async () => {
    if (!window.confirm('Sollen alle LVAs aus der Vorlage importiert werden? Bereits existierende werden übersprungen.')) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await apiRequest('/api/admin/lvas/import', { method: 'POST' });
      setImportResult(result);
      fetchLvas();
    } catch (err) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  };

  // Filter LVAs by search
  const filteredLvas = lvas.filter(lva => 
    lva.name.toLowerCase().includes(search.toLowerCase())
  );

  // Color mapping for ratings
  const colorMap = {
    green: 'text-green-600',
    lime: 'text-lime-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  };

  return (
    <div className="min-w-0">
      <SectionNotificationBanner section="lva" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">LVA-Verwaltung</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleImport}
            disabled={importing}
            data-testid="import-lvas-btn"
            className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            <span className="hidden xs:inline">LVAs</span> Import
          </button>
          <button
            onClick={() => { setEditing(null); setShowEditor(true); }}
            data-testid="create-lva-btn"
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <Plus size={14} /> Neue LVA
          </button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
        >
          <Check className="text-green-500" size={20} />
          <p className="text-green-700 text-sm">
            {importResult.imported} LVAs importiert, {importResult.skipped} übersprungen
          </p>
          <button onClick={() => setImportResult(null)} className="ml-auto text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="LVA suchen..."
          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 sm:p-4">
          <p className="text-blue-600 text-xs sm:text-sm font-medium">Gesamt</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-700">{lvas.length}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-2 sm:p-4">
          <p className="text-green-600 text-xs sm:text-sm font-medium">Aktiv</p>
          <p className="text-lg sm:text-2xl font-bold text-green-700">{lvas.filter(l => l.is_active).length}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-4">
          <p className="text-slate-600 text-xs sm:text-sm font-medium">Inaktiv</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-700">{lvas.filter(l => !l.is_active).length}</p>
        </div>
      </div>

      {/* LVA List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : filteredLvas.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">
            {search ? 'Keine LVAs gefunden' : 'Noch keine LVAs vorhanden'}
          </p>
          {!search && (
            <p className="text-slate-400 text-sm mt-2">
              Klicke auf "LVAs importieren" um die Standardliste zu laden
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredLvas.map(lva => (
            <motion.div
              key={lva.id}
              layout
              className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
                lva.is_active ? 'border-slate-200' : 'border-slate-200 bg-slate-50 opacity-60'
              }`}
            >
              {/* Status Indicator */}
              <div className={`w-2 h-12 rounded-full ${lva.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">{lva.name}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className={lva.is_active ? 'text-green-600' : 'text-slate-500'}>
                    {lva.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <span>•</span>
                  <span>{lva.rating_count} Bewertung{lva.rating_count !== 1 ? 'en' : ''}</span>
                  {lva.total_text && (
                    <>
                      <span>•</span>
                      <span className={colorMap[lva.total_color] || ''}>
                        {lva.total_text}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(lva)}
                  className={`p-2 rounded-lg transition-colors ${
                    lva.is_active 
                      ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' 
                      : 'hover:bg-green-100 text-slate-400 hover:text-green-600'
                  }`}
                  title={lva.is_active ? 'Deaktivieren' : 'Aktivieren'}
                >
                  {lva.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => { setEditing(lva); setShowEditor(true); }}
                  className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg"
                  title="Bearbeiten"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(lva.id, lva.name)}
                  className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg"
                  title="Löschen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <LVAEditorModal
            lva={editing}
            onSave={handleSave}
            onClose={() => { setShowEditor(false); setEditing(null); }}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
