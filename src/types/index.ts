export interface SplitFile {
  path: string;
  thumbnail?: string;
}

export type ProcessingMode = 'SPLIT' | 'TRIM' | 'AUDIO' | 'COMPRESS' | 'MERGE' | 'GIF' | 'SPEED' | 'WATERMARK';

export type WatermarkPosition = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';

export interface WatermarkConfig {
  text: string;
  position: WatermarkPosition;
  fontSize: string;
  fontColor: string;
}

export enum CompressionLevel {
  LOW = '28',     // Lower quality, smaller size
  MEDIUM = '23',  // Balanced
  HIGH = '18'     // High quality, larger size
}

export interface SocialMediaPreset {
  id: string;
  name: string;
  duration: number; // in seconds
  icon: string;
}

export interface SplitSession {
  id: string;
  name: string;
  date: number;
  path: string;
  files: SplitFile[];
  thumbnail?: string;
}
