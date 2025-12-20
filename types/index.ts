
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
  ERROR = 0xFF,
}

export type SegmentType = 'All' | 'PWM' | 'Digital' | 'Code' | 'Input-0-1';
export type GroupType = 'custom' | 'register' | 'weather' | 'input';
export type ButtonTrigger = 0 | 1 | 2 | 3; // Hold, Toggle, High, Low
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
  
  // Digital Button Mode
  onOffMode?: 'toggle' | 'momentary'; // 'toggle' = Standard Click, 'momentary' = Push to Hold

  // Timer Feature
  timerFinishAt?: number; // Timestamp (ms) when timer expires

  // Shift Register Hardware Pins
  readonly regBitIndex?: number;
  readonly dsPin?: number;   // Data
  readonly shcpPin?: number; // Clock
  readonly stcpPin?: number; // Latch (Usually mapped to gpio as well)
  
  // Weather
  readonly dhtPin?: number;
  temperature?: number; 
  humidity?: number;    
  
  // Input
  readonly inputCondition?: ButtonTrigger;
  readonly inputValue?: number;
  readonly usePullup?: boolean;
  readonly inputAction?: ButtonAction;
  readonly inputActionGpio?: number;
  inputActive?: boolean; 
}

export interface Schedule {
  id: string;
  time: string; // HH:MM (24h format)
  targetSegmentId: string;
  action: 'ON' | 'OFF' | 'TOGGLE' | 'SET_VALUE';
  targetValue?: number; // 0-255 for PWM
  enabled: boolean;
  lastRun?: number; // Timestamp of last execution to prevent multi-trigger in same minute
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
