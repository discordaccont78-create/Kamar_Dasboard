
import React from 'react';
import { 
  Lightbulb, Zap, Fan, Tv, Monitor, Lock, Unlock, Thermometer, 
  Droplets, Wifi, Activity, ChefHat, BedDouble, Armchair, Bath, 
  Trees, Car, Briefcase, Gamepad2, Speaker, Radio, Camera, 
  DoorOpen, Layers, Cpu, Server, Router, Phone, Box, Settings,
  Utensils, Refrigerator, WashingMachine, Warehouse, Coffee, 
  LayoutTemplate, Flame, Music, MonitorSmartphone, Grid3X3
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

  // 0. Displays / Screens (Explicit Types)
  if (match(lowerName, ['oled', 'screen', 'monitor', 'display', 'نمایشگر', 'اولد'])) return MonitorSmartphone;
  if (match(lowerName, ['lcd', 'character', 'text', 'ال سی دی'])) return Grid3X3;

  // 1. Kitchen / Cooking / Appliances
  if (match(lowerName, ['coffee', 'espresso', 'maker', 'barista', 'قهوه', 'اسپرسو', 'چای', 'نوشیدنی'])) return Coffee;
  if (match(lowerName, ['kitchen', 'cook', 'oven', 'stove', 'آشپزخانه', 'غذا', 'اجاق', 'مطبخ'])) return ChefHat;
  if (match(lowerName, ['fridge', 'refrigerator', 'freezer', 'یخچال', 'فریزر', 'سردخانه'])) return Refrigerator;
  if (match(lowerName, ['wash', 'laundry', 'dryer', 'لباسشویی', 'ظرفشویی', 'خشک کن'])) return WashingMachine;
  if (match(lowerName, ['dining', 'food', 'ناهار', 'شام', 'سفره'])) return Utensils;

  // 2. Living Room / Relax
  if (match(lowerName, ['living', 'sofa', 'lounge', 'hall', 'پذیرایی', 'هال', 'نشیمن', 'مبل', 'راحتی'])) return Armchair;
  if (match(lowerName, ['tv', 'television', 'netflix', 'cinema', 'تلویزیون', 'تی وی', 'سینما', 'نمایش'])) return Tv;
  if (match(lowerName, ['speaker', 'sound', 'music', 'audio', 'باند', 'اسپیکر', 'صوت', 'موزیک', 'ضبط'])) return Speaker;
  if (match(lowerName, ['radio', 'رادیو'])) return Radio;
  if (match(lowerName, ['game', 'ps5', 'xbox', 'playstation', 'console', 'کنسول', 'بازی', 'گیم'])) return Gamepad2;
  if (match(lowerName, ['fireplace', 'fire', 'heater', 'شومینه', 'آتش'])) return Flame;

  // 3. Bedroom / Personal Rooms
  if (match(lowerName, ['bed', 'sleep', 'rest', 'master', 'خواب', 'تخت', 'استراحت'])) return BedDouble;
  if (match(lowerName, ['room', 'chamber', 'area', 'zone', 'اتاق', 'فضا', 'محوطه'])) return LayoutTemplate;

  // 4. Bathroom / Water
  if (match(lowerName, ['bath', 'toilet', 'wc', 'shower', 'restroom', 'jacuzzi', 'حمام', 'دستشویی', 'توالت', 'دوش', 'جکوزی', 'وان'])) return Bath;
  if (match(lowerName, ['water', 'pump', 'pool', 'valve', 'irrigation', 'آب', 'پمپ', 'استخر', 'شیر', 'آبیاری'])) return Droplets;

  // 5. Outdoors / Garage
  if (match(lowerName, ['garden', 'yard', 'patio', 'flower', 'plant', 'baagh', 'باغ', 'حیاط', 'گلخانه', 'درخت', 'فضای سبز'])) return Trees;
  if (match(lowerName, ['garage', 'car', 'gate', 'parking', 'پارکینگ', 'گاراژ', 'ماشین', 'خودرو'])) return Car;
  if (match(lowerName, ['warehouse', 'store', 'storage', 'shed', 'انبار', 'سوله', 'مخزن'])) return Warehouse;

  // 6. Office / Work
  if (match(lowerName, ['office', 'work', 'desk', 'study', 'دفتر', 'کار', 'میز', 'اداره', 'شرکت'])) return Briefcase;
  if (match(lowerName, ['pc', 'computer', 'mac', 'server', 'کامپیوتر', 'رایانه', 'سرور', 'لپ تاپ'])) return Monitor;
  if (match(lowerName, ['printer', 'print', 'scan', 'پرینتر', 'چاپگر', 'اسکنر'])) return Box;

  // 7. Lighting (Generic)
  if (match(lowerName, ['light', 'lamp', 'led', 'bulb', 'dimmer', 'chandelier', 'lampe', 'loster', 'روشنایی', 'لامپ', 'لوستر', 'مهتابی', 'چراغ', 'هالوژن', 'نور'])) return Lightbulb;

  // 8. Climate / HVAC
  if (match(lowerName, ['fan', 'cool', 'wind', 'ventilator', 'blow', 'پنکه', 'فن', 'تهویه', 'باد'])) return Fan;
  if (match(lowerName, ['temp', 'heat', 'thermo', 'boiler', 'ac', 'air', 'condition', 'cooler', 'دما', 'حرارت', 'پکیج', 'کولر', 'بخاری', 'شوفاژ', 'اسپیلت'])) return Thermometer;

  // 9. Security / Entry
  if (match(lowerName, ['door', 'entry', 'exit', 'open', 'close', 'در', 'درب', 'ورودی', 'خروجی', 'دروازه'])) return DoorOpen;
  if (match(lowerName, ['lock', 'secure', 'safe', 'قفل', 'گاوصندوق', 'امنیت'])) return Lock;
  if (match(lowerName, ['cam', 'camera', 'cctv', 'video', 'record', 'دوربین', 'نظارت', 'ضبط'])) return Camera;

  // 10. Generic Electronics / Network
  if (match(lowerName, ['wifi', 'net', 'router', 'modem', 'access point', 'اینترنت', 'مودم', 'وای فای', 'شبکه'])) return Router;
  if (match(lowerName, ['phone', 'mobile', 'cell', 'گوشی', 'موبایل', 'تلفن'])) return Phone;
  if (match(lowerName, ['power', 'outlet', 'plug', 'socket', 'switch', 'relay', 'mains', 'برق', 'پریز', 'سوئیچ', 'رله', 'کنتاکتور'])) return Zap;
  if (match(lowerName, ['sensor', 'motion', 'pir', 'detect', 'alarm', 'سنسور', 'حسگر', 'دزدگیر', 'آلارم'])) return Activity;

  // Defaults based on type
  return defaultType === 'group' ? Layers : Cpu;
};

// Helper function to check if any keyword exists in the string
const match = (source: string, keywords: string[]) => {
  return keywords.some(keyword => source.includes(keyword));
};
