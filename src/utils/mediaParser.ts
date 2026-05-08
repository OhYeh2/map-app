import exifr from 'exifr';
import heic2any from 'heic2any';
import type { MediaItem } from '../types';

export async function parseMediaFile(file: File, id: string): Promise<MediaItem | null> {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isVideo = ['mp4', 'mov'].includes(ext || '');
    
    // 1. Parse EXIF / Metadata for GPS
    let lat: number | undefined;
    let lng: number | undefined;
    let timestamp = file.lastModified;

    try {
      const gps = await exifr.gps(file);
      if (gps) {
        lat = gps.latitude;
        lng = gps.longitude;
      }
      
      const parsed = await exifr.parse(file);
      if (parsed && parsed.DateTimeOriginal) {
        timestamp = new Date(parsed.DateTimeOriginal).getTime();
      }
    } catch (e) {
      console.warn(`Failed to parse EXIF for ${file.name}`, e);
    }

    if (lat === undefined || lng === undefined) {
      if (isVideo) {
        // Try fallback custom regex for Apple QuickTime MOV (ISO6709)
        const fallbackGps = await extractVideoGpsFallback(file);
        if (fallbackGps) {
          lat = fallbackGps.lat;
          lng = fallbackGps.lng;
        }
      }
    }

    if (lat === undefined || lng === undefined) {
      // 找不到任何 GPS，給予預設座標 (旗尾山附近) 讓使用者可以手動拖曳
      lat = 22.89;
      lng = 120.48;
    }

    // 2. Generate Thumbnail
    let thumbnailUrl = '';
    
    if (isVideo) {
      thumbnailUrl = await generateVideoThumbnail(file);
    } else if (ext === 'heic') {
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.5 // Lower quality for thumbnail
        });
        thumbnailUrl = URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
      } catch (err) {
        console.error('HEIC conversion failed', err);
        return null;
      }
    } else {
      thumbnailUrl = URL.createObjectURL(file);
    }

    return {
      id,
      file,
      filename: file.name,
      type: isVideo ? 'video' : 'image',
      lat,
      lng,
      originalLat: lat,
      originalLng: lng,
      thumbnailUrl,
      timestamp
    };
  } catch (err) {
    console.error(`Error processing ${file.name}:`, err);
    return null;
  }
}

function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    video.autoplay = false;
    video.muted = true;
    video.src = URL.createObjectURL(file);
    
    video.onloadeddata = () => {
      // Seek to 1 second or 10% of video to get a good frame
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      if (context) {
        canvas.width = video.videoWidth / 4; // Scale down for thumbnail
        canvas.height = video.videoHeight / 4;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.7);
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    video.onerror = (e) => reject(e);
  });
}

function extractVideoGpsFallback(file: File): Promise<{lat: number, lng: number} | null> {
  return new Promise((resolve) => {
    // Only read the first 100KB and last 100KB where metadata usually resides
    const _CHUNK_SIZE = 100 * 1024;
    
    const parseBuffer = (buffer: ArrayBuffer) => {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const str = decoder.decode(buffer);
      // Look for Apple ISO6709 format like +22.8954+120.4954/
      const appleRegex = /([+-]\d{2,3}\.\d+)([+-]\d{2,3}\.\d+)([+-]\d+\.\d+)?\//;
      const match = str.match(appleRegex);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      return null;
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const result = parseBuffer(e.target.result as ArrayBuffer);
        resolve(result);
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    
    // QuickTime usually puts moov box at the start or end
    reader.readAsArrayBuffer(file);
  });
}
