/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FOOTER COMPONENT | ÖH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *  
 *  Beschreibung:
 *  Der Footer erscheint am Ende jeder Seite und enthält:
 *  - Logo und Kurzbeschreibung der ÖH Wirtschaft
 *  - Navigationslinks zu allen Seiten
 *  - Kontaktinformationen (E-Mail, Social Media)
 *  - Copyright und Entwickler-Credit
 * 
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von: Raphael Böhmer
 *  Unternehmen:    Astra Capital e.U.
 *  Website:        https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { useAsset } from '../hooks/useAsset';
import { ASSET_KEYS } from '../utils/assets';

// Rechtliche Links für den Footer
const rechtlicheLinks = [
  { labelKey: 'footer.impressum', path: '/impressum' },
  { labelKey: 'footer.datenschutz', path: '/datenschutz' },
];

export default function Footer() {
  const { t } = useTranslation();
  const { src: logoSrc } = useAsset(ASSET_KEYS.LOGO);
  return (
    <footer data-testid="footer" className="bg-slate-900 text-white mt-auto">
      {/* Gradient-Linie oben (Uni-Farben: Blau + Gold) */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-gold-500 to-blue-500" />
      
      <div className="max-w-[1120px] mx-auto px-5 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Linke Spalte: Logo + Beschreibung */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="ÖH Wirtschaft Logo"
                  className="w-12 h-12 object-contain"
                />
              )}
              <div className="leading-none">
                <span className="text-[17px] font-bold">Wirtschaft</span>
                <span className="block text-[11px] text-slate-400 font-medium mt-0.5">ÖH JKU Linz</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {t('footer.desc')}
            </p>
          </div>
          
          {/* Mittlere Spalte: Rechtliches */}
          <div className="md:col-span-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('footer.rechtliches')}</p>
            <div className="flex flex-col gap-2">
              {rechtlicheLinks.map(l => (
                <Link 
                  key={l.path} 
                  to={l.path} 
                  data-testid={`footer-link-${l.path.replace('/', '')}`}
                  className="text-sm text-slate-400 hover:text-gold-500 transition-colors"
                >
                  {t(l.labelKey)}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Rechte Spalte: Kontakt + Social Media */}
          <div className="md:col-span-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('footer.kontakt')}</p>
            <div className="flex flex-col gap-2.5 text-sm text-slate-400">
              <a href="mailto:wirtschaft@oeh.jku.at" data-testid="footer-email" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <Mail size={14}/>wirtschaft@oeh.jku.at
              </a>
              <a href="https://www.instagram.com/oeh_wirtschaft_wipaed/" target="_blank" rel="noopener noreferrer" data-testid="footer-instagram" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <Instagram size={14}/>@oeh_wirtschaft_wipaed
              </a>
              <a href="http://linkedin.com/company/wirtschaft-wipaed" target="_blank" rel="noopener noreferrer" data-testid="footer-linkedin" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <Linkedin size={14}/>LinkedIn
              </a>
              <a href="https://oeh.jku.at/wirtschaft" target="_blank" rel="noopener noreferrer" data-testid="footer-oeh" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                <ExternalLink size={14}/>oeh.jku.at/wirtschaft
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright + Entwickler-Credit */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ÖH Wirtschaft &ndash; JKU Linz &middot; {t('footer.slogan')}
          </span>
          <a 
            href="https://astra-capital.eu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-slate-600 tracking-wide hover:text-slate-400 transition-colors"
          >
            Built by <span className="text-slate-500 font-medium">Astra Capital</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
