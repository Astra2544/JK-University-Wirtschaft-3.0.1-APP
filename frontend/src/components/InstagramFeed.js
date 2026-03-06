/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  INSTAGRAM FEED COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Eingebetteter Instagram Feed via EmbedSocial Widget.
 *  Zeigt die neuesten Posts des OeH Wirtschaft Instagram Accounts.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Instagram, ExternalLink } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EMBEDSOCIAL_REF = 'a9db327a2fe2e814a251e2fddb9719f2fc984c28';

export default function InstagramFeed() {
  const [settings, setSettings] = useState({ instagram_username: '' });
  const [loading, setLoading] = useState(true);
  const embedRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/misc-settings`)
      .then(res => res.json())
      .then(data => {
        setSettings({
          instagram_username: data.instagram_username || 'oeh_wirtschaft_wipaed'
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const initEmbed = useCallback(() => {
    if (!embedRef.current) return;

    const container = embedRef.current;
    container.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'embedsocial-hashtag';
    widget.setAttribute('data-ref', EMBEDSOCIAL_REF);

    const link = document.createElement('a');
    link.className = 'feed-powered-by-es feed-powered-by-es-feed-img es-widget-branding';
    link.href = 'https://embedsocial.com/social-media-aggregator/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Instagram widget';

    const img = document.createElement('img');
    img.src = 'https://embedsocial.com/cdn/icon/embedsocial-logo.webp';
    img.alt = 'EmbedSocial';
    link.appendChild(img);

    const text = document.createElement('div');
    text.className = 'es-widget-branding-text';
    text.textContent = 'Instagram widget';
    link.appendChild(text);

    widget.appendChild(link);
    container.appendChild(widget);

    const oldScript = document.getElementById('EmbedSocialHashtagScript');
    if (oldScript) {
      oldScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'EmbedSocialHashtagScript';
    script.src = 'https://embedsocial.com/cdn/ht.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (loading) return;
    initEmbed();
  }, [loading, initEmbed]);

  if (loading) {
    return (
      <div data-testid="instagram-feed" className="w-full">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const username = settings.instagram_username || 'oeh_wirtschaft_wipaed';

  return (
    <div data-testid="instagram-feed" className="w-full">
      <div className="relative rounded-xl overflow-hidden bg-white" ref={embedRef} />
      <a
        href={`https://www.instagram.com/${username}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-pink-50 via-red-50 to-yellow-50 rounded-xl border border-slate-100 hover:border-pink-200 hover:shadow-md transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shrink-0">
          <Instagram className="text-white" size={16} />
        </div>
        <span className="text-sm font-medium text-slate-700 group-hover:text-pink-600 transition-colors">
          @{username}
        </span>
        <ExternalLink size={14} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
      </a>
    </div>
  );
}
