import React from 'react';
import { X } from 'lucide-react';
import type { MediaItem } from '../types';

interface MediaViewerProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ item, onClose }) => {
  const [objectUrl, setObjectUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (!item) {
      setObjectUrl('');
      return;
    }
    
    let url = '';
    if (item.type === 'video' || item.filename.toLowerCase().endsWith('.jpg') || item.filename.toLowerCase().endsWith('.jpeg') || item.filename.toLowerCase().endsWith('.png')) {
      url = URL.createObjectURL(item.file);
      setObjectUrl(url);
    } else {
      setObjectUrl(item.thumbnailUrl);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [item]);

  if (!item) return null;

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
