import React from 'react';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { MediaItem } from '../types';

interface MapProps {
  items: MediaItem[];
  onMarkerDragEnd: (id: string, lat: number, lng: number) => void;
  onMarkerClick: (item: MediaItem) => void;
}

// Function to create custom DivIcon for thumbnails
const createCustomIcon = (item: MediaItem) => {
  const isVideo = item.type === 'video';
  return L.divIcon({
    html: `
      <div class="custom-marker-wrapper ${isVideo ? 'video' : ''}">
        <img src="${item.thumbnailUrl}" alt="${item.filename}" />
      </div>
    `,
    className: '', // Clear default class to use our own styling
    iconSize: [48, 48],
    iconAnchor: [24, 24] // Center anchor
  });
};

const createClusterCustomIcon = function (cluster: any) {
  return L.divIcon({
    html: `<div><span>${cluster.getChildCount()}</span></div>`,
    className: 'marker-cluster-custom',
    iconSize: L.point(40, 40, true)
  });
};

export const Map: React.FC<MapProps> = ({ items, onMarkerDragEnd, onMarkerClick }) => {
  // Center map on the first item or default to Taiwan
  const center: [number, number] = items.length > 0 
    ? [items[0].lat, items[0].lng] 
    : [23.5, 121]; // Taiwan center

  return (
    <div className="map-container">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        maxZoom={19}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="標準地圖 (街道)">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="衛星空照圖 (高解析)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="等高線地形圖">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenTopoMap'
              maxZoom={19}
              maxNativeZoom={17}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <MarkerClusterGroup 
          chunkedLoading 
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
        >
          {items.map((item) => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={createCustomIcon(item)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  onMarkerDragEnd(item.id, position.lat, position.lng);
                },
                click: () => onMarkerClick(item)
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
