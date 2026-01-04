
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
    const encodedColor = encodeURIComponent(color);
    let shape = '';
    
    // ViewBox is 24x24. Center is 12,12.
    if (type === 'dots') {
        if (isHollow) {
            shape = `<circle cx='12' cy='12' r='3.5' fill='none' stroke='${encodedColor}' stroke-width='1.5' />`;
        } else {
            shape = `<circle cx='12' cy='12' r='1.8' fill='${encodedColor}' />`;
        }
    } else if (type === 'squares') {
        if (isHollow) {
            shape = `<rect x='9' y='9' width='6' height='6' fill='none' stroke='${encodedColor}' stroke-width='1.5' />`;
        } else {
            shape = `<rect x='10.5' y='10.5' width='3' height='3' fill='${encodedColor}' />`;
        }
    } else if (type === 'triangles') {
        if (isHollow) {
            shape = `<polygon points='12,8 16.5,16 7.5,16' fill='none' stroke='${encodedColor}' stroke-width='1.5' stroke-linejoin='round' />`;
        } else {
            shape = `<polygon points='12,10 14.5,14 9.5,14' fill='${encodedColor}' />`;
        }
    }

    return `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E${shape}%3C/svg%3E`;
  };

  /**
   * Generates a sparse Text SVG Overlay.
   * ViewBox is 384x384 (16x the size of the 24px grid).
   * Font: Dancing Script (Handwritten).
   * 
   * Updates:
   * - Significantly reduced opacity.
   * - Smaller font sizes (Volume).
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
   * Animation Physics:
   * Loop Duration: 240s (4 Minutes) -> Extremely slow loop to allow subtle text drift.
   * Direction: Diagonal (Positive X, Positive Y) -> Top-Left to Bottom-Right.
   * 
   * Text Movement: 
   * Moves 1 Tile (384px) in 240s.
   * Speed: 1.6 px/s (Ghostly float)
   * 
   * Grid/Shape Movement:
   * Moves 80 Tiles (24px * 80 = 1920px) in 240s.
   * Speed: 8 px/s (Standard energy)
   * 
   * Ratio: Pattern moves 5x faster than text.
   */
  const ANIM_DURATION = '240s';
  const TEXT_MOVE_X = '384px';
  const TEXT_MOVE_Y = '384px';
  const SHAPE_MOVE_X = '1920px'; 
  const SHAPE_MOVE_Y = '1920px';

  if (settings.backgroundEffect === 'grid') {
      const gridCss = isDual
      ? `
          background-image: 
              ${textOverlayUrl}
              linear-gradient(to right, ${baseColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${baseColor} 1px, transparent 1px),
              linear-gradient(to right, ${accentColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${accentColor} 1px, transparent 1px);
          background-size: ${hasText ? '384px 384px, ' : ''} 24px 24px, 24px 24px, 24px 24px, 24px 24px;
          background-position: ${hasText ? 'center center, ' : ''} 0 0, 0 0, 12px 0, 0 12px;
        `
      : `
          background-image: 
              ${textOverlayUrl}
              linear-gradient(to right, ${baseColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${baseColor} 1px, transparent 1px);
          background-size: ${hasText ? '384px 384px, ' : ''} 24px 24px, 24px 24px;
          background-position: ${hasText ? 'center center, ' : ''} center top, center top;
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
          if (isDual) {
              return `${hasText ? textPos + ', ' : ''} ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}, ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}, calc(12px + ${SHAPE_MOVE_X}) ${SHAPE_MOVE_Y}, ${SHAPE_MOVE_X} calc(12px + ${SHAPE_MOVE_Y})`;
          } else {
              return `${hasText ? textPos + ', ' : ''} ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}, ${SHAPE_MOVE_X} ${SHAPE_MOVE_Y}`;
          }
      } else {
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
          if (isDual) return `${hasText ? 'center center, ' : ''} 0 0, 0 0, 12px 0, 0 12px`;
          return `${hasText ? 'center center, ' : ''} center top, center top`;
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
