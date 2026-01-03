
import React from 'react';
import { useSettingsStore } from '../../lib/store/settings';

// Helper to convert Hex to RGBA with specific opacity
const hexToRgba = (hex: string, alpha: number) => {
  let r = 0, g = 0, b = 0;
  // Handle shorthand #ABC
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } 
  // Handle standard #AABBCC
  else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  return `rgba(${r},${g},${b},${alpha})`;
};

export const BackgroundStyle: React.FC = () => {
  const { settings } = useSettingsStore();
  
  // Base config
  const isDark = settings.theme === 'dark';
  const isDual = settings.dualColorBackground;
  
  // 1. Define Base Color (The "Grey" part)
  // Increased opacity for better visibility (was 0.09/0.05)
  const baseColor = isDark 
    ? 'rgba(255,255,255,0.15)' 
    : 'rgba(0,0,0,0.08)';

  // 2. Define Accent Color (The "Third Color" part)
  // Increased opacity for better visibility (was 0.12/0.08)
  const accentAlpha = isDark ? 0.20 : 0.12;
  const accentColor = hexToRgba(settings.cursorColor || '#daa520', accentAlpha);

  // --- GENERATE CSS PATTERNS ---

  // A. Dot Matrix Logic
  // Single: One radial gradient at 0 0.
  // Dual: Two radial gradients. One at 0 0 (Base), one at 12 12 (Accent).
  const dotsCss = isDual 
    ? `
        background-image: 
            radial-gradient(${baseColor} 1.5px, transparent 1.5px),
            radial-gradient(${accentColor} 1.5px, transparent 1.5px);
        background-size: 24px 24px;
        background-position: 0 0, 12px 12px;
      `
    : `
        background-image: radial-gradient(${baseColor} 1.5px, transparent 1.5px);
        background-size: 24px 24px;
        background-position: center top;
      `;

  // B. Square Matrix Logic (Pixel/Proggy Style)
  // Generating Dynamic SVG for Squares to allow color injection
  // Single: One square at 0,0
  // Dual: Base Square at 0,0. Accent Square at 12,12.
  const createSquareSvg = (color: string) => 
    `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='3' height='3' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;

  const squareCss = isDual
    ? `
        background-image: 
            url("${createSquareSvg(baseColor)}"),
            url("${createSquareSvg(accentColor)}");
        background-size: 24px 24px;
        background-position: 0 0, 12px 12px;
      `
    : `
        background-image: url("${createSquareSvg(baseColor)}");
        background-size: 24px 24px;
        background-position: center top;
      `;

  // C. Grid (Graph Paper) Logic
  // Single: Linear gradients forming a grid.
  // Dual: Base Grid + Accent Grid offset by 12px (Creating a denser, alternating grid).
  const gridCss = isDual
    ? `
        background-image: 
            linear-gradient(to right, ${baseColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${baseColor} 1px, transparent 1px),
            linear-gradient(to right, ${accentColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${accentColor} 1px, transparent 1px);
        background-size: 24px 24px;
        background-position: 0 0, 0 0, 12px 0, 0 12px;
      `
    : `
        background-image: 
            linear-gradient(to right, ${baseColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${baseColor} 1px, transparent 1px);
        background-size: 24px 24px;
        background-position: center top;
      `;

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* Dynamic Background Injection */
      
      .dot-matrix {
        background-color: hsl(var(--background));
        will-change: background-position;
        ${dotsCss}
      }

      .square-matrix {
        background-color: hsl(var(--background));
        will-change: background-position;
        ${squareCss}
      }

      .graph-paper {
        background-color: hsl(var(--background));
        will-change: background-position;
        ${gridCss}
      }

      /* Animation Logic (Scrolls the pattern) */
      @keyframes bgScroll {
        from { background-position: 0 0, 12px 12px, 12px 0, 0 12px; }
        to { background-position: 24px 24px, 36px 36px, 36px 24px, 24px 36px; }
      }
      
      /* Only animate if enabled. The complex background-position requires matching keyframes */
      .animate-grid {
        animation: bgScroll 3s linear infinite;
      }
      
      /* Simplified animation for single layer if needed, but the above covers all generally */
    `}} />
  );
};
