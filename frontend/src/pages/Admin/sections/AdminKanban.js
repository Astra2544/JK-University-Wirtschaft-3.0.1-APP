import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, MoreHorizontal, Edit2, Trash2, Save, RefreshCw,
  Tag, CheckSquare, MessageSquare, Clock,
  ChevronLeft, Search, LayoutGrid, List, Users, Lock,
  Settings, Check, Flag, GripVertical, ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const COLORS = [
  { id: 'blue', label: 'Blau', bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
  { id: 'green', label: 'Grün', bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' },
  { id: 'amber', label: 'Gelb', bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-500' },
  { id: 'red', label: 'Rot', bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' },
  { id: 'purple', label: 'Lila', bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
  { id: 'teal', label: 'Türkis', bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-500' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' },
  { id: 'slate', label: 'Grau', bg: 'bg-slate-500', light: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-500' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-500' },
];

const PRIORITIES = [
  { id: 'low', label: 'Niedrig', color: 'text-slate-500', bg: 'bg-slate-100' },
  { id: 'medium', label: 'Normal', color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 'high', label: 'Hoch', color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 'urgent', label: 'Dringend', color: 'text-red-500', bg: 'bg-red-100' },
];

function getColorClasses(colorId) {
  return COLORS.find(c => c.id === colorId) || COLORS[0];
}

function getPriorityInfo(priorityId) {
  return PRIORITIES.find(p => p.id === priorityId) || PRIORITIES[1];
}

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

function BoardCard({ board, onSelect, onEdit, onDelete, isMobile }) {
  const [showMenu, setShowMenu] = useState(false);
  const color = getColorClasses(board.color);
  const progress = board.task_count > 0 ? Math.round((board.completed_count / board.task_count) * 100) : 0;

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(board);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(board);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98] touch-manipulation"
      onClick={() => onSelect(board)}
    >
      <div className={`h-2 ${color.bg}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{board.name}</h3>
              {board.is_private && <Lock size={14} className="text-slate-400 shrink-0" />}
            </div>
            {board.description && (
              <p className="text-xs sm:text-sm text-slate-500 line-clamp-2">{board.description}</p>
            )}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={handleMenuClick}
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <MoreHorizontal size={16} className="text-slate-400" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div className="absolute right-0 top-10 z-20 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-40">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 size={14} /> Bearbeiten
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <CheckSquare size={12} />
            {board.completed_count}/{board.task_count}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {board.member_count}
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${color.bg} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function TaskCard({ task, labels, onEdit, canEdit, onDragStart, onDragEnd, isDragging, columnId, isMobile, onMobileDragStart }) {
  const priority = getPriorityInfo(task.priority);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.is_completed;
  const taskLabels = labels.filter(l => task.labels?.includes(l.id));
  const cardRef = useRef(null);

  const handleDragStart = (e) => {
    if (!canEdit) return;
    e.dataTransfer.setData('taskId', task.id.toString());
    e.dataTransfer.setData('sourceColumnId', columnId.toString());
    e.dataTransfer.effectAllowed = 'move';
    onDragStart && onDragStart(task.id);
  };

  const handleDragEnd = () => {
    onDragEnd && onDragEnd();
  };

  const handleMobileDragHandle = (e) => {
    if (!canEdit || !isMobile) return;
    e.stopPropagation();
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(50);
    onMobileDragStart && onMobileDragStart(task, columnId);
  };

  const handleCardClick = (e) => {
    if (isDragging) return;
    onEdit(task);
  };

  return (
    <div
      ref={cardRef}
      draggable={canEdit && !isMobile}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={`bg-white rounded-xl border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-all select-none relative ${
        task.is_completed ? 'opacity-60' : ''
      } ${isDragging ? 'opacity-50 scale-95 ring-2 ring-blue-400' : ''}`}
    >
      {canEdit && isMobile && (
        <button
          onTouchStart={handleMobileDragHandle}
          onClick={(e) => e.stopPropagation()}
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-blue-100 rounded-l-lg border border-slate-200 border-r-0 touch-manipulation z-10"
          aria-label="Task verschieben"
        >
          <GripVertical size={16} className="text-slate-400" />
        </button>
      )}

      <div className={isMobile && canEdit ? 'ml-5' : ''}>
        {taskLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {taskLabels.map(label => {
              const color = getColorClasses(label.color);
              return (
                <span
                  key={label.id}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${color.light} ${color.text}`}
                >
                  {label.name}
                </span>
              );
            })}
          </div>
        )}

        <h4 className={`text-sm font-medium text-slate-900 mb-2 ${task.is_completed ? 'line-through' : ''}`}>
          {task.title}
        </h4>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {task.priority !== 'medium' && (
              <span className={`flex items-center gap-1 text-xs ${priority.color}`}>
                <Flag size={10} />
              </span>
            )}
            {task.due_date && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                <Clock size={10} />
                {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
              </span>
            )}
            {task.checklist_total > 0 && (
              <span className={`flex items-center gap-1 text-xs ${
                task.checklist_done === task.checklist_total ? 'text-green-500' : 'text-slate-400'
              }`}>
                <CheckSquare size={10} />
                {task.checklist_done}/{task.checklist_total}
              </span>
            )}
            {task.comment_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MessageSquare size={10} />
                {task.comment_count}
              </span>
            )}
          </div>
          {task.assignee_name && (
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0" title={task.assignee_name}>
              {task.assignee_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({ column, labels, onAddTask, onEditTask, onEditColumn, onTaskDrop, canEdit, isMobile, draggingTaskId, onTaskDragStart, onTaskDragEnd, isDropTarget, onMobileDragStart }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef(null);
  const columnRef = useRef(null);
  const color = getColorClasses(column.color);
  const isOverWipLimit = column.wip_limit && column.tasks.length >= column.wip_limit;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const sourceColumnId = parseInt(e.dataTransfer.getData('sourceColumnId'));
    if (taskId && sourceColumnId !== column.id) {
      onTaskDrop(taskId, column.id, column.tasks.length);
    }
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(column.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setShowAddTask(false);
    }
  };

  const handleShowAddTask = () => {
    setShowAddTask(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div
      ref={columnRef}
      data-column-id={column.id}
      className={`flex-shrink-0 flex flex-col bg-slate-50 rounded-2xl transition-all ${
        isMobile ? 'w-[280px] min-w-[280px]' : 'w-80'
      } ${isDragOver || isDropTarget ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-3 h-3 rounded-full ${color.bg} shrink-0`} />
          <h3 className="font-semibold text-slate-700 truncate text-sm">{column.name}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
            isOverWipLimit ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'
          }`}>
            {column.tasks.length}{column.wip_limit ? `/${column.wip_limit}` : ''}
          </span>
        </div>
        {canEdit && (
          <button
            onClick={() => onEditColumn(column)}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
          >
            <Settings size={14} className="text-slate-400" />
          </button>
        )}
      </div>

      <div className="flex-1 px-3 overflow-y-auto space-y-2 min-h-[100px] pb-2" style={{ maxHeight: isMobile ? 'calc(100vh - 320px)' : 'calc(100vh - 280px)' }}>
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            labels={labels}
            onEdit={onEditTask}
            canEdit={canEdit}
            columnId={column.id}
            isDragging={draggingTaskId === task.id}
            onDragStart={onTaskDragStart}
            onDragEnd={onTaskDragEnd}
            isMobile={isMobile}
            onMobileDragStart={onMobileDragStart}
          />
        ))}
        {column.tasks.length === 0 && (
          <div className="py-8 text-center text-slate-400 text-sm">
            Keine Tasks
          </div>
        )}
      </div>

      {canEdit && (
        <div className="p-3 shrink-0 border-t border-slate-200">
          {showAddTask ? (
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <input
                ref={inputRef}
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task-Titel eingeben..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask();
                  if (e.key === 'Escape') { setShowAddTask(false); setNewTaskTitle(''); }
                }}
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Hinzufügen
                </button>
                <button
                  onClick={() => { setShowAddTask(false); setNewTaskTitle(''); }}
                  className="p-2.5 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleShowAddTask}
              className="w-full px-3 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors touch-manipulation"
            >
              <Plus size={18} /> Task hinzufügen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BoardModal({ board, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name: board?.name || '',
    description: board?.description || '',
    color: board?.color || 'blue',
    is_private: board?.is_private || false,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-slate-900">
            {board ? 'Board bearbeiten' : 'Neues Board erstellen'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. Sprint 1, Marketing, etc."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Worum geht es in diesem Board?"
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Farbe</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setForm({ ...form, color: color.id })}
                  className={`w-9 h-9 rounded-full ${color.bg} ${
                    form.color === color.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              checked={form.is_private}
              onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Privates Board</span>
              <p className="text-xs text-slate-500">Nur du und eingeladene Mitglieder haben Zugriff</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 font-medium rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {board ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ColumnModal({ column, onSave, onDelete, onClose, loading }) {
  const [form, setForm] = useState({
    name: column?.name || '',
    color: column?.color || 'slate',
    wip_limit: column?.wip_limit || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      wip_limit: form.wip_limit ? parseInt(form.wip_limit) : null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-slate-900">
            {column ? 'Spalte bearbeiten' : 'Neue Spalte'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. To Do, In Progress, Done"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Farbe</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setForm({ ...form, color: color.id })}
                  className={`w-8 h-8 rounded-full ${color.bg} ${
                    form.color === color.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">WIP-Limit (optional)</label>
            <input
              type="number"
              min="1"
              value={form.wip_limit}
              onChange={(e) => setForm({ ...form, wip_limit: e.target.value })}
              placeholder="Max. Anzahl Tasks"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <p className="text-xs text-slate-500 mt-1">Work-in-Progress Limit für diese Spalte</p>
          </div>

          <div className="flex gap-3 pt-2 pb-4">
            {column && (
              <button
                type="button"
                onClick={() => onDelete(column)}
                className="px-4 py-3 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 font-medium rounded-xl"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : 'Speichern'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function TaskModal({ task, board, admins, onSave, onDelete, onClose, loading }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    labels: task?.labels || [],
    assignee_id: task?.assignee_id || '',
    is_completed: task?.is_completed || false,
  });
  const [taskDetails, setTaskDetails] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);

  useEffect(() => {
    if (task?.id) {
      apiRequest(`/api/kanban/tasks/${task.id}`)
        .then(data => setTaskDetails(data))
        .catch(console.error);
    }
  }, [task?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null,
    });
  };

  const toggleLabel = (labelId) => {
    setForm(prev => ({
      ...prev,
      labels: prev.labels.includes(labelId)
        ? prev.labels.filter(id => id !== labelId)
        : [...prev.labels, labelId]
    }));
  };

  const addComment = async () => {
    if (!newComment.trim() || !task?.id) return;
    setSavingComment(true);
    try {
      const comment = await apiRequest(`/api/kanban/tasks/${task.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setTaskDetails(prev => ({
        ...prev,
        comments: [comment, ...(prev?.comments || [])],
      }));
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await apiRequest(`/api/kanban/comments/${commentId}`, { method: 'DELETE' });
      setTaskDetails(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const addChecklistItem = async () => {
    if (!newChecklistItem.trim() || !task?.id) return;
    setSavingChecklist(true);
    try {
      const item = await apiRequest(`/api/kanban/tasks/${task.id}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ text: newChecklistItem.trim() }),
      });
      setTaskDetails(prev => ({
        ...prev,
        checklist: [...(prev?.checklist || []), item],
      }));
      setNewChecklistItem('');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingChecklist(false);
    }
  };

  const toggleChecklistItem = async (itemId, isCompleted) => {
    try {
      await apiRequest(`/api/kanban/checklist/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_completed: !isCompleted }),
      });
      setTaskDetails(prev => ({
        ...prev,
        checklist: prev.checklist.map(c =>
          c.id === itemId ? { ...c, is_completed: !isCompleted } : c
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChecklistItem = async (itemId) => {
    try {
      await apiRequest(`/api/kanban/checklist/${itemId}`, { method: 'DELETE' });
      setTaskDetails(prev => ({
        ...prev,
        checklist: prev.checklist.filter(c => c.id !== itemId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-center bg-black/50 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl sm:my-8 sm:mx-4 max-h-[95vh] sm:max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-slate-900">
            {task?.id ? 'Task bearbeiten' : 'Neuer Task'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Titel *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Was ist zu tun?"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Beschreibung</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Weitere Details..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priorität</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p.id })}
                      className={`px-3 py-2.5 rounded-lg text-sm text-center flex items-center justify-center gap-2 transition-colors ${
                        form.priority === p.id
                          ? `${p.bg} ${p.color} font-medium`
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Flag size={14} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fällig am</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Zugewiesen an</label>
              <select
                value={form.assignee_id}
                onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="">Nicht zugewiesen</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>{admin.display_name}</option>
                ))}
              </select>
            </div>

            {board?.labels?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {board.labels.map(label => {
                    const color = getColorClasses(label.color);
                    const isSelected = form.labels.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleLabel(label.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? `${color.bg} text-white`
                            : `${color.light} ${color.text} hover:opacity-80`
                        }`}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {task?.id && (
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.is_completed}
                  onChange={(e) => setForm({ ...form, is_completed: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">Als erledigt markieren</span>
              </label>
            )}

            {task?.id && taskDetails && (
              <>
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    <CheckSquare size={14} className="inline mr-1" />
                    Checkliste ({taskDetails.checklist?.filter(c => c.is_completed).length || 0}/{taskDetails.checklist?.length || 0})
                  </label>
                  <div className="space-y-2 mb-3">
                    {taskDetails.checklist?.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(item.id, item.is_completed)}
                          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            item.is_completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-300 hover:border-blue-500'
                          }`}
                        >
                          {item.is_completed && <Check size={14} />}
                        </button>
                        <span className={`flex-1 text-sm ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteChecklistItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Neues Item hinzufügen..."
                      className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      disabled={savingChecklist || !newChecklistItem.trim()}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-600 disabled:text-slate-400 rounded-lg text-sm font-medium"
                    >
                      {savingChecklist ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    <MessageSquare size={14} className="inline mr-1" />
                    Kommentare ({taskDetails.comments?.length || 0})
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Kommentar schreiben..."
                      className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addComment())}
                    />
                    <button
                      type="button"
                      onClick={addComment}
                      disabled={savingComment || !newComment.trim()}
                      className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg text-sm font-medium"
                    >
                      {savingComment ? <RefreshCw size={14} className="animate-spin" /> : 'Senden'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {taskDetails.comments?.map(comment => (
                      <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-slate-700">{comment.admin_name}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(comment.created_at).toLocaleString('de-DE')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{comment.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteComment(comment.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-slate-100 pb-4">
            {task?.id && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="px-4 py-3 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-50 flex items-center justify-center gap-2 sm:order-1"
              >
                <Trash2 size={16} /> Löschen
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 sm:order-2 sm:ml-auto"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 font-medium rounded-xl flex items-center justify-center gap-2 sm:order-3"
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

function LabelModal({ board, onClose, onRefresh }) {
  const [labels, setLabels] = useState(board?.labels || []);
  const [newLabel, setNewLabel] = useState({ name: '', color: 'blue' });
  const [saving, setSaving] = useState(false);

  const addLabel = async () => {
    if (!newLabel.name.trim()) return;
    setSaving(true);
    try {
      const label = await apiRequest(`/api/kanban/boards/${board.id}/labels`, {
        method: 'POST',
        body: JSON.stringify(newLabel),
      });
      setLabels([...labels, label]);
      setNewLabel({ name: '', color: 'blue' });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteLabel = async (labelId) => {
    try {
      await apiRequest(`/api/kanban/labels/${labelId}`, { method: 'DELETE' });
      setLabels(labels.filter(l => l.id !== labelId));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-slate-900">Labels verwalten</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            {labels.map(label => {
              const color = getColorClasses(label.color);
              return (
                <div key={label.id} className="flex items-center gap-2">
                  <div className={`flex-1 px-4 py-3 rounded-lg ${color.light}`}>
                    <span className={`text-sm font-medium ${color.text}`}>{label.name}</span>
                  </div>
                  <button
                    onClick={() => deleteLabel(label.id)}
                    className="p-2.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
            {labels.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Noch keine Labels vorhanden</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Neues Label</label>
            <input
              type="text"
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              placeholder="Label-Name"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {COLORS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setNewLabel({ ...newLabel, color: color.id })}
                  className={`w-8 h-8 rounded-full ${color.bg} ${
                    newLabel.color === color.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                />
              ))}
            </div>
            <button
              onClick={addLabel}
              disabled={saving || !newLabel.name.trim()}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg font-medium"
            >
              {saving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'Label hinzufügen'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MobileMoveModal({ task, columns, currentColumnId, onMove, onClose }) {
  const availableColumns = columns.filter(c => c.id !== currentColumnId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-hidden"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Task verschieben</h3>
              <p className="text-sm text-slate-500 truncate mt-1">{task.title}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto">
          <p className="text-sm text-slate-500 mb-3">Verschieben nach:</p>
          {availableColumns.map(column => {
            const color = getColorClasses(column.color);
            return (
              <button
                key={column.id}
                onClick={() => onMove(task.id, column.id)}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 active:bg-blue-50 rounded-xl transition-colors text-left"
              >
                <div className={`w-4 h-4 rounded-full ${color.bg} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-900">{column.name}</span>
                  <span className="text-sm text-slate-400 ml-2">({column.tasks?.length || 0} Tasks)</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            );
          })}
          {availableColumns.length === 0 && (
            <p className="text-center py-8 text-slate-400">Keine anderen Spalten vorhanden</p>
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700"
          >
            Abbrechen
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BoardView({ board, onBack, onRefresh }) {
  const [columns, setColumns] = useState(board.columns || []);
  const [labels, setLabels] = useState(board.labels || []);
  const [admins, setAdmins] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dropTargetColumn, setDropTargetColumn] = useState(null);
  const [mobileMoveTask, setMobileMoveTask] = useState(null);
  const [mobileMoveColumnId, setMobileMoveColumnId] = useState(null);
  const boardRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    apiRequest('/api/kanban/available-admins')
      .then(setAdmins)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setColumns(board.columns || []);
    setLabels(board.labels || []);
  }, [board]);

  const executeTaskMove = useCallback(async (taskId, columnId, sortOrder = 0) => {
    try {
      await apiRequest(`/api/kanban/tasks/${taskId}/move`, {
        method: 'PUT',
        body: JSON.stringify({ column_id: columnId, sort_order: sortOrder }),
      });
      const data = await apiRequest(`/api/kanban/boards/${board.id}`);
      setColumns(data.columns || []);
      setLabels(data.labels || []);
    } catch (err) {
      console.error(err);
    }
  }, [board.id]);

  const handleMobileDragStart = (task, columnId) => {
    setMobileMoveTask(task);
    setMobileMoveColumnId(columnId);
  };

  const handleMobileMove = async (taskId, targetColumnId) => {
    setMobileMoveTask(null);
    setMobileMoveColumnId(null);
    await executeTaskMove(taskId, targetColumnId, 0);
  };

  const handleTaskDragStart = (taskId) => {
    setDraggingTaskId(taskId);
  };

  const handleTaskDragEnd = () => {
    setDraggingTaskId(null);
    setDropTargetColumn(null);
  };

  const scrollToColumn = (index) => {
    if (boardRef.current && isMobile) {
      const columnWidth = 296;
      boardRef.current.scrollTo({
        left: index * columnWidth,
        behavior: 'smooth'
      });
      setCurrentColumnIndex(index);
    }
  };

  const handleScroll = useCallback(() => {
    if (boardRef.current && isMobile) {
      const scrollLeft = boardRef.current.scrollLeft;
      const columnWidth = 296;
      const newIndex = Math.round(scrollLeft / columnWidth);
      if (newIndex !== currentColumnIndex) {
        setCurrentColumnIndex(Math.min(newIndex, columns.length));
      }
    }
  }, [isMobile, currentColumnIndex, columns.length]);

  const refreshBoard = async () => {
    try {
      const data = await apiRequest(`/api/kanban/boards/${board.id}`);
      setColumns(data.columns || []);
      setLabels(data.labels || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (columnId, title) => {
    try {
      const task = await apiRequest(`/api/kanban/columns/${columnId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTask = async (taskData) => {
    setSaving(true);
    try {
      if (editingTask?.id) {
        await apiRequest(`/api/kanban/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(taskData),
        });
      } else {
        await apiRequest(`/api/kanban/columns/${editingTask.column_id}/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskData),
        });
      }
      await refreshBoard();
      setEditingTask(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm('Task wirklich löschen?')) return;
    try {
      await apiRequest(`/api/kanban/tasks/${task.id}`, { method: 'DELETE' });
      await refreshBoard();
      setEditingTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskDrop = async (taskId, columnId, sortOrder) => {
    await executeTaskMove(taskId, columnId, sortOrder);
  };

  const handleSaveColumn = async (columnData) => {
    setSaving(true);
    try {
      if (editingColumn?.id) {
        await apiRequest(`/api/kanban/columns/${editingColumn.id}`, {
          method: 'PUT',
          body: JSON.stringify(columnData),
        });
      } else {
        await apiRequest(`/api/kanban/boards/${board.id}/columns`, {
          method: 'POST',
          body: JSON.stringify(columnData),
        });
      }
      await refreshBoard();
      setEditingColumn(null);
      setShowNewColumn(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColumn = async (column) => {
    if (column.tasks?.length > 0) {
      if (!window.confirm(`Spalte "${column.name}" enthält ${column.tasks.length} Tasks. Wirklich löschen?`)) return;
    } else {
      if (!window.confirm(`Spalte "${column.name}" wirklich löschen?`)) return;
    }
    try {
      await apiRequest(`/api/kanban/columns/${column.id}`, { method: 'DELETE' });
      await refreshBoard();
      setEditingColumn(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBoard = async (boardData) => {
    setSaving(true);
    try {
      await apiRequest(`/api/kanban/boards/${board.id}`, {
        method: 'PUT',
        body: JSON.stringify(boardData),
      });
      onRefresh();
      setShowBoardSettings(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(task => {
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterAssignee && task.assignee_id !== parseInt(filterAssignee)) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }),
  }));

  const canEdit = board.can_edit;
  const hasActiveFilters = filterPriority || filterAssignee || searchQuery;

  return (
    <div className="h-full flex flex-col -m-3 sm:-m-5 lg:-m-8" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="px-3 sm:px-5 lg:px-8 py-2 sm:py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg shrink-0 -ml-1"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">{board.name}</h2>
                {board.is_private && <Lock size={14} className="text-slate-400 shrink-0" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors relative ${
                showFilters || hasActiveFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Search size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => setShowLabelModal(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg hidden sm:block"
                  title="Labels verwalten"
                >
                  <Tag size={18} className="text-slate-600" />
                </button>
                <button
                  onClick={() => setShowBoardSettings(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                  title="Board-Einstellungen"
                >
                  <Settings size={18} className="text-slate-600" />
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suchen..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Alle Prioritäten</option>
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Alle Bearbeiter</option>
                    {admins.map(a => (
                      <option key={a.id} value={a.id}>{a.display_name}</option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearchQuery(''); setFilterPriority(''); setFilterAssignee(''); }}
                    className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isMobile && filteredColumns.length > 1 && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto flex-1 pb-1">
            {filteredColumns.map((column, index) => {
              const color = getColorClasses(column.color);
              return (
                <button
                  key={column.id}
                  onClick={() => scrollToColumn(index)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    currentColumnIndex === index
                      ? 'bg-white shadow-sm text-slate-900'
                      : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                  {column.name}
                  <span className="text-slate-400">({column.tasks.length})</span>
                </button>
              );
            })}
            {canEdit && (
              <button
                onClick={() => scrollToColumn(filteredColumns.length)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  currentColumnIndex === filteredColumns.length
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <Plus size={12} />
                Neu
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={boardRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-x-auto overflow-y-hidden py-3 ${
          isMobile ? 'px-2 snap-x snap-mandatory scroll-smooth' : 'px-3 sm:px-5 lg:px-8'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className={`flex pb-4 ${isMobile ? 'gap-4' : 'gap-3 sm:gap-4'}`} style={{ minWidth: 'max-content' }}>
          {filteredColumns.map((column, index) => (
            <div key={column.id} className={isMobile ? 'snap-center' : ''}>
              <Column
                column={column}
                labels={labels}
                onAddTask={handleAddTask}
                onEditTask={setEditingTask}
                onEditColumn={setEditingColumn}
                onDeleteColumn={handleDeleteColumn}
                onTaskDrop={handleTaskDrop}
                canEdit={canEdit}
                isMobile={isMobile}
                draggingTaskId={draggingTaskId}
                onTaskDragStart={handleTaskDragStart}
                onTaskDragEnd={handleTaskDragEnd}
                isDropTarget={dropTargetColumn === column.id}
                onMobileDragStart={handleMobileDragStart}
              />
            </div>
          ))}

          {canEdit && (
            <div className={`shrink-0 ${isMobile ? 'w-[280px] min-w-[280px] snap-center' : 'w-80'}`}>
              <button
                onClick={() => setShowNewColumn(true)}
                className="w-full px-4 py-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-2xl text-slate-600 font-medium flex items-center justify-center gap-2 transition-colors touch-manipulation h-[200px]"
              >
                <Plus size={18} /> Spalte hinzufügen
              </button>
            </div>
          )}

          {isMobile && <div className="w-4 shrink-0" />}
        </div>
      </div>

      <AnimatePresence>
        {mobileMoveTask && (
          <MobileMoveModal
            task={mobileMoveTask}
            columns={filteredColumns}
            currentColumnId={mobileMoveColumnId}
            onMove={handleMobileMove}
            onClose={() => { setMobileMoveTask(null); setMobileMoveColumnId(null); }}
          />
        )}
        {editingTask && (
          <TaskModal
            task={editingTask.id ? editingTask : { column_id: editingTask.column_id }}
            board={{ ...board, labels }}
            admins={admins}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            onClose={() => setEditingTask(null)}
            loading={saving}
          />
        )}
        {(editingColumn || showNewColumn) && (
          <ColumnModal
            column={editingColumn}
            onSave={handleSaveColumn}
            onDelete={handleDeleteColumn}
            onClose={() => { setEditingColumn(null); setShowNewColumn(false); }}
            loading={saving}
          />
        )}
        {showLabelModal && (
          <LabelModal
            board={{ ...board, labels }}
            onClose={() => setShowLabelModal(false)}
            onRefresh={refreshBoard}
          />
        )}
        {showBoardSettings && (
          <BoardModal
            board={board}
            onSave={handleSaveBoard}
            onClose={() => setShowBoardSettings(false)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminKanban() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/kanban/boards');
      setBoards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBoardDetails = async (boardId) => {
    try {
      const data = await apiRequest(`/api/kanban/boards/${boardId}`);
      setSelectedBoard(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleSelectBoard = async (board) => {
    await fetchBoardDetails(board.id);
  };

  const handleCreateBoard = async (data) => {
    setSaving(true);
    try {
      await apiRequest('/api/kanban/boards', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await fetchBoards();
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditBoard = async (data) => {
    setSaving(true);
    try {
      await apiRequest(`/api/kanban/boards/${editingBoard.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      await fetchBoards();
      setEditingBoard(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBoard = async (board) => {
    if (!window.confirm(`Board "${board.name}" wirklich löschen? Alle Tasks werden ebenfalls gelöscht.`)) return;
    try {
      await apiRequest(`/api/kanban/boards/${board.id}`, { method: 'DELETE' });
      await fetchBoards();
    } catch (err) {
      console.error(err);
    }
  };

  if (selectedBoard) {
    return (
      <BoardView
        board={selectedBoard}
        onBack={() => setSelectedBoard(null)}
        onRefresh={() => fetchBoardDetails(selectedBoard.id)}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Kanban Boards</h2>
          <p className="text-sm text-slate-500 mt-1">Projekte und Aufgaben verwalten</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
              }`}
            >
              <LayoutGrid size={16} className={viewMode === 'grid' ? 'text-blue-600' : 'text-slate-500'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
              }`}
            >
              <List size={16} className={viewMode === 'list' ? 'text-blue-600' : 'text-slate-500'} />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors touch-manipulation"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Neues</span> Board
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-slate-50 rounded-2xl">
          <LayoutGrid size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-4">Noch keine Boards vorhanden</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium"
          >
            <Plus size={16} /> Erstes Board erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence>
            {boards.map(board => (
              <BoardCard
                key={board.id}
                board={board}
                onSelect={handleSelectBoard}
                onEdit={setEditingBoard}
                onDelete={handleDeleteBoard}
                isMobile={isMobile}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <BoardModal
            onSave={handleCreateBoard}
            onClose={() => setShowCreateModal(false)}
            loading={saving}
          />
        )}
        {editingBoard && (
          <BoardModal
            board={editingBoard}
            onSave={handleEditBoard}
            onClose={() => setEditingBoard(null)}
            loading={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
