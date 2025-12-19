
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

export type SegmentType = 'All' | 'PWM' | 'Digital' | 'Input-0-1';
export type GroupType = 'custom' | 'register' | 'weather' | 'input';
export type ButtonTrigger = 0 | 1 | 2 | 3; // Hold, Toggle, High, Low
export type ButtonAction = 0 | 1 | 2 | 3; // None, ON, OFF, Toggle

export interface Segment {
  num_of_node: string;
  group: string; // Used as the user-defined name/alias
  groupType: GroupType;
  segType: SegmentType;
  gpio?: number;
  is_led_on: 'on' | 'off';
  val_of_slide: number;
  
  // Shift Register
  regBitIndex?: number;
  
  // Weather
  dhtPin?: number;
  temperature?: number; // Internal state for UI
  humidity?: number;    // Internal state for UI
  
  // Input
  inputCondition?: ButtonTrigger;
  inputValue?: number;
  usePullup?: boolean;
  inputAction?: ButtonAction;
  inputActionGpio?: number;
  inputActive?: boolean; // Internal state for UI
}

export interface AppSettings {
  title: string;
  domain: string;
  animations: boolean;
  bgMusic: boolean;
  volume: number;
  theme: 'dark' | 'light';
  useSsl: boolean;
  currentTrackIndex: number; // Added for track navigation
}

export interface LogEntry {
  id: string;
  timestamp: number;
  direction: 'in' | 'out';
  raw: string;
  msg: string;
}

export interface ToastEntry {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ConnectionConfig {
  mode: 'websocket' | 'mqtt';
  isConnected: boolean;
}

export interface BinaryMessage {
  cmd: number;
  seg: number;
  val: number;
}
