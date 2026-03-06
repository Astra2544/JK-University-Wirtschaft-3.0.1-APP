/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN SITES SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung der Navigation und Seitenvisibilitaet.
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
  Globe, Eye, EyeOff, Save, RefreshCw, GripVertical, MessageCircle, Check
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NAV_LABELS = {
  home: 'Startseite',
  news: 'News',
  kalender: 'Kalender',
  team: 'Team',
  studium: 'Studium',
  lva: 'LVA-Bewertungen',
  studienplaner: 'Studienplaner',
  magazine: 'Ceteris Paribus',
};

function SortableNavItem({ item, onToggleVisibility }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className={`p-4 pl-12 rounded-xl border bg-white flex items-center justify-between transition-all ${
          item.visible ? 'border-slate-200' : 'border-slate-100 opacity-60'
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500"
        >
          <GripVertical size={18} />
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${item.visible ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <div>
            <p className="font-medium text-slate-900">{NAV_LABELS[item.key] || item.key}</p>
            <p className="text-xs text-slate-400">{item.path}</p>
          </div>
        </div>
        <button
          onClick={() => onToggleVisibility(item.key)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            item.visible
              ? 'hover:bg-slate-100 text-emerald-500'
              : 'hover:bg-emerald-50 text-slate-300 hover:text-emerald-500'
          }`}
          title={item.visible ? 'Ausblenden' : 'Einblenden'}
        >
          {item.visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminSites() {
  const [navItems, setNavItems] = useState([]);
  const [oehliEnabled, setOehliEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/site-settings`);
      const data = await res.json();
      const sorted = [...data.nav_items].sort((a, b) => a.order - b.order);
      setNavItems(sorted);
      setOehliEnabled(data.oehli_enabled);
      setHasChanges(false);
    } catch (err) {
      setError('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = navItems.findIndex(item => item.key === active.id);
    const newIndex = navItems.findIndex(item => item.key === over.id);
    const newOrder = arrayMove(navItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      order: idx
    }));
    setNavItems(newOrder);
    setHasChanges(true);
  };

  const toggleVisibility = (key) => {
    setNavItems(prev => prev.map(item =>
      item.key === key ? { ...item, visible: !item.visible } : item
    ));
    setHasChanges(true);
  };

  const toggleOehli = () => {
    setOehliEnabled(prev => !prev);
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nav_items: navItems,
          oehli_enabled: oehliEnabled,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Fehler beim Speichern');
      }

      showSuccess('Einstellungen gespeichert!');
      setHasChanges(false);
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe size={24} className="text-blue-500" />
            Website-Einstellungen
          </h2>
          <p className="text-sm text-slate-500">Verwalte Navigation und Features</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Aktualisieren
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            data-testid="save-site-settings-btn"
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
              hasChanges
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Speichern
          </button>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2"
          >
            <Check size={16} /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Navigation</h3>
            <p className="text-sm text-slate-500 mb-4">
              Ziehe die Punkte um die Reihenfolge zu ändern. Klicke auf das Auge um Seiten ein- oder auszublenden.
            </p>
            <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
              <GripVertical size={12} /> Drag & Drop um Reihenfolge zu ändern
            </p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={navItems.map(item => item.key)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {navItems.map(item => (
                    <SortableNavItem
                      key={item.key}
                      item={item}
                      onToggleVisibility={toggleVisibility}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Features</h3>
            <p className="text-sm text-slate-500 mb-4">
              Aktiviere oder deaktiviere Website-Features.
            </p>

            <div
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                oehliEnabled
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
              onClick={toggleOehli}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    oehliEnabled ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">OEHli Assistent</p>
                    <p className="text-sm text-slate-500">Virtueller Chat-Assistent für Studierende</p>
                  </div>
                </div>
                <div
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${
                    oehliEnabled ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                      oehliEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
              <p className={`mt-3 text-xs ${oehliEnabled ? 'text-blue-600' : 'text-slate-400'}`}>
                {oehliEnabled
                  ? 'Der OEHli Assistent ist für alle Besucher sichtbar'
                  : 'Der OEHli Assistent ist für alle Besucher ausgeblendet'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
