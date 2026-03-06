/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  OEHLI CHAT COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Intelligenter Chatbot-Assistent fuer Studierende.
 *  Beantwortet Fragen zu Studium, LVAs, Services und mehr.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Maximize2, Minimize2, ChevronRight, MessageCircle } from 'lucide-react';
import { findResponse, getQuickActions, getGreeting } from './OEHliMatcher';
import { useAsset } from '../../hooks/useAsset';
import { ASSET_KEYS } from '../../utils/assets';

const TYPING_MIN_DELAY = 800;
const TYPING_MAX_DELAY = 6000;
const CHARS_PER_SECOND = 40;
const API_URL = process.env.REACT_APP_BACKEND_URL;

function calcTypingDelay(text) {
  const charDelay = (text.length / CHARS_PER_SECOND) * 1000;
  return Math.min(Math.max(charDelay, TYPING_MIN_DELAY), TYPING_MAX_DELAY);
}

function MessageBubble({ message, onButtonClick, oehliLogoSrc }) {
  const isBot = message.sender === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div className={`max-w-[85%] ${isBot ? 'order-2' : ''}`}>
        {isBot && (
          <div className="flex items-center gap-1.5 mb-1">
            {oehliLogoSrc && <img src={oehliLogoSrc} alt="ÖHli" className="w-8 h-8 object-contain flex-shrink-0" />}
            <span className="text-[11px] font-medium text-slate-400">ÖHli</span>
          </div>
        )}
        <div
          className={`px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
            isBot
              ? 'bg-slate-50 text-slate-700 rounded-2xl rounded-tl-md border border-slate-100'
              : 'bg-blue-500 text-white rounded-2xl rounded-tr-md'
          }`}
        >
          {message.text}
        </div>
        {isBot && message.buttons && message.buttons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.buttons.map((btn, i) => (
              <button
                key={i}
                onClick={() => onButtonClick(btn)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full hover:bg-blue-100 hover:border-blue-200 transition-all duration-200"
              >
                {btn.link && <ChevronRight className="w-3 h-3" />}
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator({ oehliLogoSrc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex justify-start mb-3"
    >
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          {oehliLogoSrc && <img src={oehliLogoSrc} alt="ÖHli" className="w-8 h-8 object-contain flex-shrink-0" />}
          <span className="text-[11px] font-medium text-slate-400">ÖHli tippt...</span>
        </div>
        <div className="px-4 py-3 bg-slate-50 rounded-2xl rounded-tl-md border border-slate-100 inline-flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-slate-300 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function OEHliChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [oehliEnabled, setOehliEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { src: oehliLogoSrc } = useAsset(ASSET_KEYS.OEHLI_LOGO);

  const hiddenRoutes = ['/admin', '/login'];
  const isHidden = hiddenRoutes.some((r) => location.pathname.startsWith(r));

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/site-settings`);
        if (res.ok) {
          const data = await res.json();
          setOehliEnabled(data.oehli_enabled);
        }
      } catch (err) {
        console.error('Failed to load site settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const addBotMessage = useCallback((text, buttons = []) => {
    setIsTyping(true);
    const delay = calcTypingDelay(text);

    typingTimeoutRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'bot', text, buttons }]);
      setIsTyping(false);
    }, delay);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (!hasGreeted) {
      setHasGreeted(true);
      const greeting = getGreeting();
      setTimeout(() => addBotMessage(greeting.text, greeting.buttons), 400);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text }]);
    setInputValue('');

    const result = findResponse(text);
    if (result) {
      addBotMessage(result.text, result.buttons);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleButtonClick = (btn) => {
    if (isTyping) return;

    if (btn.link) {
      navigate(btn.link);
      handleClose();
      return;
    }

    if (btn.query) {
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: btn.label }]);
      const result = findResponse(btn.query);
      if (result) {
        addBotMessage(result.text, result.buttons);
      }
    }
  };

  const handleQuickAction = (action) => {
    if (isTyping) return;
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: action.label }]);
    const result = findResponse(action.query);
    if (result) {
      addBotMessage(result.text, result.buttons);
    }
  };

  useEffect(() => {
    if (!isOpen && !hasGreeted) {
      const timer = setTimeout(() => setUnreadCount(1), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasGreeted]);

  if (isHidden) return null;
  if (!settingsLoaded) return null;
  if (!oehliEnabled) return null;

  const quickActions = getQuickActions();
  const showQuickActions = messages.length <= 1 && !isTyping;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={`fixed z-[9999] flex flex-col bg-white shadow-2xl border border-slate-200/80 overflow-hidden
              ${isExpanded
                ? 'bottom-0 right-0 sm:bottom-4 sm:right-4 w-full h-full sm:w-[520px] sm:h-[680px] rounded-none sm:rounded-2xl'
                : 'bottom-20 right-4 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(520px,calc(100vh-7rem))] rounded-2xl'
              }`}
            style={{ maxHeight: isExpanded ? undefined : 'calc(100vh - 7rem)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {oehliLogoSrc && <img src={oehliLogoSrc} alt="ÖHli" className="w-10 h-10 object-contain" />}
                <div>
                  <h3 className="text-white font-semibold text-sm leading-none">ÖHli</h3>
                  <p className="text-blue-100 text-[10px] mt-0.5">Dein Studien-Assistent</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title={isExpanded ? 'Verkleinern' : 'Vergrößern'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 oehli-scrollbar">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onButtonClick={handleButtonClick} oehliLogoSrc={oehliLogoSrc} />
              ))}
              <AnimatePresence>{isTyping && <TypingIndicator oehliLogoSrc={oehliLogoSrc} />}</AnimatePresence>

              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.3 }}
                  className="mt-2"
                >
                  <p className="text-[11px] text-slate-400 mb-2 font-medium">Beliebte Themen:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        className="px-3 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-150 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 px-3 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-1.5 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Schreib mir eine Nachricht..."
                  disabled={isTyping}
                  className="flex-1 text-[13px] text-slate-700 placeholder-slate-400 bg-transparent outline-none py-1.5 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-blue-500 transition-all duration-200 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-center text-[9px] text-slate-300 mt-1.5">
                ÖHli kennt die Website und allgemeine JKU-Infos
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleOpen}
            className="fixed bottom-5 right-5 z-[9999] group"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm"
                  >
                    {unreadCount}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2 }}
              className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-white rounded-xl shadow-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-600 font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Brauchst du Hilfe? Frag ÖHli!
              <div className="absolute top-full right-5 w-2 h-2 bg-white border-r border-b border-slate-200 transform rotate-45 -translate-y-1" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
