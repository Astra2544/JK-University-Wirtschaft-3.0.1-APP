/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PARTNER MARQUEE COMPONENT | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Animierter Marquee-Banner fuer Partner und Sponsoren.
 *  Logos werden horizontal durchgescrollt mit Hover-Effekten.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function MarqueeBanner({ items, title, direction = 'left' }) {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (items.length === 0) return null;

  const count = items.length;

  const getItemWidth = () => {
    if (count === 1) return 280;
    if (count === 2) return 240;
    if (count <= 4) return 200;
    return 180;
  };

  const getItemGap = () => {
    if (count === 1) return 100;
    if (count === 2) return 80;
    if (count <= 4) return 60;
    return 48;
  };

  const itemWidth = getItemWidth();
  const itemGap = getItemGap();
  const singleSetWidth = count * (itemWidth + itemGap);

  const repetitions = Math.max(2, Math.ceil((containerWidth * 2) / singleSetWidth) + 1);

  const repeatedItems = [];
  for (let i = 0; i < repetitions; i++) {
    repeatedItems.push(...items.map((item, idx) => ({ ...item, _key: `${i}-${idx}` })));
  }

  const getDuration = () => {
    if (count === 1) return 20;
    if (count === 2) return 25;
    if (count <= 4) return 30;
    if (count <= 6) return 40;
    return 50;
  };

  const duration = getDuration();

  const getLogoSize = () => {
    if (count === 1) return { mobile: 48, tablet: 56, desktop: 64 };
    if (count === 2) return { mobile: 40, tablet: 48, desktop: 56 };
    if (count <= 4) return { mobile: 36, tablet: 44, desktop: 52 };
    return { mobile: 32, tablet: 40, desktop: 48 };
  };

  const logoSize = getLogoSize();

  return (
    <div className="py-6 md:py-8">
      <style>
        {`
          @keyframes marquee-scroll-left-${count} {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${singleSetWidth}px); }
          }
          @keyframes marquee-scroll-right-${count} {
            0% { transform: translateX(-${singleSetWidth}px); }
            100% { transform: translateX(0); }
          }
          .marquee-track-${count} {
            display: flex;
            width: max-content;
            will-change: transform;
          }
          .marquee-track-${count}.left {
            animation: marquee-scroll-left-${count} ${duration}s linear infinite;
          }
          .marquee-track-${count}.right {
            animation: marquee-scroll-right-${count} ${duration}s linear infinite;
          }
          .marquee-track-${count}.paused {
            animation-play-state: paused;
          }
          .marquee-item-${count} {
            flex-shrink: 0;
            width: ${itemWidth}px;
            margin-right: ${itemGap}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .marquee-item-inner-${count} {
            position: relative;
            padding: ${count <= 2 ? '16px 24px' : '12px 16px'};
            border-radius: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .marquee-item-${count}:hover .marquee-item-inner-${count} {
            background: white;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.12), 0 8px 16px -8px rgba(0,0,0,0.08);
            transform: scale(1.08) translateY(-4px);
          }
          .marquee-logo-${count} {
            height: ${logoSize.mobile}px;
            max-width: ${itemWidth - 48}px;
            width: auto;
            object-fit: contain;
            opacity: 0.6;
            filter: grayscale(100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          @media (min-width: 768px) {
            .marquee-logo-${count} { height: ${logoSize.tablet}px; }
            .marquee-item-inner-${count} { padding: ${count <= 2 ? '20px 32px' : '16px 24px'}; }
          }
          @media (min-width: 1024px) {
            .marquee-logo-${count} { height: ${logoSize.desktop}px; }
          }
          .marquee-item-${count}:hover .marquee-logo-${count} {
            opacity: 1;
            filter: grayscale(0%);
          }
          .marquee-tooltip-${count} {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: -36px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease, transform 0.25s ease;
            z-index: 30;
          }
          .marquee-item-${count}:hover .marquee-tooltip-${count} {
            opacity: 1;
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 md:mb-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
            {title}
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden pb-12"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 lg:w-40 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 lg:w-40 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-20 pointer-events-none" />

        <div className={`marquee-track-${count} ${direction} ${isPaused ? 'paused' : ''}`}>
          {repeatedItems.map((item) => (
            <a
              key={item._key}
              href={item.website_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`marquee-item-${count}`}
              onClick={(e) => {
                if (!item.website_url) e.preventDefault();
              }}
            >
              <div className={`marquee-item-inner-${count}`}>
                <img
                  src={item.logo_url}
                  alt={item.name}
                  className={`marquee-logo-${count}`}
                  loading="lazy"
                  draggable="false"
                />
                <div className={`marquee-tooltip-${count}`}>
                  <span className="text-sm font-medium text-slate-700 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100">
                    {item.name}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PartnerMarquee() {
  const [partners, setPartners] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/partners`)
      .then(res => res.json())
      .then(data => {
        const all = data || [];
        setPartners(all.filter(p => p.partner_type === 'partner' || !p.partner_type));
        setSponsors(all.filter(p => p.partner_type === 'sponsor'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (partners.length === 0 && sponsors.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {partners.length > 0 && (
        <MarqueeBanner items={partners} title="Unsere Partner" direction="left" />
      )}

      {sponsors.length > 0 && (
        <MarqueeBanner items={sponsors} title="Unsere Sponsoren" direction="right" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <p className="text-center text-xs text-slate-400">
          Gesponserte Inhalte
        </p>
      </div>
    </section>
  );
}
