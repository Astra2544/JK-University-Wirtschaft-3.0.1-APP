/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN PARTNERS SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung von Partnern und Sponsoren.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, Plus, Edit2, Trash2, Save, X, RefreshCw, ExternalLink, GripVertical, Eye, EyeOff, AlertCircle, Upload, Users, Heart } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

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

async function uploadLogo(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/api/admin/partners/upload-logo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '/login';
    throw new Error('Session abgelaufen');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Upload fehlgeschlagen');
  return data;
}

function PartnerModal({ partner, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name: partner?.name || '',
    logo_url: partner?.logo_url || '',
    website_url: partner?.website_url || '',
    partner_type: partner?.partner_type || 'partner',
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Nur PNG, JPG, WebP oder SVG Dateien erlaubt');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Logo darf maximal 2 MB groß sein');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const result = await uploadLogo(file);
      setForm({ ...form, logo_url: result.logo_url });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
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
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {partner ? 'Partner/Sponsor bearbeiten' : 'Neuen Partner/Sponsor hinzufügen'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Typ *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, partner_type: 'partner' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.partner_type === 'partner'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Users size={24} className={form.partner_type === 'partner' ? 'text-blue-500' : 'text-slate-400'} />
                <p className="font-medium text-slate-900 mt-2">Partner</p>
                <p className="text-xs text-slate-500">Kooperationspartner</p>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, partner_type: 'sponsor' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.partner_type === 'sponsor'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Heart size={24} className={form.partner_type === 'sponsor' ? 'text-amber-500' : 'text-slate-400'} />
                <p className="font-medium text-slate-900 mt-2">Sponsor</p>
                <p className="text-xs text-slate-500">Finanzielle Unterstützer</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Firmenname *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. KPMG, Deloitte, ..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo *
            </label>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : form.logo_url
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {uploading ? (
                <div className="py-4">
                  <RefreshCw size={32} className="mx-auto mb-2 text-blue-500 animate-spin" />
                  <p className="text-sm text-slate-500">Logo wird hochgeladen...</p>
                </div>
              ) : form.logo_url ? (
                <div className="py-2">
                  <div className="bg-white rounded-lg p-3 border border-slate-200 inline-block mb-3">
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-green-600 font-medium">Logo hochgeladen</p>
                  <p className="text-xs text-slate-400 mt-1">Klicken oder ziehen um zu ersetzen</p>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Upload size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Logo per Drag & Drop hochladen
                  </p>
                  <p className="text-xs text-slate-400">
                    oder klicken zum Auswählen
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    PNG, JPG, WebP oder SVG (max. 2 MB)
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle size={14} /> {uploadError}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">oder URL eingeben</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <input
              type="url"
              value={form.logo_url.startsWith('data:') ? '' : form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Website URL *
            </label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://www.example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              disabled={loading || !form.logo_url}
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

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/partners');
      setPartners(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Laden fehlgeschlagen' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleSave = async (form) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (editing) {
        await apiRequest(`/api/admin/partners/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        setMessage({ type: 'success', text: 'Partner/Sponsor aktualisiert' });
      } else {
        await apiRequest('/api/admin/partners', {
          method: 'POST',
          body: JSON.stringify({ ...form, sort_order: partners.length }),
        });
        setMessage({ type: 'success', text: 'Partner/Sponsor hinzugefügt' });
      }
      setShowModal(false);
      setEditing(null);
      fetchPartners();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Partner/Sponsor wirklich löschen?')) return;
    try {
      await apiRequest(`/api/admin/partners/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Partner/Sponsor gelöscht' });
      fetchPartners();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const toggleActive = async (partner) => {
    try {
      await apiRequest(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !partner.is_active }),
      });
      fetchPartners();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleReorder = async (newOrder) => {
    setPartners(newOrder);
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].sort_order !== i) {
        try {
          await apiRequest(`/api/admin/partners/${newOrder[i].id}`, {
            method: 'PUT',
            body: JSON.stringify({ sort_order: i }),
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const partnersList = partners.filter(p => p.partner_type === 'partner' || !p.partner_type);
  const sponsorsList = partners.filter(p => p.partner_type === 'sponsor');

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
          <h2 className="text-2xl font-bold text-slate-900">Partner / Sponsoren</h2>
          <p className="text-sm text-slate-500 mt-1">Maximal 8 pro Kategorie, werden auf der Startseite als Banner angezeigt</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Hinzufügen
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

      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Building2 className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">So funktioniert's:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Logo per Drag & Drop hochladen (PNG mit transparentem Hintergrund empfohlen)</li>
              <li>Partner und Sponsoren werden als separate Banner auf der Startseite angezeigt</li>
              <li>Bei Hover stoppt die Animation und das Logo ist klickbar</li>
              <li>Die Reihenfolge kann per Drag & Drop geändert werden</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-900">Partner</h3>
            <span className="text-sm text-slate-400">({partnersList.length}/8)</span>
          </div>

          {partnersList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <Users size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Noch keine Partner vorhanden</p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={partnersList}
              onReorder={(newOrder) => handleReorder([...newOrder, ...sponsorsList])}
              className="space-y-3"
            >
              {partnersList.map((partner) => (
                <Reorder.Item
                  key={partner.id}
                  value={partner}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical size={20} className="text-slate-300 shrink-0" />

                  <div className="w-24 h-12 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain p-1"
                      onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/></svg>'; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 truncate">{partner.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        partner.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {partner.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {partner.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(partner); }}
                      className={`p-2 rounded-lg transition-colors ${
                        partner.is_active
                          ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                          : 'hover:bg-green-100 text-slate-400 hover:text-green-600'
                      }`}
                      title={partner.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {partner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(partner); setShowModal(true); }}
                      className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(partner.id); }}
                      className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart size={20} className="text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-900">Sponsoren</h3>
            <span className="text-sm text-slate-400">({sponsorsList.length}/8)</span>
          </div>

          {sponsorsList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <Heart size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Noch keine Sponsoren vorhanden</p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={sponsorsList}
              onReorder={(newOrder) => handleReorder([...partnersList, ...newOrder])}
              className="space-y-3"
            >
              {sponsorsList.map((sponsor) => (
                <Reorder.Item
                  key={sponsor.id}
                  value={sponsor}
                  className="bg-white rounded-xl border border-amber-200 p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing"
                >
                  <GripVertical size={20} className="text-slate-300 shrink-0" />

                  <div className="w-24 h-12 bg-amber-50 rounded-lg flex items-center justify-center overflow-hidden border border-amber-100">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="max-h-full max-w-full object-contain p-1"
                      onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/></svg>'; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 truncate">{sponsor.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        sponsor.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sponsor.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sponsor.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(sponsor); }}
                      className={`p-2 rounded-lg transition-colors ${
                        sponsor.is_active
                          ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                          : 'hover:bg-green-100 text-slate-400 hover:text-green-600'
                      }`}
                      title={sponsor.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {sponsor.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(sponsor); setShowModal(true); }}
                      className="p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(sponsor.id); }}
                      className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <PartnerModal
            partner={editing}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditing(null); }}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
