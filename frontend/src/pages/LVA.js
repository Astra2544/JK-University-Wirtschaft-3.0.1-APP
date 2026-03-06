/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LVA PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Anonyme Bewertung von Lehrveranstaltungen.
 *  E-Mail-Verifizierung via JKU-Studentenmail.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { RevealOnScroll } from '../components/Animations';
import {
  Search, BookOpen, Star, X, Mail, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, Info, Send, Shield, TrendingUp, Key
} from 'lucide-react';
import Marquee from '../components/Marquee';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const pv = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const colorMap = {
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  lime: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

function RatingModal({ lva, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [effortRating, setEffortRating] = useState(null);
  const [difficultyRating, setDifficultyRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDirectCode, setIsDirectCode] = useState(false);

  const resetError = () => { setError(''); setCodeError(false); };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setCode(value);
    setCodeError(false);
  };

  const handleDirectCodeEntry = () => {
    setIsDirectCode(true);
    setStep(2);
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    resetError();
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/lva/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lva_id: lva.id })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || t('lva.modal.errorSend'));
        return;
      }

      setSuccess(t('lva.modal.codeSent'));
      setTimeout(() => {
        setSuccess('');
        setStep(2);
      }, 1500);
    } catch (err) {
      setError(t('lva.modal.errorConnection'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    resetError();
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/lva/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isDirectCode ? null : email,
          code,
          lva_id: lva.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setCodeError(true);
        setError(data.detail || t('lva.modal.errorInvalid'));
        return;
      }

      setStep(3);
    } catch (err) {
      setError(t('lva.modal.errorConnection'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    resetError();
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/lva/submit-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isDirectCode ? null : email,
          code,
          lva_id: lva.id,
          effort_rating: effortRating,
          difficulty_rating: difficultyRating
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || t('lva.modal.errorSubmit'));
        return;
      }

      setSuccess(t('lva.modal.successMsg'));
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(t('lva.modal.errorConnection'));
    } finally {
      setLoading(false);
    }
  };

  const RatingButton = ({ value, selected, onClick, label }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all font-bold text-base ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-600 scale-105'
          : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:bg-slate-50'
      }`}
    >
      {value}
      {label && <span className="block text-[10px] font-medium mt-0.5 opacity-70">{label}</span>}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">{t('lva.modal.rateTitle')}</p>
          <h3 className="text-white font-bold text-lg pr-8 leading-tight">{lva.name}</h3>

          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
              >
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 className="text-green-500" size={18} />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <form onSubmit={handleRequestCode}>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="text-blue-500" size={18} />
                  <h4 className="font-semibold text-slate-900 text-sm">{t('lva.modal.emailVerify')}</h4>
                </div>
                <p className="text-slate-500 text-xs mb-3" dangerouslySetInnerHTML={{ __html: t('lva.modal.emailHint') }}></p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="k12345678@students.jku.at"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                  required
                  data-testid="email-input"
                />
              </div>

              <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 mb-5">
                <div className="flex items-start gap-2">
                  <Shield className="text-gold-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-gold-800 text-xs" dangerouslySetInnerHTML={{ __html: t('lva.modal.anonymous') }}></p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="request-code-btn"
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t('lva.modal.requestCode')} <ArrowRight size={16} /></>}
              </button>

              <button
                type="button"
                onClick={handleDirectCodeEntry}
                data-testid="direct-code-btn"
                className="w-full mt-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors text-xs border border-slate-200"
              >
                <Key size={14} /> {t('lva.modal.enterCode')}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-blue-500" size={18} />
                  <h4 className="font-semibold text-slate-900 text-sm">{t('lva.modal.enterCode')}</h4>
                </div>
                <p className="text-slate-500 text-xs mb-3" dangerouslySetInnerHTML={{ __html: t('lva.modal.codeHint') }}></p>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="ABC12"
                  maxLength={5}
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none text-center text-2xl font-mono tracking-[0.4em] text-slate-900 uppercase transition-all duration-300 ${
                    codeError
                      ? 'border-red-400 bg-red-50 animate-shake focus:ring-2 focus:ring-red-400'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  required
                  data-testid="code-input"
                />
                <p className="text-slate-400 text-[10px] mt-2 text-center">{t('lva.modal.codeValid')}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl flex items-center justify-center gap-1 hover:bg-slate-50 text-sm"
                >
                  <ArrowLeft size={16} /> {t('lva.modal.back')}
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 5}
                  data-testid="verify-code-btn"
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl flex items-center justify-center gap-1 text-sm"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t('lva.modal.next')} <ArrowRight size={16} /></>}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div>
              <div className="text-center mb-5">
                <h4 className="font-bold text-lg text-slate-900 mb-1">{t('lva.modal.effort')}</h4>
                <p className="text-slate-500 text-xs">{t('lva.modal.effortScale')}</p>
              </div>

              <div className="flex gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <RatingButton
                    key={value}
                    value={value}
                    selected={effortRating === value}
                    onClick={setEffortRating}
                    label={value === 1 ? t('lva.modal.effortLow') : value === 5 ? t('lva.modal.effortHigh') : null}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl flex items-center justify-center gap-1 hover:bg-slate-50 text-sm"
                >
                  <ArrowLeft size={16} /> {t('lva.modal.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!effortRating}
                  data-testid="next-difficulty-btn"
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl flex items-center justify-center gap-1 text-sm"
                >
                  {t('lva.modal.next')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="text-center mb-5">
                <h4 className="font-bold text-lg text-slate-900 mb-1">{t('lva.modal.difficulty')}</h4>
                <p className="text-slate-500 text-xs">{t('lva.modal.difficultyScale')}</p>
              </div>

              <div className="flex gap-2 mb-5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <RatingButton
                    key={value}
                    value={value}
                    selected={difficultyRating === value}
                    onClick={setDifficultyRating}
                    label={value === 1 ? t('lva.modal.difficultyLow') : value === 5 ? t('lva.modal.difficultyHigh') : null}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl flex items-center justify-center gap-1 hover:bg-slate-50 text-sm"
                >
                  <ArrowLeft size={16} /> {t('lva.modal.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  disabled={!difficultyRating}
                  data-testid="next-overview-btn"
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl flex items-center justify-center gap-1 text-sm"
                >
                  {t('lva.modal.next')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="text-center mb-5">
                <h4 className="font-bold text-lg text-slate-900 mb-1">{t('lva.modal.overview')}</h4>
                <p className="text-slate-500 text-xs">{t('lva.modal.overviewHint')}</p>
                <p className="text-slate-700 text-sm font-semibold mt-2">{t('lva.modal.gradeScale')}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">{t('lva.aufwand')}</span>
                  <span className="text-xl font-bold text-blue-600">{effortRating}<span className="text-slate-400 text-sm font-normal">/5</span></span>
                </div>
                <div className="border-t border-slate-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">{t('lva.schwierigkeit')}</span>
                  <span className="text-xl font-bold text-blue-600">{difficultyRating}<span className="text-slate-400 text-sm font-normal">/5</span></span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl flex items-center justify-center gap-1 hover:bg-slate-50 text-sm"
                >
                  <ArrowLeft size={16} /> {t('lva.modal.back')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={loading}
                  data-testid="submit-rating-btn"
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-xl flex items-center justify-center gap-1 text-sm"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <>{t('lva.modal.submit')} <Send size={16} /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function LVACard({ lva, onRate, rank, variant }) {
  const { t } = useTranslation();
  const hasRatings = lva.rating_count > 0;
  const totalColor = colorMap[lva.total_color] || colorMap.yellow;

  const getRankStyle = () => {
    if (variant === 'hardest') {
      return rank === 1 ? 'bg-red-100 text-red-700' :
             rank === 2 ? 'bg-red-50 text-red-600' :
             rank === 3 ? 'bg-orange-100 text-orange-700' :
             'bg-orange-50 text-orange-600';
    }
    // Default (best)
    return rank === 1 ? 'bg-amber-100 text-amber-700' :
           rank === 2 ? 'bg-slate-100 text-slate-600' :
           rank === 3 ? 'bg-orange-100 text-orange-700' :
           'bg-green-50 text-green-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {rank && (
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${getRankStyle()}`}>
              {rank}
            </span>
          )}
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">{lva.name}</h3>
        </div>
        <button
          onClick={() => onRate(lva)}
          data-testid={`rate-btn-${lva.id}`}
          className="shrink-0 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
        >
          <Star size={12} /> {t('lva.rate')}
        </button>
      </div>

      {hasRatings ? (
        <div className="space-y-3">
          <div className={`${totalColor.bg} ${totalColor.border} border rounded-xl p-4 text-center`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1">{t('lva.gesamt')}</p>
            <p className={`text-lg font-bold ${totalColor.text}`}>{lva.total_text}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className={`${colorMap[lva.effort_color]?.bg || 'bg-slate-50'} ${colorMap[lva.effort_color]?.border || 'border-slate-200'} border rounded-lg p-2.5 text-center`}>
              <p className="text-[9px] font-medium uppercase tracking-wider opacity-60 mb-0.5">{t('lva.aufwand')}</p>
              <p className={`text-xs font-semibold ${colorMap[lva.effort_color]?.text || 'text-slate-600'}`}>{lva.effort_text}</p>
            </div>
            <div className={`${colorMap[lva.difficulty_color]?.bg || 'bg-slate-50'} ${colorMap[lva.difficulty_color]?.border || 'border-slate-200'} border rounded-lg p-2.5 text-center`}>
              <p className="text-[9px] font-medium uppercase tracking-wider opacity-60 mb-0.5">{t('lva.schwierigkeit')}</p>
              <p className={`text-xs font-semibold ${colorMap[lva.difficulty_color]?.text || 'text-slate-600'}`}>{lva.difficulty_text}</p>
            </div>
          </div>

          <p className="text-slate-400 text-[10px] text-right">
            {t(lva.rating_count !== 1 ? 'lva.ratingCount_other' : 'lva.ratingCount_one', { count: lva.rating_count })}
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-xs">{t('lva.noRatingsYet')}</p>
          <p className="text-slate-500 text-[10px] mt-0.5">{t('lva.beFirst')}</p>
        </div>
      )}
    </div>
  );
}

export default function LVA() {
  const { t } = useTranslation();
  const [bestLvas, setBestLvas] = useState([]);
  const [hardestLvas, setHardestLvas] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [totalLvaCount, setTotalLvaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLVA, setSelectedLVA] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [topResponse, statsResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/api/lvas/top`),
          fetch(`${BACKEND_URL}/api/lvas/stats`)
        ]);

        const topData = await topResponse.json();
        const statsData = await statsResponse.json();

        setBestLvas(topData.best || []);
        setHardestLvas(topData.hardest || []);
        setTotalLvaCount(statsData.total || 0);
      } catch (err) {
        console.error('Failed to fetch LVAs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const searchLvas = async () => {
      setSearching(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/lvas?search=${encodeURIComponent(search)}`);
        const data = await response.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Failed to search LVAs:', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchLvas, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleRate = (lva) => {
    setSelectedLVA(lva);
    setShowModal(true);
  };

  const handleRatingSuccess = () => {
    setShowModal(false);
    setSelectedLVA(null);
    window.location.reload();
  };

  const isSearching = search.trim().length > 0;

  return (
    <motion.div variants={pv} initial="initial" animate="animate" exit="exit">
      <section className="pt-28 pb-12 md:pt-40 md:pb-16 px-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div className="absolute top-8 -right-20 md:top-4 md:-right-10 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-blue-50/70 blur-3xl" />
            <div className="absolute -top-20 left-1/3 w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-full bg-gold-500/[0.04] blur-2xl" />
            <div className="absolute bottom-0 -left-10 w-[250px] h-[250px] md:w-[300px] md:h-[300px] rounded-full bg-blue-100/40 blur-3xl" />

            <svg className="absolute top-12 right-[15%] md:top-16 md:right-[20%] w-[120px] h-[120px] md:w-[200px] md:h-[200px] text-blue-500/[0.06]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5">
              <circle cx="100" cy="100" r="80" />
              <circle cx="100" cy="100" r="50" />
              <circle cx="100" cy="100" r="20" />
            </svg>

            <svg className="absolute bottom-8 left-[10%] md:bottom-4 md:left-[15%] w-[80px] h-[80px] md:w-[140px] md:h-[140px] text-gold-500/[0.08]" viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth="0.8">
              <rect x="20" y="20" width="100" height="100" rx="8" transform="rotate(15 70 70)" />
              <rect x="35" y="35" width="70" height="70" rx="4" transform="rotate(15 70 70)" />
            </svg>

            <div className="absolute top-1/3 right-[8%] md:right-[12%] w-[60px] h-[1px] md:w-[100px] bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />
            <div className="absolute top-[55%] left-[5%] md:left-[10%] w-[40px] h-[1px] md:w-[80px] bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />

            <div className="absolute top-20 left-[20%] w-1.5 h-1.5 rounded-full bg-blue-400/20" />
            <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-gold-500/15" />
            <div className="absolute bottom-16 right-[35%] w-1 h-1 rounded-full bg-blue-500/25" />
          </motion.div>
        </div>

        <div className="absolute top-[60%] right-[15%] sm:top-[58%] sm:right-[20%] md:right-[18%] lg:right-[22%] -translate-y-1/2 pointer-events-none z-[1]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-2 h-2 rounded-full bg-gold-500/50" />
            <div className="absolute -bottom-3 -right-3 w-1.5 h-1.5 rounded-full bg-blue-500/40" />
            <div className="absolute top-1/2 -right-6 w-8 h-[1px] bg-gradient-to-r from-blue-500/20 to-transparent" />

            <div className="relative w-[96px] h-[96px] sm:w-[90px] sm:h-[90px] md:w-[110px] md:h-[110px] lg:w-[135px] lg:h-[135px]">
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-slate-200/30" />

              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-[50px] h-[50px] sm:w-[48px] sm:h-[48px] md:w-[58px] md:h-[58px] lg:w-[70px] lg:h-[70px]" viewBox="0 0 80 80" fill="none">
                  <rect x="10" y="14" width="60" height="40" rx="3" fill="#3B82F6" fillOpacity="0.08" stroke="#3B82F6" strokeWidth="1.5" />
                  <rect x="14" y="18" width="52" height="32" rx="1.5" fill="white" fillOpacity="0.5" stroke="#3B82F6" strokeWidth="0.8" />
                  <line x1="22" y1="26" x2="50" y2="26" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
                  <line x1="22" y1="32" x2="44" y2="32" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.35" />
                  <line x1="22" y1="38" x2="38" y2="38" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.25" />
                  <rect x="50" y="30" width="12" height="16" rx="1" fill="#EAB308" fillOpacity="0.15" stroke="#EAB308" strokeWidth="0.8" />
                  <line x1="53" y1="34" x2="59" y2="34" stroke="#EAB308" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.5" />
                  <line x1="53" y1="38" x2="58" y2="38" stroke="#EAB308" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.4" />
                  <line x1="53" y1="42" x2="57" y2="42" stroke="#EAB308" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.3" />
                  <rect x="35" y="54" width="10" height="14" rx="0.5" fill="#64748B" fillOpacity="0.15" />
                  <circle cx="58" cy="18" r="1.5" fill="#EAB308" fillOpacity="0.5" />
                  <circle cx="18" cy="50" r="1" fill="#3B82F6" fillOpacity="0.3" />
                </svg>
              </div>

              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gold-500/80" />
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-1.5 h-1.5 rounded-full bg-blue-400/50" />
            </div>

            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-5 md:h-5 rounded-full border border-dashed border-blue-500/30" />
          </motion.div>
        </div>

        <div className="max-w-[1120px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[3px] rounded-full bg-blue-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('lva.section')}</p>
            </div>
            <h1 data-testid="lva-page-title" className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              {t('lva.title')}
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              {t('lva.desc')}
            </p>
          </motion.div>
        </div>
      </section>

      <Marquee
        items={t('lva.marquee', { returnObjects: true })}
        variant="blue"
        speed={30}
      />

      <section className="px-5 pb-8">
        <div className="max-w-[1120px] mx-auto">
          <RevealOnScroll>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Info className="text-blue-500" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm mb-1">{t('lva.howItWorks')}</h2>
                  <ul className="text-slate-500 text-xs space-y-0.5">
                    <li dangerouslySetInnerHTML={{ __html: t('lva.howStep1') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('lva.howStep2') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('lva.howStep3') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('lva.howStep4') }}></li>
                  </ul>
                  <p className="text-slate-400 text-[10px] mt-2" dangerouslySetInnerHTML={{ __html: t('lva.missingLva') }}></p>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.05}>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('lva.searchPh')}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                  data-testid="lva-search-input"
                />
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="max-w-[1120px] mx-auto">
          {isSearching ? (
            <>
              <RevealOnScroll>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-[3px] rounded-full bg-gold-500" />
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {t('lva.searchResults')}
                  </p>
                  {!searching && (
                    <span className="text-xs text-slate-400">({searchResults.length} {t('lva.found')})</span>
                  )}
                </div>
              </RevealOnScroll>

              {searching ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  </motion.div>
                </div>
              ) : searchResults.length === 0 ? (
                <RevealOnScroll>
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
                    <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-semibold text-slate-700 mb-1">{t('lva.noResults')}</p>
                    <p className="text-slate-500 text-sm">{t('lva.noResultsSub')}</p>
                  </div>
                </RevealOnScroll>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((lva, index) => (
                    <RevealOnScroll key={lva.id} delay={index * 0.03}>
                      <LVACard lva={lva} onRate={handleRate} rank={null} />
                    </RevealOnScroll>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  </motion.div>
                </div>
              ) : (bestLvas.length === 0 && hardestLvas.length === 0) ? (
                <RevealOnScroll>
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
                    <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-semibold text-slate-700 mb-1">{t('lva.noRatings')}</p>
                    <p className="text-slate-500 text-sm">{t('lva.noRatingsSub')}</p>
                  </div>
                </RevealOnScroll>
              ) : (
                <div className="space-y-12">
                  {/* Top 5 Beste LVAs */}
                  {bestLvas.length > 0 && (
                    <div>
                      <RevealOnScroll>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-[3px] rounded-full bg-green-500" />
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            {t('lva.topBest')}
                          </p>
                          {totalLvaCount > 0 && (
                            <span className="text-xs text-slate-400">({totalLvaCount} {t('lva.totalLvas')})</span>
                          )}
                        </div>
                      </RevealOnScroll>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bestLvas.map((lva, index) => (
                          <RevealOnScroll key={lva.id} delay={index * 0.03}>
                            <LVACard lva={lva} onRate={handleRate} rank={index + 1} variant="best" />
                          </RevealOnScroll>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top 5 Schwerste LVAs */}
                  {hardestLvas.length > 0 && (
                    <div>
                      <RevealOnScroll>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-[3px] rounded-full bg-red-500" />
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                            {t('lva.topHardest')}
                          </p>
                        </div>
                      </RevealOnScroll>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hardestLvas.map((lva, index) => (
                          <RevealOnScroll key={lva.id} delay={index * 0.03}>
                            <LVACard lva={lva} onRate={handleRate} rank={index + 1} variant="hardest" />
                          </RevealOnScroll>
                        ))}
                      </div>
                    </div>
                  )}

                  <RevealOnScroll delay={0.3}>
                    <div className="mt-8 text-center">
                      <p className="text-slate-400 text-sm">
                        <TrendingUp size={14} className="inline mr-1" />
                        {t('lva.showingTopFive')}
                      </p>
                    </div>
                  </RevealOnScroll>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showModal && selectedLVA && (
          <RatingModal
            lva={selectedLVA}
            onClose={() => { setShowModal(false); setSelectedLVA(null); }}
            onSuccess={handleRatingSuccess}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}
