
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
  
  // Calculate dynamic opacity
  const mainOpacity = (settings.patternOpacity ?? (isDark ? 15 : 8)) / 100;
  const secOpacity = (settings.secondaryPatternOpacity ?? (isDark ? 20 : 12)) / 100;

  // 1. Define Base Color (The "Grey" part)
  const baseColor = isDark 
    ? `rgba(255,255,255,${mainOpacity})` 
    : `rgba(0,0,0,${mainOpacity})`;

  // 2. Define Accent Color
  const accentColor = hexToRgba(settings.cursorColor || '#daa520', secOpacity);

  // --- SHAPE GENERATION LOGIC ---

  const createShapeSvg = (type: 'dots' | 'squares' | 'triangles', color: string) => {
    // FIX: Do not double encode the color. The outer encodeURIComponent handles it.
    const safeColor = color; 
    let shape = '';
    
    // ViewBox is 24x24. Center is 12,12.
    if (type === 'dots') {
        if (isHollow) {
            shape = `<circle cx='12' cy='12' r='3.5' fill='none' stroke='${safeColor}' stroke-width='1.5' />`;
        } else {
            shape = `<circle cx='12' cy='12' r='1.8' fill='${safeColor}' />`;
        }
    } else if (type === 'squares') {
        if (isHollow) {
            shape = `<rect x='9' y='9' width='6' height='6' fill='none' stroke='${safeColor}' stroke-width='1.5' />`;
        } else {
            shape = `<rect x='10.5' y='10.5' width='3' height='3' fill='${safeColor}' />`;
        }
    } else if (type === 'triangles') {
        if (isHollow) {
            shape = `<polygon points='12,8 16.5,16 7.5,16' fill='none' stroke='${safeColor}' stroke-width='1.5' stroke-linejoin='round' />`;
        } else {
            shape = `<polygon points='12,10 14.5,14 9.5,14' fill='${safeColor}' />`;
        }
    }

    return `data:image/svg+xml,${encodeURIComponent(`<svg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>${shape}</svg>`)}`;
  };

  const createGridSvg = (color: string, strokeWidth: number = 1, style: 'solid' | 'dashed' | 'dotted' = 'solid', size: number = 24) => {
    // FIX: Do not double encode the color.
    const safeColor = color;
    let dashArray = '';
    let strokeLinecap = '';

    if (style === 'dashed') {
        dashArray = `stroke-dasharray='${size/3} ${size/3}'`; 
    } 
    else if (style === 'dotted') {
        dashArray = `stroke-dasharray='1 ${strokeWidth * 3}'`; 
        strokeLinecap = `stroke-linecap='round'`;
    }

    // Path draws Top line and Left line for the cell: ┌
    // The previous bug was mainly due to double-encoding the 'color' string (which contains commas in rgba).
    // Removing the inner encodeURIComponent fixes the visibility issue.
    const svg = `
      <svg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'>
        <path d='M ${size} 0 L 0 0 L 0 ${size}' fill='none' stroke='${safeColor}' stroke-width='${strokeWidth}' ${dashArray} ${strokeLinecap} />
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
  };

  /**
   * Generates a sparse Text SVG Overlay.
   * ViewBox is 384x384.
   */
  const createTextSvg = (text: string) => {
      const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      const baseGrey = '128, 128, 128'; 
      let style = '';

      if (isHollow) {
          // Hollow: Empty Inside, Thin Outline, Low Opacity
          style = `
            font-size: 42px; 
            fill: transparent; 
            stroke: rgba(${baseGrey}, 0.12); 
            stroke-width: 1px;
          `;
      } else {
          // Solid: Small Font, Very Light Fill, No Outline
          style = `
            font-size: 16px; 
            fill: rgba(${baseGrey}, 0.07); 
            stroke: none;
          `;
      }
      
      const svg = `
        <svg width='384' height='384' viewBox='0 0 384 384' xmlns='http://www.w3.org/2000/svg'>
            <style>
                .txt { 
                    font-family: 'Dancing Script', cursive; 
                    font-weight: 700; 
                    ${style}
                }
            </style>
            <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' class='txt' transform='rotate(-15, 192, 192)'>
                ${sanitizedText}
            </text>
        </svg>
      `.trim();
      
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  // --- CSS CONSTRUCTION ---

  let cssRule = '';
  const hasText = settings.enableTextPattern && settings.textPatternValue;
  const textOverlayUrl = hasText ? `url("${createTextSvg(settings.textPatternValue)}"),` : '';

  /**
   * Animation Physics
   */
  const ANIM_DURATION = '240s';
  const TEXT_MOVE_X = '384px';
  const TEXT_MOVE_Y = '384px';
  
  // Standard shape size
  const SHAPE_SIZE = 24;
  const SHAPE_MOVE_X = '1920px'; // 24 * 80
  const SHAPE_MOVE_Y = '1920px';

  // Dynamic Grid size
  const gridSize = settings.gridSize || 32;
  const GRID_MOVE_X = `${gridSize * 80}px`; // ensure loop is smooth
  const GRID_MOVE_Y = `${gridSize * 80}px`;

  if (settings.backgroundEffect === 'grid') {
      const gridSvg = createGridSvg(baseColor, settings.gridStrokeWidth, settings.gridLineStyle, gridSize);
      
      // Grid uses dynamic generated SVG now
      const gridCss = `
          background-image: 
              ${textOverlayUrl}
              url("${gridSvg}");
          background-size: ${hasText ? '384px 384px, ' : ''} ${gridSize}px ${gridSize}px;
          background-position: ${hasText ? 'center center, ' : ''} center top;
        `;
      
      cssRule = `
        .graph-paper {
            background-color: hsl(var(--background));
            will-change: background-position;
            ${gridCss}
        }
      `;
  } else {
      const type = settings.backgroundEffect as 'dots' | 'squares' | 'triangles';
      const shape1 = createShapeSvg(type, baseColor);
      const shape2 = createShapeSvg(type, accentColor);
      
      const patternCss = isDual
      ? `
          background-image: 
              ${textOverlayUrl}
              url("${shape1}"),
              url("${shape2}");
          background-size: ${hasText ? '384px 384px, ' : ''} 24px 24px, 24px 24px;
          background-position: ${hasText ? 'center center, ' : ''} 0 0, 12px 12px;
        `
      : `
          background-image: 
              ${textOverlayUrl}
              url("${shape1}");
          background-size: ${hasText ? '384px 384px, ' : ''} 24px 24px;
          background-position: ${hasText ? 'center center, ' : ''} center top;
        `;

      cssRule = `
        .pattern-bg {
            background-color: hsl(var(--background));
            will-change: background-position;
            ${patternCss}
        }
      `;
  }

  // --- KEYFRAME GENERATION ---
  
  const getToPositions = () => {
      const textPos = `${TEXT_MOVE_X} ${TEXT_MOVE_Y}`;
      
      if (settings.backgroundEffect === 'grid') {
          // Grid only has 1 layer (plus text) currently
          return `${hasText ? textPos + ', ' : ''} ${GRID_MOVE_X} ${GRID_MOVE_Y}`;
      } else {
          // Standard Shapes
          if (isDual) {
              return `${hasText ? textPos + ', ' : ''} ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}, calc(12px + ${SHAPE_MOVE_X}) calc(12px + ${SHAPE_MOVE_Y})`;
          } else {
              return `${hasText ? textPos + ', ' : ''} ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}`;
          }
      }
  };

  const getFromPositions = () => {
      // Must match initial background-positions exactly to prevent jumping
      if (settings.backgroundEffect === 'grid') {
          // Grid
          return `${hasText ? 'center center, ' : ''} center top`;
      } else {
          // Standard Shapes
          if (isDual) return `${hasText ? 'center center, ' : ''} 0 0, 12px 12px`;
          return `${hasText ? 'center center, ' : ''} center top`;
      }
  }

  return (
    <React.Fragment>
        {/* Load Handwritten Font */}
        <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}} />
        
        <style dangerouslySetInnerHTML={{ __html: `
        /* Generated Background CSS */
        ${cssRule}

        /* Animation Logic */
        @keyframes bgScroll {
            from { background-position: ${getFromPositions()}; }
            to { background-position: ${getToPositions()}; }
        }
        
        .animate-grid {
            animation: bgScroll ${ANIM_DURATION} linear infinite;
        }
        `}} />
    </React.Fragment>
  );
};
