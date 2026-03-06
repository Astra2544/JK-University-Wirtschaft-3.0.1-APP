/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CUSTOM CURSOR COMPONENT | ÖH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 *  Beschreibung:
 *  Animierter Custom Cursor mit:
 *  - Innerer Punkt (dot) der dem Mauszeiger exakt folgt
 *  - Äußerer Kreis (ring) der mit sanfter Verzögerung folgt
 *  - Interaktive Effekte bei Buttons, Links und klickbaren Elementen
 *  - Passende Farben im ÖH Wirtschaft Design (Blau/Gold)
 * 
 * ───────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// Konfiguration für den Cursor - Clean & Smooth
const CURSOR_CONFIG = {
  dot: {
    size: 6,           // Normale Größe des inneren Punktes (kleiner)
    hoverSize: 8,      // Größe bei Hover auf interaktiven Elementen
    clickSize: 4,      // Größe beim Klicken
  },
  ring: {
    size: 32,          // Normale Größe des äußeren Rings (kleiner)
    hoverSize: 48,     // Größe bei Hover (subtiler)
    clickSize: 28,     // Größe beim Klicken
    borderWidth: 1.5,  // Dünnerer Rand für eleganteres Aussehen
  },
  spring: {
    // Sehr sanfte, smooth Bewegung für den Punkt
    dot: { damping: 30, stiffness: 400, mass: 0.5 },
    // Elegante, langsame Verfolgung für den Ring
    ring: { damping: 40, stiffness: 120, mass: 1 },
  }
};

// Selektoren für interaktive Elemente
const INTERACTIVE_SELECTORS = [
  'a', 'button', 'input', 'textarea', 'select',
  '[role="button"]', '[data-cursor-hover]',
  '.cursor-hover', '[onclick]'
];

export function CustomCursor() {
  // State für Cursor-Zustände
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorVariant, setCursorVariant] = useState('default'); // default, link, button, input

  // Motion Values für Position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Springs für sanfte Bewegung
  const dotX = useSpring(cursorX, CURSOR_CONFIG.spring.dot);
  const dotY = useSpring(cursorY, CURSOR_CONFIG.spring.dot);
  const ringX = useSpring(cursorX, CURSOR_CONFIG.spring.ring);
  const ringY = useSpring(cursorY, CURSOR_CONFIG.spring.ring);

  // Mausbewegung verfolgen
  const handleMouseMove = useCallback((e) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    if (!isVisible) setIsVisible(true);
  }, [cursorX, cursorY, isVisible]);

  // Prüfen ob Element interaktiv ist
  const checkInteractive = useCallback((element) => {
    if (!element) return { isInteractive: false, type: 'default' };
    
    const isCursorHover = element.closest('[data-cursor-hover], .cursor-hover');
    const isInput = element.closest('input, textarea, select');
    const isButton = element.closest('button, [role="button"]');
    const isLink = element.closest('a');
    
    // Prüfen ob Link wie ein Button aussieht (hat Button-Styling)
    const isButtonStyleLink = isLink && (
      isLink.classList.contains('bg-blue-500') ||
      isLink.classList.contains('bg-gold-500') ||
      isLink.classList.contains('rounded-full') ||
      isLink.getAttribute('data-testid')?.includes('cta') ||
      isLink.getAttribute('data-testid')?.includes('btn')
    );
    
    if (isCursorHover) return { isInteractive: true, type: 'hover' };
    if (isInput) return { isInteractive: true, type: 'input' };
    if (isButton || isButtonStyleLink) return { isInteractive: true, type: 'button' };
    if (isLink) return { isInteractive: true, type: 'link' };
    
    return { isInteractive: false, type: 'default' };
  }, []);

  // Mouse over Handler
  const handleMouseOver = useCallback((e) => {
    const { isInteractive, type } = checkInteractive(e.target);
    setIsHovering(isInteractive);
    setCursorVariant(type);
  }, [checkInteractive]);

  // Mouse out Handler
  const handleMouseOut = useCallback(() => {
    setIsHovering(false);
    setCursorVariant('default');
  }, []);

  // Klick-Handler
  const handleMouseDown = useCallback(() => setIsClicking(true), []);
  const handleMouseUp = useCallback(() => setIsClicking(false), []);

  // Cursor verstecken wenn außerhalb des Fensters
  const handleMouseLeave = useCallback(() => setIsVisible(false), []);
  const handleMouseEnter = useCallback(() => setIsVisible(true), []);

  // Event Listeners registrieren
  useEffect(() => {
    // Touch-Geräte erkennen und Cursor ausblenden
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // CSS hinzufügen um Standard-Cursor zu verstecken
    document.body.style.cursor = 'none';
    
    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.style.cursor = 'auto';
    };
  }, [handleMouseMove, handleMouseOver, handleMouseOut, handleMouseDown, handleMouseUp, handleMouseLeave, handleMouseEnter]);

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'custom-cursor-style';
    style.textContent = `
      a, button, input, textarea, select, [role="button"], [data-cursor-hover], .cursor-hover {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('custom-cursor-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Touch-Geräte: Cursor nicht anzeigen
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  // Aktuelle Größen basierend auf State
  const dotSize = isClicking 
    ? CURSOR_CONFIG.dot.clickSize 
    : isHovering 
      ? CURSOR_CONFIG.dot.hoverSize 
      : CURSOR_CONFIG.dot.size;

  const ringSize = isClicking 
    ? CURSOR_CONFIG.ring.clickSize 
    : isHovering 
      ? CURSOR_CONFIG.ring.hoverSize 
      : CURSOR_CONFIG.ring.size;

  // Farben basierend auf Variante
  const getColors = () => {
    switch (cursorVariant) {
      case 'link':
        return {
          dot: '#0294cb',      // Blau
          ring: '#0294cb',
          ringBg: 'rgba(2, 148, 203, 0.1)',
        };
      case 'button':
        return {
          dot: '#f3aa1f',      // Gold
          ring: '#f3aa1f',
          ringBg: 'rgba(243, 170, 31, 0.1)',
        };
      case 'input':
        return {
          dot: '#0294cb',
          ring: '#0294cb',
          ringBg: 'rgba(2, 148, 203, 0.05)',
        };
      default:
        return {
          dot: '#0f172a',      // Slate 900
          ring: '#0294cb',     // Blau
          ringBg: 'transparent',
        };
    }
  };

  const colors = getColors();

  return (
    <>
      {/* Innerer Punkt - folgt dem Cursor mit minimaler Verzögerung */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10001] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: dotSize,
          height: dotSize,
          backgroundColor: colors.dot,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          width: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
          height: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
          backgroundColor: { duration: 0.4, ease: 'easeOut' },
          opacity: { duration: 0.2 },
        }}
      />

      {/* Äußerer Ring - folgt elegant mit sanfter Verzögerung */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10000] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          borderWidth: CURSOR_CONFIG.ring.borderWidth,
          borderStyle: 'solid',
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          borderColor: colors.ring,
          backgroundColor: colors.ringBg,
          opacity: isVisible ? 0.8 : 0,
          scale: isClicking ? 0.9 : 1,
        }}
        transition={{
          width: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
          height: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
          borderColor: { duration: 0.5, ease: 'easeOut' },
          backgroundColor: { duration: 0.5, ease: 'easeOut' },
          opacity: { duration: 0.3 },
          scale: { duration: 0.2, ease: 'easeOut' },
        }}
      />
    </>
  );
}

export default CustomCursor;
