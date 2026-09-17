export type ElementType = 'jin' | 'mu' | 'shui' | 'huo' | 'tu';

export type PageStep = 'welcome' | 'select' | 'loading' | 'viewer';

export interface ElementData {
  id: ElementType;
  name: string;
  pinyin: string;
  char: string;
  shapeName: string;
  shapeDescription: string;
  icon: string;
  color: string;
  glowColor: string;
  modelUrl: string;
  fallbackModelUrl: string;
  wuxingPrinciple: string;
  architecturalFeature: string;
  porcelainCraft: string;
  culturalSymbolism: string;
  fengshuiSignificance: string;
  typicalBuildings: string[];
}

export interface HandLandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface HandGestureState {
  hasHand: boolean;
  isRightHand: boolean;
  isLeftHand: boolean;
  cursorX: number; // 0 to 1
  cursorY: number; // 0 to 1
  handDistance: number; // 0 (far from camera) to 1 (close to camera)
  handScale: number; // calculated scale factor: hand closer -> smaller building (0.5), hand farther -> larger building (1.8)
  isFist: boolean;
  isPinching: boolean;
  isPalmOpen: boolean;
  fistProgress: number; // 0 to 1 for smooth 1s reaction buffer
  fistTriggered: boolean;
  hoveredElement: ElementType | null;
  landmarks: HandLandmarkPoint[][];
}
