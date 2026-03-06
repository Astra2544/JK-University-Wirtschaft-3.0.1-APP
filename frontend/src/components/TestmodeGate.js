/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TESTMODE GATE COMPONENT
 *  Passwortschutz fuer Testmodus / Beta-Phase
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  FUNKTION:
 *  Prueft ob die Website im Testmodus ist und verlangt ggf. ein Passwort.
 *  Wenn Testmodus deaktiviert ist, wird die Website normal angezeigt.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useLayoutEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const COOKIE_NAME = 'testmode_verified';

function TestmodeGate({ children }) {
  const [isVerified, setIsVerified] = useState(false);
  const [testmodeEnabled, setTestmodeEnabled] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkComplete, setCheckComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    let isMounted = true;

    const checkTestmode = async () => {
      try {
        const res = await fetch(`${API_URL}/api/testmode/status`);
        const data = await res.json();

        if (!isMounted) return;

        setTestmodeEnabled(data.enabled);

        if (!data.enabled) {
          setIsVerified(true);
        } else {
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${COOKIE_NAME}=`));
          if (cookie && cookie.split('=')[1] === 'true') {
            setIsVerified(true);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setTestmodeEnabled(false);
        setIsVerified(true);
      } finally {
        if (isMounted) {
          setCheckComplete(true);
        }
      }
    };

    checkTestmode();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('password', password);

      const res = await fetch(`${API_URL}/api/testmode/verify`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        document.cookie = `${COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 24 * 7}`;
        setIsVerified(true);
      } else if (res.status === 429) {
        const data = await res.json();
        setError(data.detail || 'Zu viele Versuche. Bitte warte 5 Minuten.');
      } else {
        setError('Falsches Passwort');
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkComplete) {
    return null;
  }

  if (isVerified) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Testmodus</h1>
            <p className="text-slate-400 text-sm">
              Diese Website befindet sich in der Testphase.<br />
              Bitte gib das Passwort ein, um fortzufahren.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wird geprueft...
                </span>
              ) : (
                'Zugang freischalten'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-slate-500 text-xs text-center">
              OeH Wirtschaft JKU - Testversion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestmodeGate;
