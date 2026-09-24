export type LayerTarget = 'L1' | 'L2' | 'L3' | 'L4';

export type EasingType =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeOutBack'
  | 'easeOutElastic'
  | 'easeOutBounce';

export interface MarkerRange {
  start: number; // in seconds
  end: number;
  loop?: boolean;
}

export interface StateMarkers {
  intro: MarkerRange;
  hold: MarkerRange;
  outro: MarkerRange;
}

export interface KeyframeProps {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  rotation?: number;
  blur?: number;
  maskX?: number;
  maskY?: number;
  maskW?: number;
  maskH?: number;
}

export interface Keyframe {
  id: string;
  time: number; // in seconds
  props: KeyframeProps;
  easing: EasingType;
}

export interface DropShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

export interface LayerStyle {
  fill?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  stroke?: string;
  strokeWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  autoShrink?: boolean;
  dropShadow?: DropShadow;
  borderRadius?: number;
}

export interface MaskConfig {
  enabled: boolean;
  type: 'rect' | 'circle' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  inverted?: boolean;
}

export interface CGLayer {
  id: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'lottie' | 'repeater-row';
  visible: boolean;
  locked: boolean;
  opacity: number;
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    anchorX: number; // 0 to 1
    anchorY: number; // 0 to 1
  };
  style: LayerStyle;
  mask?: MaskConfig;
  content: {
    text?: string;
    src?: string;
    shapeType?: 'rect' | 'circle' | 'pill' | 'line';
    lottieData?: unknown;
  };
  dataBinding?: {
    column: string;
    fallback?: string;
  };
  keyframes: Keyframe[];
}

export interface RepeaterConfig {
  enabled: boolean;
  datasetId: string;
  rowHeight: number;
  maxRows: number;
  staggerDelay: number; // delay between rows entering (seconds)
}

export interface CGTemplate {
  id: string;
  name: string;
  category: 'lower-third' | 'fullscreen' | 'scorebug' | 'leaderboard' | 'ticker';
  defaultLayer: LayerTarget;
  duration: number; // total duration in seconds
  markers: StateMarkers;
  layers: CGLayer[];
  repeater?: RepeaterConfig;
}

export interface RundownItem {
  id: string;
  title: string;
  templateId: string;
  targetLayer: LayerTarget;
  dataOverrides: Record<string, string | number>;
  status: 'idle' | 'cued' | 'on_air';
  autoOutro?: boolean;
}

export interface SmartDataSet {
  id: string;
  name: string;
  sourceType: 'manual' | 'csv' | 'xlsx';
  sourcePath?: string;
  headers: string[];
  rows: Record<string, string | number>[];
  lastUpdated?: number;
}

export interface CGProject {
  id: string;
  name: string;
  version: string;
  canvas: {
    width: number;
    height: number;
    fps: number;
  };
  templates: CGTemplate[];
  rundown: RundownItem[];
  datasets: SmartDataSet[];
}

export type PlaybackState = 'intro' | 'hold' | 'outro' | 'stopped';

export interface ActiveOnAirGraphic {
  rundownItemId: string;
  templateId: string;
  targetLayer: LayerTarget;
  playbackState: PlaybackState;
  startedAt: number; // timestamp
  elapsedTime: number; // seconds
  dataOverrides: Record<string, string | number>;
}
