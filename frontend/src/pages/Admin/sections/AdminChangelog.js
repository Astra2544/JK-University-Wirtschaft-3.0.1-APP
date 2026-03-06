/**
 * Admin Changelog Section | OeH Wirtschaft Admin Panel
 * Developer History mit Website- und App-Versionen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Plus, Edit2, Trash2, Save, X, RefreshCw,
  Calendar, Tag, FileText, Check, AlertCircle, Sparkles,
  Globe, Smartphone
} from 'lucide-react';
import SectionNotificationBanner from '../components/SectionNotificationBanner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${endpoint}`, {
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

function ChangelogModal({ entry, onSave, onClose, loading, type }) {
  const [form, setForm] = useState({
    version: entry?.version || '',
    title: entry?.title || '',
    description: entry?.description || '',
    changes: entry?.changes || [],
    changelog_type: entry?.changelog_type || type || 'website',
    release_date: entry?.release_date
      ? new Date(entry.release_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  });
  const [changeInput, setChangeInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      release_date: new Date(form.release_date).toISOString()
    });
  };

  const addChange = () => {
    if (!changeInput.trim()) return;
    setForm({ ...form, changes: [...form.changes, changeInput.trim()] });
    setChangeInput('');
  };

  const removeChange = (idx) => {
    setForm({ ...form, changes: form.changes.filter((_, i) => i !== idx) });
  };

  const typeLabel = form.changelog_type === 'app' ? 'App' : 'Website';
  const TypeIcon = form.changelog_type === 'app' ? Smartphone : Globe;

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
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${form.changelog_type === 'app' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
              <TypeIcon size={20} className={form.changelog_type === 'app' ? 'text-emerald-600' : 'text-blue-600'} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {entry ? `${typeLabel}-Version bearbeiten` : `Neue ${typeLabel}-Version`}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Version *
              </label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="z.B. 2.1.0"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Datum *
              </label>
              <input
                type="datetime-local"
                value={form.release_date}
                onChange={(e) => setForm({ ...form, release_date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="z.B. Neue Funktionen und Verbesserungen"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Beschreibung
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optionale Zusammenfassung des Updates..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Aenderungen
            </label>
            {form.changes.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.changes.map((change, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      form.changelog_type === 'app' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-700">{change}</span>
                    <button
                      type="button"
                      onClick={() => removeChange(idx)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={changeInput}
                onChange={(e) => setChangeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChange())}
                placeholder="z.B. Survey Banner verbessert"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={addChange}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 text-white font-medium rounded-xl flex items-center justify-center gap-2 ${
                form.changelog_type === 'app'
                  ? 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300'
                  : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300'
              }`}
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

function VersionCard({ entry, idx, isLatest, onEdit, onDelete, isMaster, type }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isApp = type === 'app';
  const accentColor = isApp ? 'emerald' : 'blue';
  const gradientFrom = isApp ? 'from-emerald-500' : 'from-blue-500';
  const gradientTo = isApp ? 'to-teal-500' : 'to-cyan-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLatest ? `bg-gradient-to-br ${gradientFrom} ${gradientTo}` : 'bg-slate-100'
            }`}>
              {isLatest ? (
                <Sparkles className="text-white" size={18} />
              ) : (
                <Tag className="text-slate-400" size={18} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">v{entry.version}</span>
                {isLatest && (
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                    isApp ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    Aktuell
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{entry.title}</p>
            </div>
          </div>
          {isMaster && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(entry)}
                className={`p-1.5 hover:bg-${accentColor}-100 text-slate-400 hover:text-${accentColor}-600 rounded-lg transition-colors`}
                title="Bearbeiten"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                title="Loeschen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
          <Calendar size={11} />
          {formatDate(entry.release_date)}
        </p>

        {entry.description && (
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">{entry.description}</p>
        )}

        {entry.changes && entry.changes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <ul className="space-y-1">
              {entry.changes.slice(0, 3).map((change, cIdx) => (
                <li key={cIdx} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${
                    isApp ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                  <span className="line-clamp-1">{change}</span>
                </li>
              ))}
              {entry.changes.length > 3 && (
                <li className="text-xs text-slate-400 pl-2.5">
                  +{entry.changes.length - 3} weitere...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function VersionColumn({ title, icon: Icon, entries, type, isMaster, onAdd, onEdit, onDelete, loading, accentColor }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${accentColor === 'emerald' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
            <Icon size={20} className={accentColor === 'emerald' ? 'text-emerald-600' : 'text-blue-600'} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{entries.length} Versionen</p>
          </div>
        </div>
        {isMaster && (
          <button
            onClick={onAdd}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors ${
              accentColor === 'emerald'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <Plus size={14} /> Neu
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-slate-50 rounded-xl">
          <RefreshCw size={20} className={`animate-spin ${accentColor === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Icon size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 mb-3">Keine Versionen</p>
          {isMaster && (
            <button
              onClick={onAdd}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-sm font-medium ${
                accentColor === 'emerald'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Plus size={14} /> Erste Version
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {entries.map((entry, idx) => (
            <VersionCard
              key={entry.id}
              entry={entry}
              idx={idx}
              isLatest={idx === 0}
              onEdit={onEdit}
              onDelete={onDelete}
              isMaster={isMaster}
              type={type}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminChangelog({ isMaster = false }) {
  const [websiteEntries, setWebsiteEntries] = useState([]);
  const [appEntries, setAppEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('website');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const [websiteData, appData] = await Promise.all([
        apiRequest('/api/admin/changelog?changelog_type=website'),
        apiRequest('/api/admin/changelog?changelog_type=app')
      ]);
      setWebsiteEntries(websiteData);
      setAppEntries(appData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const openModal = (type, entry = null) => {
    setModalType(type);
    setEditing(entry);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editing) {
        await apiRequest(`/api/admin/changelog/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        setMessage({ type: 'success', text: 'Version aktualisiert' });
      } else {
        await apiRequest('/api/admin/changelog', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setMessage({ type: 'success', text: 'Version hinzugefuegt' });
      }
      setShowModal(false);
      setEditing(null);
      fetchEntries();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Version wirklich loeschen?')) return;
    try {
      await apiRequest(`/api/admin/changelog/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Version geloescht' });
      fetchEntries();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div>
      <SectionNotificationBanner section="changelog" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <History className="text-blue-500" size={28} />
            Developer History
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Versionshistorie der Website und App
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl mb-4 text-sm flex items-center gap-2 ${
          message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {message.text}
        </div>
      )}

      {!isMaster && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle size={16} />
            <span>Nur der Master Admin kann Versionen hinzufuegen oder bearbeiten.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VersionColumn
          title="Website Version History"
          icon={Globe}
          entries={websiteEntries}
          type="website"
          isMaster={isMaster}
          onAdd={() => openModal('website')}
          onEdit={(entry) => openModal('website', entry)}
          onDelete={handleDelete}
          loading={loading}
          accentColor="blue"
        />

        <VersionColumn
          title="App Version History"
          icon={Smartphone}
          entries={appEntries}
          type="app"
          isMaster={isMaster}
          onAdd={() => openModal('app')}
          onEdit={(entry) => openModal('app', entry)}
          onDelete={handleDelete}
          loading={loading}
          accentColor="emerald"
        />
      </div>

      <AnimatePresence>
        {showModal && (
          <ChangelogModal
            entry={editing}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditing(null); }}
            loading={saving}
            type={modalType}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
