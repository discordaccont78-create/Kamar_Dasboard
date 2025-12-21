
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isPersian(text: string): boolean {
  if (!text) return false;
  // Regex range for Arabic/Persian characters
  const persianRegex = /[\u0600-\u06FF]/;
  return persianRegex.test(text);
}

export function getFontClass(fontName: string | undefined): string {
  switch (fontName) {
    case 'Oswald': return 'font-oswald';
    case 'Lato': return 'font-lato';
    case 'Montserrat': return 'font-montserrat';
    case 'DinaRemaster': return 'font-dina';
    case 'PrpggyDotted': return 'font-proggy';
    case 'Inter': 
    default:
      return 'font-inter';
  }
}
