import React from 'react';
import type { MediaItem } from '../types';

interface HoverPreviewProps {
  item: MediaItem;
}

export const HoverPreview: React.FC<HoverPreviewProps> = ({ item }) => {
  const [objectUrl, setObjectUrl] = React.useState<string>('');

  React.useEffect(() => {
    let url = '';
    if (item.type === 'video' || item.filename.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
      url = URL.createObjectURL(item.file);
      setObjectUrl(url);
    } else {
      setObjectUrl(item.thumbnailUrl);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [item]);

  if (!objectUrl) return null;

  return (
    <div className="hover-preview">
      {item.type === 'video' ? (
        <video src={objectUrl} autoPlay loop muted playsInline />
      ) : (
        <img src={objectUrl} alt={item.filename} />
      )}
      <div className="hover-preview-info">
        {item.filename}
      </div>
    </div>
  );
};
