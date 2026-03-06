/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN VERWALTUNG SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung von Admins, Rollen und Berechtigungen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, X, RefreshCw, Users, Eye, Pencil, Check, AlertCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const ROLE_COLORS = [
  { id: 'blue', label: 'Blau', class: 'bg-blue-500' },
  { id: 'green', label: 'Grün', class: 'bg-green-500' },
  { id: 'gold', label: 'Gold', class: 'bg-amber-500' },
  { id: 'red', label: 'Rot', class: 'bg-red-500' },
  { id: 'purple', label: 'Lila', class: 'bg-purple-500' },
  { id: 'teal', label: 'Türkis', class: 'bg-teal-500' },
  { id: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { id: 'slate', label: 'Grau', class: 'bg-slate-500' },
];

export const PERMISSION_SECTIONS = [
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'events', label: 'Kalender', icon: '📅' },
  { id: 'sgu', label: 'SGU', icon: '🎓' },
  { id: 'lva', label: 'LVA', icon: '📚' },
  { id: 'kanban', label: 'Kanban', icon: '📋' },
  { id: 'misc', label: 'Umfrage & Sonstiges', icon: '⚙️' },
  { id: 'partners', label: 'Partner', icon: '🤝' },
  { id: 'sites', label: 'Sites', icon: '🌐' },
  { id: 'email', label: 'E-Mail', icon: '📧' },
  { id: 'users', label: 'Benutzer', icon: '👤' },
];

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

function getColorClass(colorId) {
  const color = ROLE_COLORS.find(c => c.id === colorId);
  return color ? color.class : 'bg-blue-500';
}

function RoleModal({ role, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    display_name: role?.display_name || '',
    description: role?.description || '',
    color: role?.color || 'blue',
    permissions: role?.permissions || PERMISSION_SECTIONS.reduce((acc, s) => {
      acc[s.id] = { view: false, edit: false };
      return acc;
    }, {}),
  });

  const handlePermissionChange = (sectionId, action, value) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [sectionId]: {
          ...prev.permissions[sectionId],
          [action]: value,
          ...(action === 'edit' && value ? { view: true } : {}),
          ...(action === 'view' && !value ? { edit: false } : {}),
        }
      }
    }));
  };

  const setAllPermissions = (action, value) => {
    const newPerms = {};
    PERMISSION_SECTIONS.forEach(s => {
      newPerms[s.id] = {
        view: action === 'view' ? value : (value ? true : form.permissions[s.id]?.view || false),
        edit: action === 'edit' ? value : form.permissions[s.id]?.edit || false,
      };
    });
    setForm(prev => ({ ...prev, permissions: newPerms }));
  };

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
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-slate-900">
            {role ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Anzeigename *
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="z.B. Content Manager"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Technischer Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="z.B. content_manager"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={role?.is_system}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Beschreibung
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Kurze Beschreibung der Rolle"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Farbe
              </label>
              <div className="flex gap-2">
                {ROLE_COLORS.map(color => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setForm({ ...form, color: color.id })}
                    className={`w-8 h-8 rounded-full ${color.class} ${
                      form.color === color.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Berechtigungen
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAllPermissions('view', true)}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                  >
                    Alle sehen
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllPermissions('edit', true)}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                  >
                    Alle bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllPermissions('view', false)}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr,80px,80px] bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-medium text-slate-500">
                  <span>Bereich</span>
                  <span className="text-center">Sehen</span>
                  <span className="text-center">Bearbeiten</span>
                </div>
                {PERMISSION_SECTIONS.map((section, i) => (
                  <div
                    key={section.id}
                    className={`grid grid-cols-[1fr,80px,80px] px-4 py-3 items-center ${
                      i < PERMISSION_SECTIONS.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <span className="text-sm text-slate-700 flex items-center gap-2">
                      <span>{section.icon}</span>
                      {section.label}
                    </span>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(section.id, 'view', !form.permissions[section.id]?.view)}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          form.permissions[section.id]?.view
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                        }`}
                      >
                        {form.permissions[section.id]?.view && <Check size={14} />}
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handlePermissionChange(section.id, 'edit', !form.permissions[section.id]?.edit)}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          form.permissions[section.id]?.edit
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                        }`}
                      >
                        {form.permissions[section.id]?.edit && <Check size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-4 flex gap-3 shrink-0 bg-white">
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
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-xl flex items-center justify-center gap-2"
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

export default function AdminVerwaltung() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/roles');
      setRoles(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSave = async (form) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editing) {
        await apiRequest(`/api/roles/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        setMessage({ type: 'success', text: 'Rolle aktualisiert' });
      } else {
        await apiRequest('/api/roles', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setMessage({ type: 'success', text: 'Rolle erstellt' });
      }
      setShowModal(false);
      setEditing(null);
      fetchRoles();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDelete = async (role) => {
    if (role.is_system) {
      setMessage({ type: 'error', text: 'System-Rollen können nicht gelöscht werden' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    if (role.user_count > 0) {
      setMessage({ type: 'error', text: `Rolle wird noch von ${role.user_count} Benutzer(n) verwendet` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    if (!window.confirm(`Rolle "${role.display_name}" wirklich löschen?`)) return;

    try {
      await apiRequest(`/api/roles/${role.id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Rolle gelöscht' });
      fetchRoles();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Verwaltung</h2>
          <p className="text-sm text-slate-500 mt-1">Rollen erstellen und Berechtigungen verwalten</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Neue Rolle
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl mb-4 text-sm flex items-center gap-2 ${
          message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-1">Rollenverwaltung</p>
            <ul className="list-disc list-inside space-y-1 text-amber-600">
              <li>Erstelle benutzerdefinierte Rollen mit individuellen Berechtigungen</li>
              <li>System-Rollen (Administrator, Redakteur, Moderator) können nicht gelöscht werden</li>
              <li>"Sehen" erlaubt das Anzeigen eines Bereichs im Menu</li>
              <li>"Bearbeiten" erlaubt das Ändern von Inhalten</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full ${getColorClass(role.color)} flex items-center justify-center text-white`}>
                <Shield size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">{role.display_name}</h4>
                  {role.is_system && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 flex items-center gap-1">
                      <Lock size={10} /> System
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {role.description || 'Keine Beschreibung'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Users size={14} />
                    <span className="text-sm font-medium">{role.user_count}</span>
                  </div>
                  <span className="text-xs text-slate-400">Benutzer</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(role); setShowModal(true); }}
                    className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    disabled={role.is_system}
                    className={`p-2 rounded-lg transition-colors ${
                      role.is_system
                        ? 'text-slate-200 cursor-not-allowed'
                        : 'hover:bg-red-100 text-slate-400 hover:text-red-600'
                    }`}
                    title={role.is_system ? 'System-Rolle' : 'Löschen'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                {PERMISSION_SECTIONS.map(section => {
                  const perms = role.permissions?.[section.id];
                  const hasView = perms?.view;
                  const hasEdit = perms?.edit;

                  if (!hasView && !hasEdit) return null;

                  return (
                    <div
                      key={section.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        hasEdit
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span>{section.icon}</span>
                      <span>{section.label}</span>
                      {hasEdit ? (
                        <Pencil size={10} />
                      ) : (
                        <Eye size={10} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <RoleModal
            role={editing}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditing(null); }}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
