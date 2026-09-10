import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import MapMarker from './MapMarker';

/**
 * Inner component: captures map click events to allow location correction.
 */
function MapClickHandler({ onLocationChange, correcting }) {
   useMapEvents({
      click(e) {
         if (correcting) {
            onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
         }
      },
   });
   return null;
}

/**
 * LocationPicker
 *
 * Responsibilities:
 *   - Select a location (click map or use geolocation)
 *   - Get coordinates
 *   - Display marker at selected position
 *   - Allow the user to correct/re-pick the location
 *
 * @param {Object}   value              - Current coordinates { lat, lng }
 * @param {Function} onChange           - Called with new { lat, lng }
 * @param {number[]} [defaultCenter]    - [lat, lng] default map center
 * @param {number}   [defaultZoom=13]
 */
const LocationPicker = ({
   value,
   onChange,
   defaultCenter = [18.5204, 73.8567],
   defaultZoom = 13,
}) => {
   const [correcting, setCorrecting] = useState(false);
   const [gpsLoading, setGpsLoading] = useState(false);
   const [gpsError, setGpsError] = useState('');

   const markerPos = value
      ? [value.lat, value.lng]
      : null;

   const mapCenter = markerPos ?? defaultCenter;

   const handleGps = useCallback(() => {
      if (!navigator.geolocation) {
         setGpsError('Geolocation is not supported by your browser.');
         return;
      }
      setGpsLoading(true);
      setGpsError('');
      navigator.geolocation.getCurrentPosition(
         (pos) => {
            setGpsLoading(false);
            onChange?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
         },
         () => {
            setGpsLoading(false);
            setGpsError('Unable to retrieve your location.');
         }
      );
   }, [onChange]);

   const handleLocationChange = useCallback(
      (coords) => {
         onChange?.(coords);
         setCorrecting(false);
      },
      [onChange]
   );

   return (
      <div className="flex flex-col gap-3">
         {/* Map */}
         <div className="relative rounded-xl overflow-hidden border border-border h-64">
            <MapContainer
               center={mapCenter}
               zoom={defaultZoom}
               style={{ width: '100%', height: '100%' }}
               className="z-0"
               attributionControl={false}
            >
               {/* Dark tile layer */}
               <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

               <MapClickHandler
                  onLocationChange={handleLocationChange}
                  correcting={correcting}
               />

               {markerPos && (
                  <MapMarker position={markerPos} variant="primary" label="Selected location" />
               )}
            </MapContainer>

            {/* "Use my location" button — overlaid on the map */}
            <button
               onClick={handleGps}
               disabled={gpsLoading}
               title="Use my current location"
               className="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-semibold bg-surface/90 backdrop-blur-sm border border-border text-primary-text px-2.5 py-1.5 rounded-lg hover:border-primary-accent/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
               {/* GPS icon */}
               <svg className="w-3.5 h-3.5 text-primary-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
               </svg>
               {gpsLoading ? 'Locating…' : 'Use my location'}
            </button>

            {/* Correcting mode overlay hint */}
            {correcting && (
               <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-primary-accent text-background text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                  Click on the map to set the correct location
               </div>
            )}
         </div>

         {/* GPS error */}
         {gpsError && (
            <p className="text-xs text-danger">{gpsError}</p>
         )}

         {/* Coordinates display */}
         <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-text font-mono">
               {markerPos
                  ? `Lat: ${value.lat.toFixed(4)} | Lng: ${value.lng.toFixed(4)}`
                  : 'No location selected'}
            </p>

            {/* Allow Correction */}
            <button
               onClick={() => setCorrecting((c) => !c)}
               className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${correcting
                     ? 'bg-primary-accent/20 text-primary-accent border-primary-accent'
                     : 'border-border text-secondary-text hover:border-primary-accent/50 hover:text-primary-accent'
                  }`}
            >
               {correcting ? 'Cancel Correction' : 'Correct Location'}
            </button>
         </div>
      </div>
   );
};

export default LocationPicker;
