import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

/**
 * Build a Leaflet divIcon SVG pin.
 *
 * @param {'primary'|'secondary'} variant
 * @returns {L.DivIcon}
 */
function buildIcon(variant) {
   const color = variant === 'primary' ? '#B58A5A' : '#6F6B64';
   const outline = variant === 'primary' ? '#7d5f3a' : '#45433e';
   const size = variant === 'primary' ? 36 : 28;

   const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="15" r="10" fill="${color}" stroke="${outline}" stroke-width="2"/>
      <circle cx="18" cy="15" r="4" fill="white" fill-opacity="0.9"/>
      <path d="M18 25 L18 34" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;

   return L.divIcon({
      html: svg,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
   });
}

const PRIMARY_ICON = buildIcon('primary');
const SECONDARY_ICON = buildIcon('secondary');

/**
 * MapMarker
 *
 * A reusable Leaflet marker using a custom SVG pin icon.
 * Must be rendered inside a <MapContainer>.
 *
 * @param {[number, number]} position - [lat, lng]
 * @param {'primary'|'secondary'} [variant='primary']
 * @param {string} [label] - Optional tooltip label
 * @param {React.ReactNode} [children] - Popup content
 */
const MapMarker = ({ position, variant = 'primary', label, children }) => {
   const icon = variant === 'primary' ? PRIMARY_ICON : SECONDARY_ICON;

   return (
      <Marker position={position} icon={icon}>
         {label && (
            <Tooltip direction="top" offset={[0, -8]} permanent={false}>
               <span className="text-xs font-medium">{label}</span>
            </Tooltip>
         )}
         {children}
      </Marker>
   );
};

export default MapMarker;

