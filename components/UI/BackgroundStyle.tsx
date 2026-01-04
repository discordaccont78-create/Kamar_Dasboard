
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
  const isDual = settings.dualColorBackground && settings.backgroundEffect !== 'grid';
  const isHollow = settings.hollowShapes;
  
  // 1. Define Base Color (The "Grey" part)
  const baseColor = isDark 
    ? 'rgba(255,255,255,0.15)' 
    : 'rgba(0,0,0,0.08)';

  // 2. Define Accent Color
  const accentAlpha = isDark ? 0.20 : 0.12;
  const accentColor = hexToRgba(settings.cursorColor || '#daa520', accentAlpha);

  // --- SHAPE GENERATION LOGIC ---

  /**
   * Generates a Data URI SVG for the requested shape.
   * Handles both Filled and Hollow logic.
   * Hollow shapes are sized slightly larger to be visible.
   */
  const createShapeSvg = (type: 'dots' | 'squares' | 'triangles', color: string) => {
    const encodedColor = encodeURIComponent(color);
    let shape = '';
    
    // ViewBox is 24x24. Center is 12,12.
    if (type === 'dots') {
        if (isHollow) {
            // Hollow Circle (Ring)
            shape = `<circle cx='12' cy='12' r='3.5' fill='none' stroke='${encodedColor}' stroke-width='1.5' />`;
        } else {
            // Solid Circle
            shape = `<circle cx='12' cy='12' r='1.8' fill='${encodedColor}' />`;
        }
    } else if (type === 'squares') {
        if (isHollow) {
            // Hollow Square (Box) - Centered
            // Size 6x6, x=9, y=9
            shape = `<rect x='9' y='9' width='6' height='6' fill='none' stroke='${encodedColor}' stroke-width='1.5' />`;
        } else {
            // Solid Square
            // Size 3x3, x=10.5, y=10.5
            shape = `<rect x='10.5' y='10.5' width='3' height='3' fill='${encodedColor}' />`;
        }
    } else if (type === 'triangles') {
        // Triangle Points
        if (isHollow) {
            // Hollow Triangle (Larger)
            // Top: 12,8 | BottomRight: 16,15 | BottomLeft: 8,15
            shape = `<polygon points='12,8 16.5,16 7.5,16' fill='none' stroke='${encodedColor}' stroke-width='1.5' stroke-linejoin='round' />`;
        } else {
            // Solid Triangle
            // Top: 12,10 | BottomRight: 14,13.5 | BottomLeft: 10,13.5
            shape = `<polygon points='12,10 14.5,14 9.5,14' fill='${encodedColor}' />`;
        }
    }

    return `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E${shape}%3C/svg%3E`;
  };

  // --- CSS CONSTRUCTION ---

  let cssRule = '';

  if (settings.backgroundEffect === 'grid') {
      // Grid handles its own logic, ignores shapes/hollow settings
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
      
      cssRule = `
        .graph-paper {
            background-color: hsl(var(--background));
            will-change: background-position;
            ${gridCss}
        }
      `;
  } else {
      // Handle Shape Patterns (Dots, Squares, Triangles)
      const type = settings.backgroundEffect as 'dots' | 'squares' | 'triangles';
      
      const patternCss = isDual
      ? `
          background-image: 
              url("${createShapeSvg(type, baseColor)}"),
              url("${createShapeSvg(type, accentColor)}");
          background-size: 24px 24px;
          background-position: 0 0, 12px 12px;
        `
      : `
          background-image: url("${createShapeSvg(type, baseColor)}");
          background-size: 24px 24px;
          background-position: center top;
        `;

      cssRule = `
        .pattern-bg {
            background-color: hsl(var(--background));
            will-change: background-position;
            ${patternCss}
        }
      `;
  }

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* Generated Background CSS */
      ${cssRule}

      /* Animation Logic (Scrolls the pattern) */
      @keyframes bgScroll {
        from { background-position: 0 0, 12px 12px, 12px 0, 0 12px; }
        to { background-position: 24px 24px, 36px 36px, 36px 24px, 24px 36px; }
      }
      
      .animate-grid {
        animation: bgScroll 3s linear infinite;
      }
    `}} />
  );
};
