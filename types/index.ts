
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
  DISPLAY_UPDATE = 0x19, 
  ERROR = 0xFF,
}

export type SegmentType = 'All' | 'PWM' | 'Digital' | 'Code' | 'Input-0-1' | 'OLED' | 'CharLCD' | 'DHT' | 'Empty';
export type GroupType = 'custom' | 'register' | 'weather' | 'input' | 'display';
export type ButtonTrigger = 0 | 1 | 2 | 3; 

// New: Explicit Group Configuration
export interface GroupConfig {
  id: string;
  name: string;
  icon?: string; // Lucide icon name string
  order: number; // For manual reordering
  collapsed?: boolean;
  columnCount?: 1 | 2 | 3; // New: User preference for grid columns
}

export interface Segment {
  readonly num_of_node: string;
  name: string;
  groupId: string; // Changed from 'group' string to 'groupId' reference
  readonly groupType: GroupType;
  readonly segType: SegmentType;
  readonly gpio?: number;
  is_led_on: 'on' | 'off';
  val_of_slide: number;
  onLabel?: string;
  offLabel?: string;
  onOffMode?: 'toggle' | 'momentary';
  pulseDuration?: number;
  timerFinishAt?: number; 
  readonly regBitIndex?: number;
  readonly dsPin?: number;
  readonly shcpPin?: number;
  readonly stcpPin?: number;
  readonly dhtPin?: number;
  readonly dhtType?: 'DHT11' | 'DHT22';
  temperature?: number; 
  humidity?: number;    
  readonly inputCondition?: ButtonTrigger;
  inputActive?: boolean; 
  readonly sdaPin?: number;
  readonly sclPin?: number;
  readonly i2cAddress?: string;
  readonly displayWidth?: number;
  readonly displayHeight?: number;
  displayContent?: string;
}

export interface Schedule {
  id: string;
  type: 'daily' | 'countdown' | 'input' | 'weather'; 
  time?: string;
  duration?: number;
  startedAt?: number;
  sourceGpio?: number;
  inputTrigger?: ButtonTrigger;
  sourceSegmentId?: string;
  conditionMetric?: 'temp' | 'hum';
  conditionOperator?: '>' | '<' | '=';
  conditionValue?: number;
  targetSegmentId: string;
  action: 'ON' | 'OFF' | 'TOGGLE' | 'SET_VALUE';
  targetValue?: number;
  enabled: boolean;
  lastRun?: number;
  repeatMode?: 'daily' | 'once' | 'count';
  repeatCount?: number;
}

export interface AppSettings {
  title: string;
  domain: string;
  animations: boolean;
  bgMusic: boolean;
  volume: number;
  theme: 'dark' | 'light';
  readonly useSsl: boolean;
  currentTrackIndex: number; 
  dashboardFont?: 'Inter' | 'Oswald' | 'Lato' | 'Montserrat' | 'DinaRemaster' | 'PrpggyDotted';
  backgroundEffect?: 'grid' | 'dots' | 'squares' | 'triangles' | 'none';
  primaryColor: string;
  cursorColor: string;
  language: 'en' | 'fa';
  enableSFX: boolean;
  enableNotifications: boolean;
  headerGap?: number;
  headerWaveOpacity?: number;
  headerDynamicIntensity?: boolean;
  showHeaderWaves?: boolean; 
  floatingIslands?: boolean; // New: Toggle for island levitation
  dualColorBackground: boolean;
  hollowShapes: boolean;
  enableTextPattern: boolean;
  textPatternValue: string;
  gridSize?: number;
  patternOpacity?: number;
  secondaryPatternOpacity?: number;
  textPatternColor?: string;
  textPatternOpacity?: number;
  gridStrokeWidth?: number;
  gridLineStyle?: 'solid' | 'dashed' | 'dotted';
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

export interface BinaryMessage {
  readonly cmd: number;
  readonly seg: number;
  readonly val: number;
  readonly data?: Uint8Array;
  readonly text?: string;
}
