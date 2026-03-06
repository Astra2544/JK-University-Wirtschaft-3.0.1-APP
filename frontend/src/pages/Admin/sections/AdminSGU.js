/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN SGU SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung von Studiengang-Updates (SGU) mit Drag & Drop.
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
  GraduationCap, Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  X, Save, Search, BookOpen, FileText, Eye, EyeOff, RefreshCw,
  Layers, FolderOpen, GripVertical
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

// Tab-Navigation
const TABS = [
  { id: 'updates', label: 'Updates', icon: FileText },
  { id: 'programs', label: 'Studiengänge', icon: GraduationCap },
  { id: 'categories', label: 'Kategorien', icon: Layers },
];

const colorOptions = [
  { value: 'blue', class: 'bg-blue-500' },
  { value: 'gold', class: 'bg-amber-500' },
  { value: 'green', class: 'bg-emerald-500' },
  { value: 'purple', class: 'bg-purple-500' },
];

export default function AdminSGU() {
  const [activeTab, setActiveTab] = useState('updates');
  const [categories, setCategories] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [catRes, progRes, updRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/study/categories`, { headers }),
        fetch(`${API_URL}/api/admin/study/programs`, { headers }),
        fetch(`${API_URL}/api/admin/study/updates`, { headers }),
      ]);
      
      setCategories(await catRes.json());
      setPrograms(await progRes.json());
      setUpdates(await updRes.json());
    } catch (err) {
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap size={24} className="text-blue-500" />
            Studiengang-Updates (SGU)
          </h2>
          <p className="text-sm text-slate-500">Verwalte Kategorien, Studiengänge und Updates</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Aktualisieren
        </button>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'updates' && (
            <UpdatesTab 
              updates={updates} 
              programs={programs}
              categories={categories}
              onRefresh={fetchAll}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          {activeTab === 'programs' && (
            <ProgramsTab 
              programs={programs} 
              categories={categories}
              onRefresh={fetchAll}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab 
              categories={categories}
              onRefresh={fetchAll}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SORTABLE ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 z-10"
      >
        <GripVertical size={16} />
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATES TAB
// ═══════════════════════════════════════════════════════════════════════════
function UpdatesTab({ updates, programs, categories, onRefresh, onSuccess, onError }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [localUpdates, setLocalUpdates] = useState(updates);
  const [formData, setFormData] = useState({
    program_id: '',
    content: '',
    semester: 'Wintersemester 2025/26',
    is_active: true,
  });

  useEffect(() => {
    setLocalUpdates(updates);
  }, [updates]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localUpdates.findIndex(u => u.id === active.id);
    const newIndex = localUpdates.findIndex(u => u.id === over.id);
    const newOrder = arrayMove(localUpdates, oldIndex, newIndex);
    setLocalUpdates(newOrder);

    // Update sort_order in DB
    try {
      const token = localStorage.getItem('token');
      await Promise.all(newOrder.map((item, index) => 
        fetch(`${API_URL}/api/admin/study/updates/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sort_order: index })
        })
      ));
      onSuccess('Reihenfolge gespeichert!');
    } catch (err) {
      onError('Fehler beim Speichern der Reihenfolge');
      onRefresh();
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      program_id: '',
      content: '',
      semester: 'Wintersemester 2025/26',
      is_active: true,
    });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      program_id: item.program_id,
      content: item.content,
      semester: item.semester || '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!editingItem;
      
      const res = await fetch(
        `${API_URL}/api/admin/study/updates${isEdit ? `/${editingItem.id}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...formData, sort_order: isEdit ? editingItem.sort_order : localUpdates.length })
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Fehler');
      }
      
      onSuccess(isEdit ? 'Update aktualisiert!' : 'Update erstellt!');
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Update wirklich löschen?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study/updates/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      onSuccess('Update gelöscht!');
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/admin/study/updates/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !item.is_active })
      });
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const filteredUpdates = localUpdates.filter(u => {
    const matchesSearch = u.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.program_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram = !filterProgram || u.program_id === parseInt(filterProgram);
    return matchesSearch && matchesProgram;
  });

  const groupedPrograms = categories.map(cat => ({
    ...cat,
    programs: programs.filter(p => p.category_id === cat.id)
  }));

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Updates durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <select
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">Alle Studiengänge</option>
          {groupedPrograms.map(cat => (
            <optgroup key={cat.id} label={cat.display_name}>
              {cat.programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="create-update-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          <Plus size={18} /> Neues Update
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{updates.length}</p>
          <p className="text-xs text-slate-500">Gesamt</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{updates.filter(u => u.is_active).length}</p>
          <p className="text-xs text-slate-500">Aktiv</p>
        </div>
        <div className="bg-slate-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-400">{updates.filter(u => !u.is_active).length}</p>
          <p className="text-xs text-slate-500">Inaktiv</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{programs.length}</p>
          <p className="text-xs text-slate-500">Studiengänge</p>
        </div>
      </div>

      {/* Drag & Drop Hint */}
      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
        <GripVertical size={12} /> Ziehe die Punkte um die Reihenfolge zu ändern
      </p>

      {/* List */}
      {filteredUpdates.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Keine Updates gefunden</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredUpdates.map(u => u.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredUpdates.map(item => (
                <SortableItem key={item.id} id={item.id}>
                  <div
                    data-testid={`update-item-${item.id}`}
                    className={`p-4 pl-10 rounded-xl border bg-white transition-all hover:shadow-md ${
                      item.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {item.program_name}
                          </span>
                          {item.category_name && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                              {item.category_name}
                            </span>
                          )}
                          {item.semester && (
                            <span className="text-xs text-slate-400">{item.semester}</span>
                          )}
                          {!item.is_active && (
                            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full flex items-center gap-1">
                              <EyeOff size={10} /> Inaktiv
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">{item.content}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleActive(item)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            item.is_active 
                              ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' 
                              : 'hover:bg-emerald-50 text-slate-300 hover:text-emerald-600'
                          }`}
                          title={item.is_active ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          {item.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal 
            title={editingItem ? 'Update bearbeiten' : 'Neues Update'}
            onClose={() => { setShowModal(false); resetForm(); }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Studiengang *</label>
                <select
                  required
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Bitte wählen...</option>
                  {groupedPrograms.map(cat => (
                    <optgroup key={cat.id} label={cat.display_name}>
                      {cat.programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Update-Text *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="z.B. Neue LV: KS Wissenschaftliches Arbeiten (3 ECTS)..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                <input
                  type="text"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="z.B. Wintersemester 2025/26"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-slate-700">Aktiv (auf Website sichtbar)</label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  data-testid="save-update-btn"
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Speichern
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAMS TAB
// ═══════════════════════════════════════════════════════════════════════════
function ProgramsTab({ programs, categories, onRefresh, onSuccess, onError }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [localPrograms, setLocalPrograms] = useState(programs);
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    short_name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    setLocalPrograms(programs);
  }, [programs]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event, categoryId) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categoryPrograms = localPrograms.filter(p => p.category_id === categoryId);
    const oldIndex = categoryPrograms.findIndex(p => p.id === active.id);
    const newIndex = categoryPrograms.findIndex(p => p.id === over.id);
    const newOrder = arrayMove(categoryPrograms, oldIndex, newIndex);
    
    // Update local state
    const otherPrograms = localPrograms.filter(p => p.category_id !== categoryId);
    setLocalPrograms([...otherPrograms, ...newOrder]);

    // Update sort_order in DB
    try {
      const token = localStorage.getItem('token');
      await Promise.all(newOrder.map((item, index) => 
        fetch(`${API_URL}/api/admin/study/programs/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sort_order: index })
        })
      ));
      onSuccess('Reihenfolge gespeichert!');
    } catch (err) {
      onError('Fehler beim Speichern');
      onRefresh();
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      category_id: '',
      name: '',
      short_name: '',
      description: '',
      is_active: true
    });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      category_id: item.category_id,
      name: item.name,
      short_name: item.short_name || '',
      description: item.description || '',
      is_active: item.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!editingItem;
      const categoryPrograms = localPrograms.filter(p => p.category_id === parseInt(formData.category_id));
      
      const res = await fetch(
        `${API_URL}/api/admin/study/programs${isEdit ? `/${editingItem.id}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...formData, sort_order: isEdit ? editingItem.sort_order : categoryPrograms.length })
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Fehler');
      }
      
      onSuccess(isEdit ? 'Studiengang aktualisiert!' : 'Studiengang erstellt!');
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Studiengang "${item.name}" wirklich löschen? Alle zugehörigen Updates werden ebenfalls gelöscht!`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study/programs/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      onSuccess('Studiengang gelöscht!');
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const groupedPrograms = categories.map(cat => ({
    ...cat,
    programs: localPrograms.filter(p => p.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order)
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <GripVertical size={12} /> Ziehe die Punkte um die Reihenfolge zu ändern
        </p>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="create-program-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600"
        >
          <Plus size={18} /> Neuer Studiengang
        </button>
      </div>

      {groupedPrograms.map(cat => (
        <div key={cat.id} className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FolderOpen size={16} /> {cat.display_name}
            <span className="text-slate-300">({cat.programs.length})</span>
          </h3>
          {cat.programs.length === 0 ? (
            <p className="text-sm text-slate-400 pl-6">Keine Studiengänge</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, cat.id)}>
              <SortableContext items={cat.programs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {cat.programs.map(item => (
                    <SortableItem key={item.id} id={item.id}>
                      <div className={`p-4 pl-10 rounded-xl border bg-white flex items-center justify-between ${
                        item.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'
                      }`}>
                        <div className="flex items-center gap-3">
                          <GraduationCap size={18} className="text-blue-500" />
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              {item.update_count} Updates
                              {!item.is_active && <span className="ml-2 text-slate-300">• Inaktiv</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      ))}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal 
            title={editingItem ? 'Studiengang bearbeiten' : 'Neuer Studiengang'}
            onClose={() => { setShowModal(false); resetForm(); }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Bitte wählen...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.display_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="z.B. BSc. Wirtschaftswissenschaften"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kurzname</label>
                <input
                  type="text"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="z.B. WiWi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="prog_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="prog_active" className="text-sm text-slate-700">Aktiv</label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  data-testid="save-program-btn"
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Speichern
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ═══════════════════════════════════════════════════════════════════════════
function CategoriesTab({ categories, onRefresh, onSuccess, onError }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [localCategories, setLocalCategories] = useState(categories);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    color: 'blue',
  });

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex(c => c.id === active.id);
    const newIndex = localCategories.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newOrder);

    // Update sort_order in DB
    try {
      const token = localStorage.getItem('token');
      await Promise.all(newOrder.map((item, index) => 
        fetch(`${API_URL}/api/admin/study/categories/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sort_order: index })
        })
      ));
      onSuccess('Reihenfolge gespeichert!');
    } catch (err) {
      onError('Fehler beim Speichern');
      onRefresh();
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      color: 'blue',
    });
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      display_name: item.display_name,
      description: item.description || '',
      color: item.color,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!editingItem;
      
      const res = await fetch(
        `${API_URL}/api/admin/study/categories${isEdit ? `/${editingItem.id}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...formData, sort_order: isEdit ? editingItem.sort_order : localCategories.length })
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Fehler');
      }
      
      onSuccess(isEdit ? 'Kategorie aktualisiert!' : 'Kategorie erstellt!');
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Kategorie "${item.display_name}" wirklich löschen? Alle zugehörigen Studiengänge und Updates werden ebenfalls gelöscht!`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/study/categories/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      onSuccess('Kategorie gelöscht!');
      onRefresh();
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <GripVertical size={12} /> Ziehe die Punkte um die Reihenfolge zu ändern
        </p>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="create-category-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600"
        >
          <Plus size={18} /> Neue Kategorie
        </button>
      </div>

      {localCategories.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Layers size={48} className="mx-auto mb-4 opacity-50" />
          <p>Keine Kategorien vorhanden</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {localCategories.map(item => (
                <SortableItem key={item.id} id={item.id}>
                  <div className="p-5 pl-10 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${colorOptions.find(c => c.value === item.color)?.class || 'bg-blue-500'}`} />
                      <div>
                        <p className="font-semibold text-slate-900">{item.display_name}</p>
                        <p className="text-sm text-slate-400">
                          {item.program_count} Studiengänge • Slug: {item.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal 
            title={editingItem ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            onClose={() => { setShowModal(false); resetForm(); }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anzeigename *</label>
                <input
                  type="text"
                  required
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="z.B. Bachelorstudiengänge"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">System-Name (Slug) *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="z.B. bachelor"
                />
                <p className="text-xs text-slate-400 mt-1">Nur Kleinbuchstaben, keine Leerzeichen</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Farbe</label>
                <div className="flex gap-2">
                  {colorOptions.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={`w-8 h-8 rounded-full ${c.class} transition-all ${
                        formData.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  data-testid="save-category-btn"
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Speichern
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function Modal({ title, children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}
