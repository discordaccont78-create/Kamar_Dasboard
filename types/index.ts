
export enum CMD {
  LED_ON = 0x01,
  LED_OFF = 0x02,
  LED_TOGGLE = 0x03,
  LED_PWM = 0x04,
  SR_PIN = 0x05,
  SR_STATE = 0x06,
  TEMP_READ = 0x07,
  HUM_READ = 0x08,
  TEMP_DATA = 0x09,
  HUM_DATA = 0x0A,
  PING = 0x0F,
  PONG = 0x10,
  CONSOLE = 0x11,
  ERROR_CODE = 0x12,
  GPIO_BATCH = 0x13,
  SR_CLEAR = 0x14,
  GPIO_READ = 0x15,
  GPIO_STATE = 0x16,
  BTN_INPUT = 0x17,
  BTN_CONFIG = 0x18,
  DISPLAY_UPDATE = 0x19, // New Command for Display
  ERROR = 0xFF,
}

export type SegmentType = 'All' | 'PWM' | 'Digital' | 'Code' | 'Input-0-1' | 'OLED' | 'CharLCD';
export type GroupType = 'custom' | 'register' | 'weather' | 'input' | 'display';
export type ButtonTrigger = 0 | 1 | 2 | 3; // 0=Hold, 1=Toggle, 2=High, 3=Low
export type ButtonAction = 0 | 1 | 2 | 3; // None, ON, OFF, Toggle

export interface Segment {
  readonly num_of_node: string; // ID is immutable
  name: string;
  group: string;
  readonly groupType: GroupType;
  readonly segType: SegmentType;
  readonly gpio?: number; // Primary control pin (Latch for Registers)
  is_led_on: 'on' | 'off';
  val_of_slide: number;
  
  // Custom Labels
  onLabel?: string;
  offLabel?: string;
  
  // Digital Button Mode
  onOffMode?: 'toggle' | 'momentary'; // 'toggle' = Standard Click, 'momentary' = Push to Hold
  
  // Pulse / Auto-Off Feature
  pulseDuration?: number; // Seconds to stay ON before auto-OFF (0 = disabled)

  // Timer Feature (Local segment timer, separate from Scheduler)
  timerFinishAt?: number; 

  // Shift Register Hardware Pins
  readonly regBitIndex?: number;
  readonly dsPin?: number;   // Data
  readonly shcpPin?: number; // Clock
  readonly stcpPin?: number; // Latch (Usually mapped to gpio as well)
  
  // Weather
  readonly dhtPin?: number;
  readonly dhtType?: 'DHT11' | 'DHT22';
  temperature?: number; 
  humidity?: number;    
  
  // Input
  readonly inputCondition?: ButtonTrigger;
  readonly inputValue?: number;
  readonly usePullup?: boolean;
  readonly inputAction?: ButtonAction;
  readonly inputActionGpio?: number;
  inputActive?: boolean; 

  // Display (OLED / LCD)
  readonly sdaPin?: number;
  readonly sclPin?: number;
  readonly i2cAddress?: string; // e.g., "0x3C"
  readonly displayWidth?: number; // 128 or 16 (cols)
  readonly displayHeight?: number; // 64 or 2 (rows)
  displayContent?: string; // To store current text on screen
}

export interface Schedule {
  id: string;
  type: 'daily' | 'countdown' | 'input' | 'weather'; 
  
  // Time specific
  time?: string; // HH:MM (24h format) for 'daily'
  duration?: number; // Seconds for 'countdown'
  startedAt?: number; // Timestamp when countdown was enabled
  
  // Input specific
  sourceGpio?: number; // The Input Pin
  inputTrigger?: ButtonTrigger; // 0=Hold, 1=Toggle, 2=High, 3=Low

  // Weather Specific
  sourceSegmentId?: string; // ID of the DHT Segment
  conditionMetric?: 'temp' | 'hum';
  conditionOperator?: '>' | '<' | '=';
  conditionValue?: number;

  // Target & Action
  targetSegmentId: string;
  action: 'ON' | 'OFF' | 'TOGGLE' | 'SET_VALUE';
  targetValue?: number; // 0-255 for PWM
  enabled: boolean;
  lastRun?: number; // Timestamp of last execution
  
  // Repetition Logic
  repeatMode?: 'daily' | 'once' | 'count'; // 'daily' = infinite, 'once' = run once & disable, 'count' = run N times
  repeatCount?: number; // Remaining runs if mode is 'count'
}

export interface AppSettings {
  domain: string;
  animations: boolean;
  bgMusic: boolean;
  volume: number;
  theme: 'dark' | 'light';
  readonly useSsl: boolean; // Derived from window location
  currentTrackIndex: number; 
  dashboardFont?: 'Inter' | 'Oswald' | 'Lato' | 'Montserrat' | 'DinaRemaster' | 'PrpggyDotted';
  backgroundEffect?: 'grid' | 'dots' | 'squares' | 'triangles';
  
  // Header / Waves Config
  headerGap?: number; // Distance between islands in px
  headerWaveOpacity?: number; // Opacity 0-100

  // Advanced Pattern Config
  dualColorBackground: boolean;
  hollowShapes: boolean; // Toggles between filled and outlined shapes
  enableTextPattern: boolean; // Text Overlay Toggle
  textPatternValue: string; // The text string
  textPatternOpacity?: number; // 0-100 specifically for text
  textPatternColor?: string; // Specific hex color for text
  patternOpacity?: number; // 0-100
  secondaryPatternOpacity?: number; // 0-100

  // Grid Specific Config
  gridStrokeWidth?: number;
  gridLineStyle?: 'solid' | 'dashed' | 'dotted';
  gridSize?: number;
}

export interface LogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly direction: 'in' | 'out';
  readonly raw: string;
  readonly msg: string;
}

export interface ToastEntry {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'error' | 'info';
}

export interface ConnectionConfig {
  mode: 'websocket' | 'mqtt';
  isConnected: boolean;
}

export interface BinaryMessage {
  readonly cmd: number;
  readonly seg: number;
  readonly val: number;
}
