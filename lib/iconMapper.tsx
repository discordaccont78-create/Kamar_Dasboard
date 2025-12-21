
import React from 'react';
import { 
  Lightbulb, Zap, Fan, Tv, Monitor, Lock, Unlock, Thermometer, 
  Droplets, Wifi, Activity, ChefHat, BedDouble, Armchair, Bath, 
  Trees, Car, Briefcase, Gamepad2, Speaker, Radio, Camera, 
  DoorOpen, Layers, Cpu, Server, Router, Phone, Box, Settings,
  Utensils, Refrigerator, WashingMachine, Warehouse
} from 'lucide-react';

/**
 * Intelligent Icon Mapper
 * Selects the most appropriate icon based on the provided name string.
 * Supports both English and Persian keywords.
 */
export const getIconForName = (name: string, defaultType: 'group' | 'device' = 'device') => {
  if (!name) return defaultType === 'group' ? Layers : Cpu;
  
  const lowerName = name.toLowerCase();

  // --- Mappings (Priority Order) ---

  // 1. Kitchen / Cooking
  if (match(lowerName, ['kitchen', 'cook', 'oven', 'stove', 'آشپزخانه', 'غذا', 'اجاق'])) return ChefHat;
  if (match(lowerName, ['fridge', 'refrigerator', 'یخچال'])) return Refrigerator;
  if (match(lowerName, ['wash', 'laundry', 'لباسشویی', 'ظرفشویی'])) return WashingMachine;
  if (match(lowerName, ['dining', 'food', 'ناهار', 'شام'])) return Utensils;

  // 2. Living Room / Relax
  if (match(lowerName, ['living', 'sofa', 'lounge', 'hall', 'پذیرایی', 'هال', 'نشیمن', 'مبل'])) return Armchair;
  if (match(lowerName, ['tv', 'television', 'netflix', 'تلویزیون', 'تی وی'])) return Tv;
  if (match(lowerName, ['speaker', 'sound', 'music', 'audio', 'باند', 'اسپیکر', 'صوت'])) return Speaker;
  if (match(lowerName, ['radio', 'رادیو'])) return Radio;
  if (match(lowerName, ['game', 'ps5', 'xbox', 'playstation', 'کنسول', 'بازی'])) return Gamepad2;

  // 3. Bedroom
  if (match(lowerName, ['bed', 'sleep', 'rest', 'خواب', 'تخت'])) return BedDouble;

  // 4. Bathroom / Water
  if (match(lowerName, ['bath', 'toilet', 'wc', 'shower', 'restroom', 'حمام', 'دستشویی', 'توالت', 'دوش'])) return Bath;
  if (match(lowerName, ['water', 'pump', 'pool', 'آب', 'پمپ', 'استخر'])) return Droplets;

  // 5. Outdoors / Garage
  if (match(lowerName, ['garden', 'yard', 'patio', 'flower', 'plant', 'باغ', 'حیاط', 'گلخانه', 'درخت'])) return Trees;
  if (match(lowerName, ['garage', 'car', 'gate', 'parking', 'پارکینگ', 'گاراژ', 'ماشین', 'خودرو'])) return Car;
  if (match(lowerName, ['warehouse', 'store', 'storage', 'انبار', 'سوله'])) return Warehouse;

  // 6. Office / Work
  if (match(lowerName, ['office', 'work', 'desk', 'study', 'دفتر', 'کار', 'میز', 'اداره'])) return Briefcase;
  if (match(lowerName, ['pc', 'computer', 'mac', 'server', 'کامپیوتر', 'رایانه', 'سرور'])) return Monitor;
  if (match(lowerName, ['printer', 'print', 'پرینتر', 'چاپگر'])) return Box;

  // 7. Lighting (Generic)
  if (match(lowerName, ['light', 'lamp', 'led', 'bulb', 'dimmer', 'chandelier', 'lampe', 'روشنایی', 'لامپ', 'لوستر', 'مهتابی', 'چراغ'])) return Lightbulb;

  // 8. Climate / HVAC
  if (match(lowerName, ['fan', 'cool', 'wind', 'ventilator', 'پنکه', 'فن', 'تهویه'])) return Fan;
  if (match(lowerName, ['temp', 'heat', 'thermo', 'boiler', 'ac', 'air', 'condition', 'دما', 'حرارت', 'پکیج', 'کولر', 'بخاری', 'شوفاژ'])) return Thermometer;

  // 9. Security / Entry
  if (match(lowerName, ['door', 'entry', 'exit', 'در', 'درب', 'ورودی', 'خروجی'])) return DoorOpen;
  if (match(lowerName, ['lock', 'secure', 'safe', 'قفل', 'گاوصندوق'])) return Lock;
  if (match(lowerName, ['cam', 'camera', 'cctv', 'video', 'دوربین', 'نظارت'])) return Camera;

  // 10. Generic Electronics
  if (match(lowerName, ['wifi', 'net', 'router', 'modem', 'اینترنت', 'مودم', 'وای فای'])) return Router;
  if (match(lowerName, ['phone', 'mobile', 'cell', 'گوشی', 'موبایل', 'تلفن'])) return Phone;
  if (match(lowerName, ['power', 'outlet', 'plug', 'socket', 'switch', 'relay', 'برق', 'پریز', 'سوئیچ', 'رله'])) return Zap;
  if (match(lowerName, ['sensor', 'motion', 'pir', 'detect', 'سنسور', 'حسگر'])) return Activity;

  // Defaults based on type
  return defaultType === 'group' ? Layers : Cpu;
};

// Helper function to check if any keyword exists in the string
const match = (source: string, keywords: string[]) => {
  return keywords.some(keyword => source.includes(keyword));
};
