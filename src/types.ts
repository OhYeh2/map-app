export interface MediaItem {
  id: string;
  file: File;
  filename: string;
  type: 'image' | 'video';
  lat: number;
  lng: number;
  originalLat: number;
  originalLng: number;
  thumbnailUrl: string;
  timestamp: number;
}

export type Corrections = Record<string, { lat: number; lng: number }>;
