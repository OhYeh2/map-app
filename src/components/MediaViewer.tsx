import React from 'react';
import { X } from 'lucide-react';
import type { MediaItem } from '../types';

interface MediaViewerProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ item, onClose }) => {
  if (!item) return null;

  // We need to create an Object URL for the full file if we want to show it.
  // For HEIC, we might only be able to show the thumbnail unless we convert the full size here.
  // To keep it simple and performant, we will use the thumbnail for HEIC/Video preview,
  // but for Video we will use the actual file object URL to play it.
  
  const [objectUrl, setObjectUrl] = React.useState<string>('');

  React.useEffect(() => {
    let url = '';
    if (item.type === 'video' || item.filename.toLowerCase().endsWith('.jpg') || item.filename.toLowerCase().endsWith('.jpeg') || item.filename.toLowerCase().endsWith('.png')) {
      url = URL.createObjectURL(item.file);
      setObjectUrl(url);
    } else {
      // For HEIC, we just use the thumbnail URL we already generated
      setObjectUrl(item.thumbnailUrl);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [item]);

  return (
    <div className={`lightbox-overlay ${item ? 'active' : ''}`} onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>
          <X size={32} />
        </button>
        
        {item.type === 'video' ? (
          <video src={objectUrl} controls autoPlay />
        ) : (
          <img src={objectUrl} alt={item.filename} />
        )}
        
        <div className="lightbox-info">
          {item.filename} • {new Date(item.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
