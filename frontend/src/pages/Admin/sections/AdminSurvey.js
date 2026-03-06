/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN SURVEY SECTION | OeH Wirtschaft Admin Panel
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Verwaltung von Umfragen mit verschiedenen Fragetypen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Trash2, Edit3, Eye, EyeOff, Save, X, ChevronDown, ChevronUp,
  ClipboardList, Gift, BarChart3, Users, GripVertical, Copy, Settings,
  Type, AlignLeft, List, CheckSquare, ChevronRight as ChevronRightIcon, Hash, Calendar, Mail, Star,
  AlertCircle, Check, Loader2, Languages
} from 'lucide-react';
import SectionNotificationBanner from '../components/SectionNotificationBanner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Simple translation helper using free API
const translateText = async (text, fromLang = 'de', toLang = 'en') => {
  if (!text || text.trim() === '') return '';
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
};

const QUESTION_TYPES = [
  { value: 'text', label: 'Kurztext', icon: Type },
  { value: 'textarea', label: 'Langtext', icon: AlignLeft },
  { value: 'single_choice', label: 'Einzelauswahl', icon: List },
  { value: 'multiple_choice', label: 'Mehrfachauswahl', icon: CheckSquare },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronRightIcon },
  { value: 'scale', label: 'Skala (1-5)', icon: Star },
  { value: 'number', label: 'Zahl', icon: Hash },
  { value: 'date', label: 'Datum', icon: Calendar },
  { value: 'email', label: 'E-Mail', icon: Mail },
];

function QuestionEditor({ question, onUpdate, onDelete, otherQuestions }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState(question);
  const [optionInput, setOptionInput] = useState('');

  const handleSave = () => {
    onUpdate(form);
    setExpanded(false);
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    const newOptions = [...(form.options || []), { value: optionInput.trim(), label_de: optionInput.trim(), label_en: '' }];
    setForm({ ...form, options: newOptions });
    setOptionInput('');
  };

  const removeOption = (idx) => {
    const newOptions = form.options.filter((_, i) => i !== idx);
    setForm({ ...form, options: newOptions });
  };

  const TypeIcon = QUESTION_TYPES.find(t => t.value === form.question_type)?.icon || Type;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical size={18} className="text-slate-300 cursor-grab" />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.is_required ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
          <TypeIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{form.question_de || 'Neue Frage'}</p>
          <p className="text-xs text-slate-400">{QUESTION_TYPES.find(t => t.value === form.question_type)?.label || 'Text'}</p>
        </div>
        <div className="flex items-center gap-2">
          {form.is_required && <span className="text-xs font-medium text-red-500">Pflicht</span>}
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100"
          >
            <div className="p-4 space-y-4">
              {/* Question Text */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frage (Deutsch) *</label>
                  <input
                    type="text"
                    value={form.question_de}
                    onChange={(e) => setForm({ ...form, question_de: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frage (Englisch)</label>
                  <input
                    type="text"
                    value={form.question_en || ''}
                    onChange={(e) => setForm({ ...form, question_en: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Type & Required */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fragetyp</label>
                  <select
                    value={form.question_type}
                    onChange={(e) => setForm({ ...form, question_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {QUESTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_required}
                      onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Pflichtfeld</span>
                  </label>
                </div>
              </div>
              
              {/* Options for choice questions */}
              {['single_choice', 'multiple_choice', 'dropdown'].includes(form.question_type) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Antwortmöglichkeiten</label>
                  <div className="space-y-2 mb-3">
                    {(form.options || []).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.label_de || opt.value}
                          onChange={(e) => {
                            const newOptions = [...form.options];
                            newOptions[idx] = { ...newOptions[idx], label_de: e.target.value, value: e.target.value };
                            setForm({ ...form, options: newOptions });
                          }}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="Option (DE)"
                        />
                        <input
                          type="text"
                          value={opt.label_en || ''}
                          onChange={(e) => {
                            const newOptions = [...form.options];
                            newOptions[idx] = { ...newOptions[idx], label_en: e.target.value };
                            setForm({ ...form, options: newOptions });
                          }}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          placeholder="Option (EN)"
                        />
                        <button
                          onClick={() => removeOption(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addOption()}
                      placeholder="Neue Option hinzufügen..."
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                    <button onClick={addOption} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Scale Settings */}
              {form.question_type === 'scale' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Min Label (DE)</label>
                    <input
                      type="text"
                      value={form.settings?.min_label || ''}
                      onChange={(e) => setForm({ ...form, settings: { ...form.settings, min_label: e.target.value } })}
                      placeholder="z.B. Schlecht"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Max Label (DE)</label>
                    <input
                      type="text"
                      value={form.settings?.max_label || ''}
                      onChange={(e) => setForm({ ...form, settings: { ...form.settings, max_label: e.target.value } })}
                      placeholder="z.B. Sehr gut"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Min Label (EN)</label>
                    <input
                      type="text"
                      value={form.settings?.min_label_en || ''}
                      onChange={(e) => setForm({ ...form, settings: { ...form.settings, min_label_en: e.target.value } })}
                      placeholder="e.g. Bad"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Max Label (EN)</label>
                    <input
                      type="text"
                      value={form.settings?.max_label_en || ''}
                      onChange={(e) => setForm({ ...form, settings: { ...form.settings, max_label_en: e.target.value } })}
                      placeholder="e.g. Excellent"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
              
              {/* Conditional Logic */}
              {otherQuestions && otherQuestions.filter(q => q.id !== form.id && q.question_de).length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Bedingte Anzeige</label>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-slate-600">Zeige diese Frage nur wenn</span>
                      <select
                        value={form.condition?.question_id || ''}
                        onChange={(e) => setForm({ 
                          ...form, 
                          condition: e.target.value ? { ...form.condition, question_id: parseInt(e.target.value) } : null 
                        })}
                        className="px-2 py-1 border border-slate-200 rounded text-sm bg-white"
                      >
                        <option value="">-- keine Bedingung --</option>
                        {otherQuestions.filter(q => q.id !== form.id && q.question_de).map(q => (
                          <option key={q.id} value={q.id}>{q.question_de?.slice(0, 40)}{q.question_de?.length > 40 ? '...' : ''}</option>
                        ))}
                      </select>
                      {form.condition?.question_id && (
                        <>
                          <select
                            value={form.condition?.operator || 'equals'}
                            onChange={(e) => setForm({ ...form, condition: { ...form.condition, operator: e.target.value } })}
                            className="px-2 py-1 border border-slate-200 rounded text-sm bg-white"
                          >
                            <option value="equals">gleich</option>
                            <option value="not_equals">nicht gleich</option>
                            <option value="contains">enthält</option>
                            <option value="not_empty">nicht leer</option>
                          </select>
                          {form.condition?.operator !== 'not_empty' && (
                            <input
                              type="text"
                              value={form.condition?.value || ''}
                              onChange={(e) => setForm({ ...form, condition: { ...form.condition, value: e.target.value } })}
                              placeholder="Wert"
                              className="px-2 py-1 border border-slate-200 rounded text-sm w-32"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Bedingte Anzeige</label>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
                    Füge zuerst andere Fragen hinzu um Bedingungen zu erstellen
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => onDelete(question.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} /> Löschen
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-600"
                >
                  <Save size={16} /> Speichern
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SurveyResults({ surveyId, token, onClose }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/surveys/${surveyId}/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [surveyId, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{results.total_responses}</p>
          <p className="text-sm text-blue-700">Teilnahmen</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{results.raffle_participants}</p>
          <p className="text-sm text-amber-700">Gewinnspiel</p>
        </div>
      </div>
      
      {/* Question Results */}
      {results.questions.map(q => {
        const stats = results.question_stats[q.id];
        if (!stats) return null;
        
        return (
          <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="font-medium text-slate-900 mb-4">{q.question_de}</h4>
            
            {stats.type === 'choice' && (
              <div className="space-y-2">
                {Object.entries(stats.counts).map(([value, count]) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={value} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-slate-600 truncate">{value}</div>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm font-medium text-slate-700">
                        {count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {stats.type === 'scale' && (
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-blue-600">{stats.average.toFixed(1)}</div>
                <div className="flex-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="flex-1">
                        <div className="text-xs text-center text-slate-500 mb-1">{n}</div>
                        <div className="h-20 bg-slate-100 rounded relative">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded transition-all"
                            style={{ height: `${stats.count > 0 ? (stats.distribution[n] / stats.count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {stats.type === 'text' && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {stats.answers.slice(0, 10).map((ans, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                    {ans}
                  </div>
                ))}
                {stats.count > 10 && (
                  <p className="text-sm text-slate-400">...und {stats.count - 10} weitere</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Raffle Emails */}
      {results.raffle_emails.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
            <Gift size={18} /> Gewinnspiel-Teilnehmer ({results.raffle_emails.length})
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {results.raffle_emails.map((email, idx) => (
              <div key={idx} className="text-sm text-amber-800 font-mono">{email}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSurvey({ token }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultsSurvey, setResultsSurvey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title_de: '',
    title_en: '',
    description_de: '',
    description_en: '',
    banner_text_de: '',
    banner_text_en: '',
    start_date: '',
    end_date: '',
    raffle_enabled: false,
    raffle_description_de: '',
    raffle_description_en: '',
    is_active: false,
    show_banner: true
  });

  const [questions, setQuestions] = useState([]);
  const [translating, setTranslating] = useState(false);

  // Auto-translate all German fields to English
  const handleAutoTranslate = async () => {
    setTranslating(true);
    try {
      const newForm = { ...form };
      
      // Translate form fields
      if (form.title_de && !form.title_en) {
        newForm.title_en = await translateText(form.title_de);
      }
      if (form.description_de && !form.description_en) {
        newForm.description_en = await translateText(form.description_de);
      }
      if (form.banner_text_de && !form.banner_text_en) {
        newForm.banner_text_en = await translateText(form.banner_text_de);
      }
      if (form.raffle_description_de && !form.raffle_description_en) {
        newForm.raffle_description_en = await translateText(form.raffle_description_de);
      }
      
      setForm(newForm);
      
      // Translate questions
      const newQuestions = await Promise.all(questions.map(async (q) => {
        const updated = { ...q };
        if (q.question_de && !q.question_en) {
          updated.question_en = await translateText(q.question_de);
        }
        // Translate options if any
        if (q.options && q.options.length > 0) {
          updated.options = await Promise.all(q.options.map(async (opt) => {
            if (opt.label_de && !opt.label_en) {
              return { ...opt, label_en: await translateText(opt.label_de) };
            }
            return opt;
          }));
        }
        return updated;
      }));
      
      setQuestions(newQuestions);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  const fetchSurveys = useCallback(() => {
    fetch(`${API_URL}/api/admin/surveys`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSurveys(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const loadSurveyDetail = (surveyId) => {
    fetch(`${API_URL}/api/admin/surveys/${surveyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setForm({
          title_de: data.title_de || '',
          title_en: data.title_en || '',
          description_de: data.description_de || '',
          description_en: data.description_en || '',
          banner_text_de: data.banner_text_de || '',
          banner_text_en: data.banner_text_en || '',
          start_date: data.start_date ? data.start_date.slice(0, 16) : '',
          end_date: data.end_date ? data.end_date.slice(0, 16) : '',
          raffle_enabled: data.raffle_enabled || false,
          raffle_description_de: data.raffle_description_de || '',
          raffle_description_en: data.raffle_description_en || '',
          is_active: data.is_active || false,
          show_banner: data.show_banner !== false
        });
        setQuestions(data.questions || []);
        setSelectedSurvey(data);
        setShowEditor(true);
      });
  };

  const handleCreate = () => {
    setForm({
      title_de: '',
      title_en: '',
      description_de: '',
      description_en: '',
      banner_text_de: '',
      banner_text_en: '',
      start_date: '',
      end_date: '',
      raffle_enabled: false,
      raffle_description_de: '',
      raffle_description_en: '',
      is_active: false,
      show_banner: true
    });
    setQuestions([]);
    setSelectedSurvey(null);
    setShowEditor(true);
  };

  const showSuccessMsg = (msg) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const showErrorMsg = (msg) => {
    setError(msg);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!form.title_de) {
      showErrorMsg('Titel (DE) ist erforderlich');
      return;
    }

    setSaving(true);

    try {
      if (selectedSurvey) {
        const res = await fetch(`${API_URL}/api/admin/surveys/${selectedSurvey.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Fehler beim Aktualisieren');
        showSuccessMsg('Umfrage erfolgreich gespeichert!');
      } else {
        const res = await fetch(`${API_URL}/api/admin/surveys`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...form,
            questions: questions.map((q, idx) => ({
              question_de: q.question_de,
              question_en: q.question_en,
              question_type: q.question_type,
              is_required: q.is_required,
              options: q.options,
              settings: q.settings,
              condition: q.condition,
              sort_order: idx
            }))
          })
        });
        if (!res.ok) throw new Error('Fehler beim Erstellen');
        const data = await res.json();
        if (data.id) {
          loadSurveyDetail(data.id);
        }
        showSuccessMsg('Umfrage erfolgreich erstellt!');
      }
      fetchSurveys();
    } catch (err) {
      showErrorMsg(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSurvey || !window.confirm('Umfrage wirklich löschen?')) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/surveys/${selectedSurvey.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Fehler beim Löschen');

      setShowEditor(false);
      setSelectedSurvey(null);
      fetchSurveys();
    } catch (err) {
      showErrorMsg(err.message || 'Fehler beim Löschen');
    }
  };

  const handleToggleActive = async (surveyId, currentState) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/surveys/${surveyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentState })
      });
      if (!res.ok) throw new Error('Fehler beim Aktualisieren');
      fetchSurveys();
    } catch (err) {
      showErrorMsg(err.message || 'Fehler beim Aktualisieren');
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(), // Temporary ID
      question_de: '',
      question_en: '',
      question_type: 'text',
      is_required: false,
      options: [],
      settings: {},
      condition: null,
      sort_order: questions.length,
      _isNew: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = async (updatedQuestion) => {
    if (selectedSurvey && !updatedQuestion._isNew) {
      // Update existing question in DB
      await fetch(`${API_URL}/api/admin/surveys/questions/${updatedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedQuestion)
      });
    } else if (selectedSurvey && updatedQuestion._isNew) {
      // Create new question in DB
      const res = await fetch(`${API_URL}/api/admin/surveys/${selectedSurvey.id}/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedQuestion)
      });
      const data = await res.json();
      updatedQuestion.id = data.id;
      delete updatedQuestion._isNew;
    }
    
    setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Frage wirklich löschen?')) return;
    
    const question = questions.find(q => q.id === questionId);
    if (selectedSurvey && !question._isNew) {
      await fetch(`${API_URL}/api/admin/surveys/questions/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  return (
    <div>
      <SectionNotificationBanner section="misc" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Umfragen</h2>
          <p className="text-sm text-slate-500 mt-1">Erstelle und verwalte Umfragen fur Studierende</p>
        </div>
        {!showEditor && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} /> Neue Umfrage
          </button>
        )}
      </div>

      {showEditor ? (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => { setShowEditor(false); setShowResults(false); }}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            ← Zurück zur Übersicht
          </button>

          {/* Basic Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Grundeinstellungen</h3>
              <button
                onClick={handleAutoTranslate}
                disabled={translating}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                {translating ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                Auto-Übersetzen
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titel (Deutsch) *</label>
                <input
                  type="text"
                  value={form.title_de}
                  onChange={(e) => setForm({ ...form, title_de: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Semesterumfrage WS 2025/26"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titel (Englisch) <span className="text-purple-500 text-xs">(auto)</span></label>
                <input
                  type="text"
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Wird automatisch übersetzt"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung (DE)</label>
                <textarea
                  value={form.description_de}
                  onChange={(e) => setForm({ ...form, description_de: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung (EN) <span className="text-purple-500 text-xs">(auto)</span></label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  rows={2}
                  placeholder="Wird automatisch übersetzt"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banner-Text (DE)</label>
                <input
                  type="text"
                  value={form.banner_text_de}
                  onChange={(e) => setForm({ ...form, banner_text_de: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Nimm jetzt an unserer Umfrage teil!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banner-Text (EN) <span className="text-purple-500 text-xs">(auto)</span></label>
                <input
                  type="text"
                  value={form.banner_text_en}
                  onChange={(e) => setForm({ ...form, banner_text_en: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Wird automatisch übersetzt"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Enddatum</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_banner}
                  onChange={(e) => setForm({ ...form, show_banner: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Banner anzeigen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm text-slate-700 font-medium">Aktiv</span>
              </label>
            </div>
          </div>

          {/* Raffle */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="text-amber-600" size={24} />
              <h3 className="font-semibold text-slate-900">Gewinnspiel</h3>
              <label className="ml-auto flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.raffle_enabled}
                  onChange={(e) => setForm({ ...form, raffle_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-700">Aktivieren</span>
              </label>
            </div>

            {form.raffle_enabled && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung (DE)</label>
                  <textarea
                    value={form.raffle_description_de}
                    onChange={(e) => setForm({ ...form, raffle_description_de: e.target.value })}
                    rows={2}
                    placeholder="z.B. Gewinne einen von 3 Amazon-Gutscheinen!"
                    className="w-full px-4 py-2 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beschreibung (EN)</label>
                  <textarea
                    value={form.raffle_description_en}
                    onChange={(e) => setForm({ ...form, raffle_description_en: e.target.value })}
                    rows={2}
                    placeholder="e.g. Win one of 3 Amazon vouchers!"
                    className="w-full px-4 py-2 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Fragen ({questions.length})</h3>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
              >
                <Plus size={16} /> Frage hinzufuegen
              </button>
            </div>

            <div className="space-y-3">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardList size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Noch keine Fragen</p>
                </div>
              ) : (
                questions.map((q) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                    otherQuestions={questions}
                  />
                ))
              )}
            </div>
          </div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
              >
                <Check size={18} />
                {success}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-between">
            {selectedSurvey && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Trash2 size={18} className="inline mr-2" /> Umfrage loeschen
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Speichern
            </button>
          </div>
        </div>
      ) : showResults && resultsSurvey ? (
        /* Survey Results View */
        <div className="space-y-6">
          <button
            onClick={() => { setShowResults(false); setResultsSurvey(null); }}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            ← Zurück zur Übersicht
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <BarChart3 size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{resultsSurvey.title_de}</h3>
              <p className="text-sm text-slate-500">Ergebnisse</p>
            </div>
          </div>
          <SurveyResults surveyId={resultsSurvey.id} token={token} />
        </div>
      ) : (
        /* Survey List */
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 font-medium mb-2">Noch keine Umfragen</p>
              <p className="text-sm text-slate-400">Erstelle deine erste Umfrage</p>
            </div>
          ) : (
            surveys.map(survey => (
              <div
                key={survey.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${survey.is_active ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <ClipboardList size={24} className={survey.is_active ? 'text-green-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 truncate">{survey.title_de}</h4>
                      {survey.is_active && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Aktiv</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {survey.question_count} Fragen · {survey.response_count} Teilnahmen
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(survey.id, survey.is_active)}
                      className={`p-2 rounded-lg transition-colors ${survey.is_active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      title={survey.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {survey.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => loadSurveyDetail(survey.id)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => { setResultsSurvey(survey); setShowResults(true); }}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Ergebnisse anzeigen"
                    >
                      <BarChart3 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
