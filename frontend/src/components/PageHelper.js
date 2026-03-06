/**
 * ===============================================================================
 *  PAGE HELPER COMPONENT | OeH Wirtschaft Website
 * ===============================================================================
 *
 *  BESCHREIBUNG:
 *  Dekorative Helfer-Figur mit Sprechblase am Seitenrand.
 *  Zeigt Team-Mitglieder mit hilfreichen Hinweisen.
 *
 * -------------------------------------------------------------------------------
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ===============================================================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAsset } from '../hooks/useAsset';

const portraits = {
  maximilian: {
    name: 'Maximilian Pilsner',
    assetKey: 'portrait/maximilian-pilsner',
  },
  lucia: {
    name: 'Lucia Schoisswohl',
    assetKey: 'portrait/lucia-schoisswohl',
  },
  stefan: {
    name: 'Stefan Gstoettenmayr',
    assetKey: 'portrait/stefan-gstoettenmayr',
  },
  theresa: {
    name: 'Theresa Kloibhofer',
    assetKey: 'portrait/theresa-kloibhofer',
  },
  michael: {
    name: 'Michael Tremetzberger',
    assetKey: 'portrait/michael-tremetzberger',
  }
};

export default function PageHelper({
  person = 'maximilian',
  message,
  position = 'right',
}) {
  const portrait = portraits[person] || portraits.maximilian;
  const { src: portraitSrc } = useAsset(portrait.assetKey);
  const isRight = position === 'right';

  return (
    <div className={`absolute ${isRight ? 'right-0 md:right-8 lg:right-16' : 'left-0 md:left-8 lg:left-16'} top-1/2 -translate-y-1/2 pointer-events-none z-0 hidden md:block`}>
      <div className={`flex items-start gap-3 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
        <motion.div
          initial={{ opacity: 0, x: isRight ? 40 : -40 }}
          animate={{ opacity: 0.15, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
          className="relative"
        >
          {portraitSrc && (
            <img
              src={portraitSrc}
              alt=""
              className="w-[280px] lg:w-[350px] xl:w-[420px] h-auto object-contain select-none"
              style={{ filter: 'grayscale(20%)' }}
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className={`relative mt-8 lg:mt-12 pointer-events-auto max-w-[180px] lg:max-w-[220px]`}
        >
          <div className={`relative bg-white rounded-2xl shadow-lg border border-slate-200/80 p-4 ${
            isRight ? 'rounded-tr-sm' : 'rounded-tl-sm'
          }`}>
            <div className={`absolute top-4 ${isRight ? '-right-2' : '-left-2'} w-0 h-0
              ${isRight
                ? 'border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
                : 'border-r-[10px] border-r-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent'
              }`}
            />
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">{portrait.name}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export { portraits };
