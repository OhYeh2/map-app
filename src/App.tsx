import React, { useState, useRef } from 'react';
import { FolderOpen, Download, Upload, Map as MapIcon, Loader2 } from 'lucide-react';
import { Map } from './components/Map';
import { MediaViewer } from './components/MediaViewer';
import { openDirectory } from './utils/fileSystem';
import { parseMediaFile } from './utils/mediaParser';
import { exportCorrections, importCorrections } from './utils/corrections';
import type { MediaItem, Corrections } from './types';

function App() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [corrections, setCorrections] = useState<Corrections>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFolder = async () => {
    setLoading(true);
    try {
      const files = await openDirectory();
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
    <>
      {/* Floating Control Panel */}
      <div className="control-panel">
        <h1><MapIcon className="text-primary" /> 荒野相簿地圖</h1>
        <p>載入包含 GPS 照片與影片的資料夾</p>
        
        <button 
          className="btn btn-primary" 
          onClick={handleOpenFolder}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <FolderOpen size={18} />}
          {loading ? '讀取解析中...' : '選擇資料夾'}
        </button>

        {loading && progress.total > 0 && (
          <div>
            <div className="loading-bar">
              <div 
                className="loading-fill" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <div className="status-text">
              {progress.current} / {progress.total}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2" style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1 }}
            onClick={handleExportCorrections}
            disabled={Object.keys(corrections).length === 0}
            title="儲存您手動拖曳的位置"
          >
            <Download size={16} /> 匯出校正
          </button>
          
          <button 
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => fileInputRef.current?.click()}
            title="載入之前儲存的校正檔"
          >
            <Upload size={16} /> 匯入校正
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".json"
            onChange={handleImportCorrections}
          />
        </div>
      </div>

      {/* Map Content */}
      <Map 
        items={items} 
        onMarkerDragEnd={handleMarkerDragEnd} 
        onMarkerClick={setSelectedItem}
      />

      {/* Lightbox / Viewer */}
      <MediaViewer 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </>
  );
}

export default App;
