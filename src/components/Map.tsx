import React, { useRef, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { MediaItem } from '../types';

interface MapProps {
  items: MediaItem[];
  markerSize: number;
  onMarkerDragEnd: (id: string, lat: number, lng: number) => void;
  onMarkerClick: (item: MediaItem) => void;
  onMarkerHover: (item: MediaItem) => void;
  onMarkerOut: () => void;
}

// Function to create custom DivIcon for thumbnails
const createCustomIcon = (item: MediaItem, size: number) => {
  const isVideo = item.type === 'video';
  return L.divIcon({
    html: `
      <div class="custom-marker-wrapper ${isVideo ? 'video' : ''}">
        <img src="${item.thumbnailUrl}" alt="${item.filename}" />
      </div>
    `,
    className: '', // Clear default class to use our own styling
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2] // Center anchor
  });
};

const createClusterCustomIcon = function (cluster: any) {
  return L.divIcon({
    html: `<div><span>${cluster.getChildCount()}</span></div>`,
    className: 'marker-cluster-custom',
    iconSize: L.point(40, 40, true)
  });
};

const MapEventsHandler = ({ spiderfiedClusterRef }: { spiderfiedClusterRef: React.MutableRefObject<any> }) => {
  const map = useMapEvents({
    mousemove: (e) => {
      const cluster = spiderfiedClusterRef.current;
      if (cluster) {
        const clusterPoint = map.latLngToContainerPoint(cluster.getLatLng());
        const mousePoint = map.latLngToContainerPoint(e.latlng);
        const distance = clusterPoint.distanceTo(mousePoint);
        
        // Calculate outer radius based on number of items. 
        // With distance multiplier 2, they spread out quite a bit.
        const childCount = cluster.getChildCount();
        const thresholdRadius = 120 + (childCount * 12);

        if (distance > thresholdRadius) {
          if (cluster.unspiderfy) {
            cluster.unspiderfy();
          }
          spiderfiedClusterRef.current = null;
        }
      }
    }
  });
  return null;
};

export const Map: React.FC<MapProps> = ({ 
  items, 
  markerSize,
  onMarkerDragEnd, 
  onMarkerClick,
  onMarkerHover,
  onMarkerOut
}) => {
  const spiderfiedClusterRef = useRef<any>(null);
  
  const callbacksRef = useRef({ onMarkerDragEnd, onMarkerClick, onMarkerHover, onMarkerOut });
  useEffect(() => {
    callbacksRef.current = { onMarkerDragEnd, onMarkerClick, onMarkerHover, onMarkerOut };
  }, [onMarkerDragEnd, onMarkerClick, onMarkerHover, onMarkerOut]);

  const markerGroup = useMemo(() => {
    return (
        <MarkerClusterGroup 
          chunkedLoading 
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          zoomToBoundsOnClick={false}
          spiderfyDistanceMultiplier={2}
          onMouseOver={(e: any) => {
            const cluster = e.layer;
            if (cluster && cluster.spiderfy && spiderfiedClusterRef.current !== cluster) {
              cluster.spiderfy();
              spiderfiedClusterRef.current = cluster;
            }
          }}
          onClick={(e: any) => {
             // Do nothing to prevent zoom/black screen issues
          }}
        >
          {items.map((item) => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={createCustomIcon(item, markerSize)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  callbacksRef.current.onMarkerDragEnd(item.id, position.lat, position.lng);
                },
                click: () => callbacksRef.current.onMarkerClick(item),
                mouseover: () => callbacksRef.current.onMarkerHover(item),
                mouseout: () => callbacksRef.current.onMarkerOut()
              }}
            />
          ))}
        </MarkerClusterGroup>
    );
  }, [items, markerSize]);

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
        
        <MapEventsHandler spiderfiedClusterRef={spiderfiedClusterRef} />
        
        {markerGroup}
      </MapContainer>
    </div>
  );
};
