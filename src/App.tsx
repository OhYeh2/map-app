import React, { useState, useRef } from 'react';
import { Map } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { MediaViewer } from './components/MediaViewer';
import { HoverPreview } from './components/HoverPreview';
import { openDirectory, openFilePicker, supportsDirectoryPicker } from './utils/fileSystem';
import { parseMediaFile } from './utils/mediaParser';
import { exportCorrections, importCorrections } from './utils/corrections';
import type { MediaItem, Corrections } from './types';

function App() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [corrections, setCorrections] = useState<Corrections>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<MediaItem | null>(null);
  const [markerSize, setMarkerSize] = useState(48);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPickDirectory = supportsDirectoryPicker();

  const handleOpenFolder = async () => {
    setLoading(true);
    try {
      const files = canPickDirectory ? await openDirectory() : await openFilePicker();
      if (files.length === 0) {
        setLoading(false);
        return;
      }

      setProgress({ current: 0, total: files.length });
      const newItems: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // simple unique id generator
        const id = Math.random().toString(36).substring(2, 15); 
        const item = await parseMediaFile(file, id);
        
        if (item) {
          // Apply existing corrections if they exist
          const correction = corrections[item.filename];
          if (correction) {
            item.lat = correction.lat;
            item.lng = correction.lng;
          }
          newItems.push(item);
        }
        setProgress({ current: i + 1, total: files.length });
      }

      setItems(newItems);
    } catch (error) {
      console.error('Error opening folder:', error);
      alert('無法讀取資料夾');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleMarkerDragEnd = (id: string, lat: number, lng: number) => {
    setItems((prevItems) => {
      return prevItems.map(item => {
        if (item.id === id) {
          const newItem = { ...item, lat, lng };
          // Update corrections state automatically
          setCorrections(prev => ({
            ...prev,
            [newItem.filename]: { lat, lng }
          }));
          return newItem;
        }
        return item;
      });
    });
  };

  const handleExportCorrections = () => {
    exportCorrections(corrections);
  };

  const handleImportCorrections = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importCorrections(file).then((newCorrections) => {
      setCorrections(prev => ({ ...prev, ...newCorrections }));
      
      // Update existing items with imported corrections
      setItems(prevItems => prevItems.map(item => {
        const correction = newCorrections[item.filename];
        if (correction) {
          return { ...item, lat: correction.lat, lng: correction.lng };
        }
        return item;
      }));
      
      alert('校正設定已匯入並套用');
    }).catch(err => {
      console.error('Import failed', err);
      alert('匯入失敗，請確認檔案格式是否正確');
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        loading={loading}
        progress={progress}
        canPickDirectory={canPickDirectory}
        correctionsCount={Object.keys(corrections).length}
        itemsCount={items.length}
        markerSize={markerSize}
        onMarkerSizeChange={setMarkerSize}
        onOpenFolder={handleOpenFolder}
        onExportCorrections={handleExportCorrections}
        onImportClick={() => fileInputRef.current?.click()}
      />

      {/* Hidden file input for import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".json"
        onChange={handleImportCorrections}
      />

      {/* Map Content */}
      <div className="map-area">
        <Map 
          items={items} 
          markerSize={markerSize}
          onMarkerDragEnd={handleMarkerDragEnd} 
          onMarkerClick={setSelectedItem}
          onMarkerHover={setHoveredItem}
          onMarkerOut={() => setHoveredItem(null)}
        />
        {hoveredItem && <HoverPreview item={hoveredItem} />}
      </div>

      {/* Lightbox / Viewer */}
      <MediaViewer 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </div>
  );
}

export default App;
