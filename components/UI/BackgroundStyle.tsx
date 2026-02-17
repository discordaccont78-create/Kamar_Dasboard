
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
  
  // 3. Primary Color for Scrollbars
  const primaryHex = settings.primaryColor || '#daa520';

  // --- SHAPE GENERATION LOGIC ---

  const createShapeSvg = (type: 'dots' | 'squares' | 'triangles', color: string) => {
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

    const svg = `
      <svg width='${size}' height='${size}' viewBox='0 0 ${size} ${size}' xmlns='http://www.w3.org/2000/svg'>
        <path d='M ${size} 0 L 0 0 L 0 ${size}' fill='none' stroke='${safeColor}' stroke-width='${strokeWidth}' ${dashArray} ${strokeLinecap} />
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
  };

  const createTextSvg = (text: string) => {
      const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      const textColorHex = settings.textPatternColor || "#808080";
      const textOpacityVal = (settings.textPatternOpacity ?? 10) / 100;
      
      const textColorRgba = hexToRgba(textColorHex, textOpacityVal);
      const textOutlineColor = hexToRgba(textColorHex, Math.min(textOpacityVal + 0.1, 1)); 

      let style = '';

      if (isHollow) {
          style = `
            font-size: 42px; 
            fill: transparent; 
            stroke: ${textOutlineColor}; 
            stroke-width: 1px;
          `;
      } else {
          style = `
            font-size: 16px; 
            fill: ${textColorRgba}; 
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
  
  const SHAPE_MOVE_X = '1920px'; 
  const SHAPE_MOVE_Y = '1920px';

  const gridSize = settings.gridSize || 32;
  const GRID_MOVE_X = `${gridSize * 80}px`;
  const GRID_MOVE_Y = `${gridSize * 80}px`;

  if (settings.backgroundEffect === 'none') {
      cssRule = `
        .graph-paper, .pattern-bg {
            background-color: hsl(var(--background));
            background-image: none;
        }
      `;
  } else if (settings.backgroundEffect === 'grid') {
      const gridSvg = createGridSvg(baseColor, settings.gridStrokeWidth, settings.gridLineStyle, gridSize);
      
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

  // --- CUSTOM SCROLLBAR CSS (AGGRESSIVE & THEMED) ---
  const scrollbarCss = `
    /* Force Smooth Scrolling Globally */
    html, body {
        scroll-behavior: smooth !important;
    }

    /* Firefox */
    * {
        scrollbar-width: thin !important;
        scrollbar-color: ${hexToRgba(primaryHex, 0.5)} transparent !important;
    }

    /* Webkit (Chrome, Edge, Safari) - Targeting ALL elements */
    ::-webkit-scrollbar {
        width: 10px !important;
        height: 10px !important;
        background: transparent !important;
    }
    
    ::-webkit-scrollbar-track {
        background: ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'} !important;
        border-left: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important;
    }

    /* Idle State: Sharp, Tech-looking bar */
    ::-webkit-scrollbar-thumb {
        background-color: ${hexToRgba(primaryHex, 0.15)} !important;
        border: 1px solid ${hexToRgba(primaryHex, 0.4)} !important;
        border-radius: 0px !important; /* SHARP EDGES */
        box-shadow: inset 0 0 6px ${hexToRgba(primaryHex, 0.05)} !important;
        backdrop-filter: blur(2px);
    }

    /* Hover State: High intensity, Glow */
    ::-webkit-scrollbar-thumb:hover {
        background-color: ${hexToRgba(primaryHex, 0.8)} !important;
        border: 1px solid ${primaryHex} !important;
        box-shadow: 0 0 15px ${hexToRgba(primaryHex, 0.5)}, inset 0 0 0 1px rgba(255,255,255,0.2) !important;
    }

    /* Active/Click State */
    ::-webkit-scrollbar-thumb:active {
        background-color: ${primaryHex} !important;
        box-shadow: 0 0 20px ${primaryHex} !important;
    }

    ::-webkit-scrollbar-corner {
        background: transparent !important;
    }
  `;

  // --- KEYFRAME GENERATION ---
  
  const getToPositions = () => {
      const textPos = `${TEXT_MOVE_X} ${TEXT_MOVE_Y}`;
      
      if (settings.backgroundEffect === 'grid') {
          return `${hasText ? textPos + ', ' : ''} ${GRID_MOVE_X} ${GRID_MOVE_Y}`;
      } else {
          if (isDual) {
              return `${hasText ? textPos + ', ' : ''} ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}, calc(12px + ${SHAPE_MOVE_X}) calc(12px + ${SHAPE_MOVE_Y})`;
          } else {
              return `${hasText ? textPos + ', ' : ''} ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}`;
          }
      }
  };

  const getFromPositions = () => {
      if (settings.backgroundEffect === 'grid') {
          return `${hasText ? 'center center, ' : ''} center top`;
      } else {
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

        /* Generated Scrollbar CSS */
        ${scrollbarCss}

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
