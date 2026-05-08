import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FolderOpen,
  ImagePlus,
  Download,
  Upload,
  Map as MapIcon,
  Loader2,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  FolderTree,
  Settings,
  FileImage,
  MapPin,
} from 'lucide-react';

interface TreeNodeData {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: TreeNodeData[];
  content?: React.ReactNode;
}

interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  defaultOpen?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, defaultOpen = false }) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const hasChildren = node.children && node.children.length > 0;
  const hasContent = !!node.content;
  const isExpandable = hasChildren || hasContent;

  return (
    <div className="tree-node">
      <div
        className={`tree-node-header ${isExpandable ? 'expandable' : ''}`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        <span className="tree-chevron">
          {isExpandable ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span style={{ width: 14 }} />
          )}
        </span>
        <span className="tree-icon">{node.icon}</span>
        <span className="tree-label">{node.label}</span>
      </div>
      {expanded && (
        <div className="tree-node-body">
          {hasContent && (
            <div className="tree-node-content" style={{ paddingLeft: `${28 + level * 16}px` }}>
              {node.content}
            </div>
          )}
          {hasChildren &&
            node.children!.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  loading: boolean;
  progress: { current: number; total: number };
  canPickDirectory: boolean;
  correctionsCount: number;
  itemsCount: number;
  markerSize: number;
  onMarkerSizeChange: (size: number) => void;
  onOpenFolder: () => void;
  onExportCorrections: () => void;
  onImportClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  loading,
  progress,
  canPickDirectory,
  correctionsCount,
  itemsCount,
  markerSize,
  onMarkerSizeChange,
  onOpenFolder,
  onExportCorrections,
  onImportClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(300);
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 220;
  const MAX_WIDTH = 500;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Build tree data
  const treeData: TreeNodeData[] = [
    {
      id: 'data-source',
      label: '資料來源',
      icon: <FolderTree size={16} />,
      children: [
        {
          id: 'open-folder',
          label: canPickDirectory ? '選擇資料夾' : '選擇照片/影片',
          icon: canPickDirectory ? <FolderOpen size={16} /> : <ImagePlus size={16} />,
          content: (
            <div className="tree-action-area">
              <button
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFolder();
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : canPickDirectory ? (
                  <FolderOpen size={14} />
                ) : (
                  <ImagePlus size={14} />
                )}
                {loading ? '讀取中...' : canPickDirectory ? '開啟資料夾' : '選擇檔案'}
              </button>
              {loading && progress.total > 0 && (
                <div className="tree-progress">
                  <div className="loading-bar">
                    <div
                      className="loading-fill"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <div className="status-text">
                    {progress.current} / {progress.total}
                  </div>
                </div>
              )}
            </div>
          ),
        },
      ],
    },
    {
      id: 'media-info',
      label: `媒體檔案 (${itemsCount})`,
      icon: <FileImage size={16} />,
      content: (
        <div className="tree-info-text">
          {itemsCount === 0 ? (
            <span className="text-muted">尚未載入任何媒體</span>
          ) : (
            <span>已載入 {itemsCount} 個定位媒體</span>
          )}
        </div>
      ),
    },
    {
      id: 'corrections',
      label: `座標校正 (${correctionsCount})`,
      icon: <MapPin size={16} />,
      children: [
        {
          id: 'export-corrections',
          label: '匯出校正',
          icon: <Download size={16} />,
          content: (
            <div className="tree-action-area">
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onExportCorrections();
                }}
                disabled={correctionsCount === 0}
              >
                <Download size={14} /> 匯出校正檔
              </button>
            </div>
          ),
        },
        {
          id: 'import-corrections',
          label: '匯入校正',
          icon: <Upload size={16} />,
          content: (
            <div className="tree-action-area">
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onImportClick();
                }}
              >
                <Upload size={14} /> 匯入校正檔
              </button>
            </div>
          ),
        },
      ],
    },
    {
      id: 'settings',
      label: '顯示設定',
      icon: <Settings size={16} />,
      children: [
        {
          id: 'marker-size',
          label: '縮圖大小',
          icon: <ImagePlus size={16} />,
          content: (
            <div className="tree-action-area">
              <input 
                type="range" 
                min="24" 
                max="128" 
                value={markerSize} 
                onChange={(e) => onMarkerSizeChange(Number(e.target.value))} 
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div className="tree-info-text" style={{ textAlign: 'center' }}>
                {markerSize}px
              </div>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div
      ref={sidebarRef}
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
      style={{ width: collapsed ? 48 : width }}
    >
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-title">
            <MapIcon size={20} className="text-primary" />
            <span>荒野相簿地圖</span>
          </div>
        )}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展開側邊欄' : '收合側邊欄'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Tree Content */}
      {!collapsed && (
        <div className="sidebar-content">
          {treeData.map((node) => (
            <TreeNode key={node.id} node={node} level={0} defaultOpen={true} />
          ))}
        </div>
      )}

      {/* Collapsed icons */}
      {collapsed && (
        <div className="sidebar-collapsed-icons">
          <button
            className="sidebar-icon-btn"
            onClick={onOpenFolder}
            disabled={loading}
            title={canPickDirectory ? '選擇資料夾' : '選擇檔案'}
          >
            <FolderOpen size={20} />
          </button>
          <button
            className="sidebar-icon-btn"
            onClick={onExportCorrections}
            disabled={correctionsCount === 0}
            title="匯出校正"
          >
            <Download size={20} />
          </button>
          <button
            className="sidebar-icon-btn"
            onClick={onImportClick}
            title="匯入校正"
          >
            <Upload size={20} />
          </button>
        </div>
      )}

      {/* Resize Handle */}
      {!collapsed && (
        <div className="sidebar-resize-handle" onMouseDown={handleMouseDown} />
      )}
    </div>
  );
};
