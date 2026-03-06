/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN REGISTRATIONS SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung von Event-Anmeldungen.
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
  Users, Check, X, Clock, Mail, GraduationCap, Calendar,
  RefreshCw, Search, Filter, ChevronDown, Eye, Trash2, AlertCircle
} from 'lucide-react';

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

const statusOptions = [
  { value: 'pending', label: 'Ausstehend', color: 'amber', icon: Clock },
  { value: 'approved', label: 'Bestätigt', color: 'green', icon: Check },
  { value: 'rejected', label: 'Abgelehnt', color: 'red', icon: X },
];

function RegistrationModal({ registration, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(registration?.admin_notes || '');

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await apiRequest(`/api/admin/registrations/${registration.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, admin_notes: notes }),
      });
      onUpdate();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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
          <h3 className="text-lg font-bold text-slate-900">Anmeldung Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-900 mb-2">{registration.event_title}</h4>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(registration.event_date)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase">Name</label>
              <p className="font-medium text-slate-900">{registration.name}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">E-Mail</label>
              <p className="font-medium text-slate-900 text-sm break-all">{registration.email}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Studiengang</label>
              <p className="font-medium text-slate-900">{registration.study_program || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase">Teilnahme</label>
              <p className="font-medium text-slate-900">
                {registration.participation_type === 'yes' ? 'Ja' : 'Vielleicht'}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase mb-1 block">Aktueller Status</label>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              registration.status === 'approved' ? 'bg-green-100 text-green-700' :
              registration.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {statusOptions.find(s => s.value === registration.status)?.label || registration.status}
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase mb-1 block">Angemeldet am</label>
            <p className="text-sm text-slate-600">{formatDate(registration.created_at)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              placeholder="Interne Notizen..."
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-100">
            {registration.status !== 'approved' && (
              <button
                onClick={() => handleStatusChange('approved')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <Check size={16} /> Bestätigen
              </button>
            )}
            {registration.status !== 'rejected' && (
              <button
                onClick={() => handleStatusChange('rejected')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <X size={16} /> Ablehnen
              </button>
            )}
            {registration.status !== 'pending' && (
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <Clock size={16} /> Ausstehend
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regs, statsData] = await Promise.all([
        apiRequest(`/api/admin/registrations${statusFilter ? `?status=${statusFilter}` : ''}`),
        apiRequest('/api/admin/registrations/stats'),
      ]);
      setRegistrations(regs);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Anmeldung wirklich löschen?')) return;
    try {
      await apiRequest(`/api/admin/registrations/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickApprove = async (registration) => {
    try {
      await apiRequest(`/api/admin/registrations/${registration.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickReject = async (registration) => {
    try {
      await apiRequest(`/api/admin/registrations/${registration.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected' }),
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredRegistrations = registrations.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.event_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Event-Anmeldungen</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Verwalte Anmeldungen für Events</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium shrink-0"
        >
          <RefreshCw size={16} /> Aktualisieren
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Users size={16} className="text-slate-600 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">Gesamt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock size={16} className="text-amber-600 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">Ausstehend</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Check size={16} className="text-green-600 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">Bestätigt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <X size={16} className="text-red-600 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">Abgelehnt</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-colors w-full sm:w-auto justify-center ${
              statusFilter ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} />
            {statusFilter ? statusOptions.find(s => s.value === statusFilter)?.label : 'Filter'}
            <ChevronDown size={12} />
          </button>
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-2 min-w-[160px]">
              <button
                onClick={() => { setStatusFilter(''); setShowFilters(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${!statusFilter ? 'font-medium text-blue-600' : ''}`}
              >
                Alle anzeigen
              </button>
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setShowFilters(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${statusFilter === opt.value ? 'font-medium text-blue-600' : ''}`}
                >
                  <opt.icon size={14} /> {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl">
          <Users size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Keine Anmeldungen gefunden</p>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredRegistrations.map(registration => (
            <div
              key={registration.id}
              className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-2 sm:gap-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                  registration.status === 'approved' ? 'bg-green-100' :
                  registration.status === 'rejected' ? 'bg-red-100' :
                  'bg-amber-100'
                }`}>
                  {registration.status === 'approved' ? <Check size={16} className="text-green-600 sm:w-5 sm:h-5" /> :
                   registration.status === 'rejected' ? <X size={16} className="text-red-600 sm:w-5 sm:h-5" /> :
                   <Clock size={16} className="text-amber-600 sm:w-5 sm:h-5" />}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{registration.name}</h4>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                      registration.status === 'approved' ? 'bg-green-100 text-green-700' :
                      registration.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {statusOptions.find(s => s.value === registration.status)?.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                      <Mail size={12} className="shrink-0 sm:w-3.5 sm:h-3.5" />
                      <span className="truncate">{registration.email}</span>
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[100px] sm:max-w-none">
                      <Calendar size={12} className="shrink-0 sm:w-3.5 sm:h-3.5" />
                      <span className="truncate">{registration.event_title}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  {registration.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleQuickApprove(registration)}
                        className="p-1.5 sm:p-2 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded-lg transition-colors"
                        title="Bestätigen"
                      >
                        <Check size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleQuickReject(registration)}
                        className="p-1.5 sm:p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Ablehnen"
                      >
                        <X size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedRegistration(registration)}
                    className="p-1.5 sm:p-2 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                    title="Details"
                  >
                    <Eye size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(registration.id)}
                    className="p-1.5 sm:p-2 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedRegistration && (
          <RegistrationModal
            registration={selectedRegistration}
            onClose={() => setSelectedRegistration(null)}
            onUpdate={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
