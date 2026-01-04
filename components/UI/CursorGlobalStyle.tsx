
import React from 'react';
import { useSettingsStore } from '../../lib/store/settings';
import { useCursorStore } from '../../lib/store/cursorStore';

export const CursorGlobalStyle: React.FC = () => {
  const { settings } = useSettingsStore();
  const { isCharged } = useCursorStore();
  
  // Normal Color
  const baseColor = encodeURIComponent(settings.cursorColor || '#daa520'); 
  
  // Charged Color (Electric White/Blue)
  const chargedFill = encodeURIComponent('#ffffff');
  const chargedStroke = encodeURIComponent('#00bfff'); // Deep Sky Blue glow

  // Dynamic Color Selection
  const fillColor = isCharged ? chargedFill : baseColor;
  const strokeColor = isCharged ? chargedStroke : 'white';
  const strokeWidth = isCharged ? '2' : '1.5';

  // --- SVG DEFINITIONS (Tech/Industrial Style) ---
  
  // 1. Default Arrow (Sharp, Tech)
  const defaultCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M2 2L11 20L14 12L22 9L2 2Z' fill='${fillColor}' stroke='${strokeColor}' stroke-width='${strokeWidth}' stroke-linejoin='round'/></svg>`;

  // 2. Pointer (Hand/Interact) - A target reticle style
  const pointerCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='12' r='4' stroke='${strokeColor}' stroke-width='${isCharged ? 2.5 : 2}'/><circle cx='12' cy='12' r='2' fill='${fillColor}'/><path d='M12 2V6 M12 18V22 M2 12H6 M18 12H22' stroke='${fillColor}' stroke-width='1.5'/></svg>`;

  // 3. Text (I-Beam) - Brackets style
  const textCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 4H9 M5 20H9 M15 4H19 M15 20H19 M12 4V20' stroke='${fillColor}' stroke-width='2'/></svg>`;

  // 4. Wait / Progress (Hourglass)
  const waitCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M6 2H18L18 6L12 12L6 6L6 2Z' fill='${fillColor}'/><path d='M6 22H18L18 18L12 12L6 18L6 22Z' stroke='${fillColor}' stroke-width='2'/></svg>`;

  // 5. Move / All-Scroll (4-way arrow)
  const moveCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 2L15 6H9L12 2Z' fill='${fillColor}'/><path d='M12 22L15 18H9L12 22Z' fill='${fillColor}'/><path d='M2 12L6 9V15L2 12Z' fill='${fillColor}'/><path d='M22 12L18 9V15L22 12Z' fill='${fillColor}'/><path d='M12 6V18 M6 12H18' stroke='${fillColor}' stroke-width='1.5'/></svg>`;

  // 6. Crosshair
  const crosshairCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 2V22 M2 12H22' stroke='${fillColor}' stroke-width='1'/><rect x='10' y='10' width='4' height='4' stroke='${fillColor}'/></svg>`;

  // 7. Not Allowed / No Drop
  const notAllowedCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='12' r='8' stroke='${fillColor}' stroke-width='2'/><path d='M6 18L18 6' stroke='${fillColor}' stroke-width='2'/></svg>`;

  // 8. Grab (Open Hand)
  const grabCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 2C12 2 8 6 8 11V16C8 16 8 21 12 21C16 21 16 16 16 16V11C16 6 12 2 12 2Z' stroke='${fillColor}' stroke-width='2'/><path d='M8 11H16' stroke='${fillColor}'/></svg>`;
  
  // 9. Grabbing (Closed Hand)
  const grabbingCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><rect x='8' y='8' width='8' height='10' rx='2' fill='${fillColor}'/></svg>`;

  // 10. Resizing (Horizontal)
  const ewResize = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M2 12L6 8V16L2 12Z' fill='${fillColor}'/><path d='M22 12L18 8V16L22 12Z' fill='${fillColor}'/><line x1='6' y1='12' x2='18' y2='12' stroke='${fillColor}' stroke-width='2'/></svg>`;

  // 11. Resizing (Vertical)
  const nsResize = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 2L16 6H8L12 2Z' fill='${fillColor}'/><path d='M12 22L16 18H8L12 22Z' fill='${fillColor}'/><line x1='12' y1='6' x2='12' y2='18' stroke='${fillColor}' stroke-width='2'/></svg>`;

  // 12. Resizing (Diagonal 1 - NWSE)
  const nwseResize = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4 4L10 4L4 10L4 4Z' fill='${fillColor}'/><path d='M20 20L14 20L20 14L20 20Z' fill='${fillColor}'/><line x1='8' y1='8' x2='16' y2='16' stroke='${fillColor}' stroke-width='2'/></svg>`;

  // 13. Resizing (Diagonal 2 - NESW)
  const neswResize = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 4L14 4L20 10L20 4Z' fill='${fillColor}'/><path d='M4 20L10 20L4 14L4 20Z' fill='${fillColor}'/><line x1='16' y1='8' x2='8' y2='16' stroke='${fillColor}' stroke-width='2'/></svg>`;
  
  // 14. Zoom
  const zoomCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='10' cy='10' r='6' stroke='${fillColor}' stroke-width='2'/><path d='M15 15L20 20' stroke='${fillColor}' stroke-width='2'/><path d='M10 7V13 M7 10H13' stroke='${fillColor}' stroke-width='1'/></svg>`;

  const helpCursor = `data:image/svg+xml;utf8,<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='12' r='8' stroke='${fillColor}' stroke-width='1.5'/><text x='12' y='16' font-size='12' font-family='monospace' fill='${fillColor}' text-anchor='middle' font-weight='bold'>?</text></svg>`;


  return (
    <style dangerouslySetInnerHTML={{ __html: `
      /* Default & Base States */
      html, body, .default, .auto, .initial, .inherit {
        cursor: url("${defaultCursor}") 2 2, auto !important;
      }

      /* Pointers & Links */
      a, button, [role="button"], .pointer, .context-menu, select, input[type="checkbox"], input[type="radio"] {
        cursor: url("${pointerCursor}") 12 12, pointer !important;
      }

      /* Text Input */
      input[type="text"], input[type="number"], input[type="password"], textarea, .text, .vertical-text {
        cursor: url("${textCursor}") 12 12, text !important;
      }

      /* Movement */
      .move, .all-scroll {
        cursor: url("${moveCursor}") 12 12, move !important;
      }

      /* Wait / Progress */
      .wait, .progress {
        cursor: url("${waitCursor}") 12 12, wait !important;
      }

      /* Precision */
      .crosshair, .cell {
        cursor: url("${crosshairCursor}") 12 12, crosshair !important;
      }

      /* Blocking */
      .not-allowed, .no-drop, .none {
        cursor: url("${notAllowedCursor}") 12 12, not-allowed !important;
      }

      /* Dragging */
      .grab, .alias, .copy {
        cursor: url("${grabCursor}") 12 12, grab !important;
      }
      .grabbing {
        cursor: url("${grabbingCursor}") 12 12, grabbing !important;
      }

      /* Resizing - Horizontal */
      .ew-resize, .w-resize, .e-resize, .col-resize {
        cursor: url("${ewResize}") 12 12, ew-resize !important;
      }

      /* Resizing - Vertical */
      .ns-resize, .n-resize, .s-resize, .row-resize {
        cursor: url("${nsResize}") 12 12, ns-resize !important;
      }

      /* Resizing - Diagonal NWSE */
      .nwse-resize, .nw-resize, .se-resize {
        cursor: url("${nwseResize}") 12 12, nwse-resize !important;
      }

      /* Resizing - Diagonal NESW */
      .nesw-resize, .ne-resize, .sw-resize {
        cursor: url("${neswResize}") 12 12, nesw-resize !important;
      }

      /* Zoom & Help */
      .zoom-in, .zoom-out {
        cursor: url("${zoomCursor}") 10 10, zoom-in !important;
      }
      .help {
        cursor: url("${helpCursor}") 12 12, help !important;
      }

    `}} />
  );
};
