/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UMFRAGE PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Dynamische Umfrage-Seite mit verschiedenen Fragetypen.
 *  Unterstuetzt Gewinnspiele und anonyme Teilnahme.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList, Send, CheckCircle, Gift, ChevronRight, ChevronLeft,
  AlertCircle, Star, Calendar, Mail, Hash, AlignLeft, List, ChevronDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function QuestionInput({ question, value, onChange, lang }) {
  const qText = lang === 'en' && question.question_en ? question.question_en : question.question_de;
  const type = question.question_type;
  const options = question.options || [];
  const settings = question.settings || {};

  const getOptionLabel = (opt) => {
    if (typeof opt === 'string') return opt;
    return lang === 'en' && opt.label_en ? opt.label_en : opt.label_de || opt.value;
  };

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={settings.placeholder || ''}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={settings.placeholder || ''}
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={settings.placeholder || 'email@example.com'}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            min={settings.min}
            max={settings.max}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        );
      
      case 'single_choice':
        return (
          <div className="space-y-2">
            {options.map((opt, idx) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    value === optValue 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    value === optValue ? 'border-blue-500' : 'border-slate-300'
                  }`}>
                    {value === optValue && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                  </div>
                  <span className="text-slate-700">{getOptionLabel(opt)}</span>
                </label>
              );
            })}
          </div>
        );
      
      case 'multiple_choice':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {options.map((opt, idx) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const isSelected = selectedValues.includes(optValue);
              return (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <span className="text-slate-700">{getOptionLabel(opt)}</span>
                </label>
              );
            })}
          </div>
        );
      
      case 'dropdown':
        return (
          <div className="relative">
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">{lang === 'en' ? 'Please select...' : 'Bitte auswählen...'}</option>
              {options.map((opt, idx) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                return (
                  <option key={idx} value={optValue}>{getOptionLabel(opt)}</option>
                );
              })}
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        );
      
      case 'scale':
        const min = settings.min || 1;
        const max = settings.max || 5;
        const minLabel = settings.min_label || min;
        const maxLabel = settings.max_label || max;
        const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        
        return (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-2 px-1">
              <span>{lang === 'en' && settings.min_label_en ? settings.min_label_en : minLabel}</span>
              <span>{lang === 'en' && settings.max_label_en ? settings.max_label_en : maxLabel}</span>
            </div>
            <div className="flex gap-2">
              {range.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    value === num
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-slate-800 font-medium mb-2">
        {qText}
        {question.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}

export default function Umfrage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState('');
  const [participateRaffle, setParticipateRaffle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 5;
  
  const lang = i18n.language === 'en' ? 'en' : 'de';

  useEffect(() => {
    fetch(`${API_URL}/api/survey/active`)
      .then(res => res.json())
      .then(data => {
        setSurvey(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const shouldShowQuestion = (question) => {
    if (!question.condition) return true;
    const { question_id, operator, value } = question.condition;
    const answer = answers[question_id];
    
    switch (operator) {
      case 'equals': return answer === value;
      case 'not_equals': return answer !== value;
      case 'contains': return Array.isArray(answer) && answer.includes(value);
      case 'not_empty': return answer && answer.length > 0;
      default: return true;
    }
  };

  const visibleQuestions = survey?.questions?.filter(shouldShowQuestion) || [];
  const totalPages = Math.ceil(visibleQuestions.length / questionsPerPage);
  const currentQuestions = visibleQuestions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  const handleSubmit = async () => {
    setError('');
    
    // Validate required fields
    for (const q of visibleQuestions) {
      if (q.is_required && !answers[q.id]) {
        setError(lang === 'en' 
          ? 'Please answer all required questions.' 
          : 'Bitte beantworte alle Pflichtfragen.'
        );
        return;
      }
    }
    
    if (participateRaffle && !email) {
      setError(lang === 'en' 
        ? 'Please enter your email to participate in the raffle.' 
        : 'Bitte gib deine E-Mail ein um am Gewinnspiel teilzunehmen.'
      );
      return;
    }
    
    setSubmitting(true);
    
    try {
      const answersToSend = {};
      Object.keys(answers).forEach(key => {
        answersToSend[String(key)] = answers[key];
      });

      const res = await fetch(`${API_URL}/api/survey/${survey.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersToSend,
          email: participateRaffle ? email : null,
          participate_raffle: participateRaffle
        })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        let errorMsg = 'Fehler beim Absenden';
        try {
          const data = await res.json();
          if (data.detail) {
            errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          }
        } catch (e) {}
        setError(errorMsg);
      }
    } catch (err) {
      setError('Fehler beim Absenden');
    } finally {
      setSubmitting(false);
    }
  };

  const title = survey && (lang === 'en' && survey.title_en ? survey.title_en : survey.title_de);
  const description = survey && (lang === 'en' && survey.description_en ? survey.description_en : survey.description_de);
  const raffleDesc = survey && (lang === 'en' && survey.raffle_description_en ? survey.raffle_description_en : survey.raffle_description_de);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white"
    >
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !survey ? (
            <div className="text-center py-20">
              <ClipboardList size={64} className="mx-auto mb-4 text-slate-300" />
              <h1 className="text-2xl font-bold text-slate-700 mb-2">
                {lang === 'en' ? 'No active survey' : 'Keine aktive Umfrage'}
              </h1>
              <p className="text-slate-500">
                {lang === 'en' 
                  ? 'There is currently no survey available.' 
                  : 'Aktuell ist keine Umfrage verfügbar.'
                }
              </p>
            </div>
          ) : submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {lang === 'en' ? 'Thank you!' : 'Vielen Dank!'}
              </h1>
              <p className="text-slate-600">
                {lang === 'en' 
                  ? 'Your response has been recorded.' 
                  : 'Deine Antworten wurden gespeichert.'
                }
              </p>
              {participateRaffle && (
                <p className="text-slate-500 mt-2">
                  {lang === 'en'
                    ? 'You are now participating in the raffle!'
                    : 'Du nimmst jetzt am Gewinnspiel teil!'
                  }
                </p>
              )}
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {lang === 'en' ? 'Back to Home' : 'Zur Startseite'}
              </button>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                  <ClipboardList size={16} />
                  {lang === 'en' ? 'Survey' : 'Umfrage'}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{title}</h1>
                {description && (
                  <p className="text-slate-600">{description}</p>
                )}
              </div>
              
              {/* Progress */}
              {totalPages > 1 && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-slate-500 mb-2">
                    <span>{lang === 'en' ? 'Progress' : 'Fortschritt'}</span>
                    <span>{currentPage + 1} / {totalPages}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Questions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {currentQuestions.map((question) => (
                      <QuestionInput
                        key={question.id}
                        question={question}
                        value={answers[question.id]}
                        onChange={(val) => handleAnswerChange(question.id, val)}
                        lang={lang}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Raffle Section */}
              {survey.raffle_enabled && currentPage === totalPages - 1 && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Gift className="text-amber-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {lang === 'en' ? 'Raffle' : 'Gewinnspiel'}
                      </h3>
                      {raffleDesc && <p className="text-sm text-slate-600 mb-3">{raffleDesc}</p>}
                      
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={participateRaffle}
                          onChange={(e) => setParticipateRaffle(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">
                          {lang === 'en' ? 'I want to participate in the raffle' : 'Ich möchte am Gewinnspiel teilnehmen'}
                        </span>
                      </label>
                      
                      {participateRaffle && (
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={lang === 'en' ? 'Your email address' : 'Deine E-Mail-Adresse'}
                          className="w-full px-4 py-2 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              
              {/* Navigation */}
              <div className="flex justify-between gap-4">
                {currentPage > 0 ? (
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    <ChevronLeft size={20} />
                    {lang === 'en' ? 'Back' : 'Zurück'}
                  </button>
                ) : (
                  <div />
                )}
                
                {currentPage < totalPages - 1 ? (
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    {lang === 'en' ? 'Continue' : 'Weiter'}
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {lang === 'en' ? 'Submit' : 'Absenden'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </motion.div>
  );
}
