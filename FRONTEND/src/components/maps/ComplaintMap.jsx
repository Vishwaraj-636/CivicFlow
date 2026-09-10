import React from 'react';
import { MapContainer, TileLayer, Popup } from 'react-leaflet';
import MapMarker from './MapMarker';

/**
 * ComplaintMap
 *
 * Responsibilities:
 *   - Display the primary complaint location (gold marker)
 *   - Display related/nearby complaint markers (gray secondary markers)
 *
 * @param {Object}   complaint          - Primary complaint { _id, title, location: { lat, lng } }
 * @param {Array}    [relatedComplaints]- Array of nearby complaints { _id, title, location: { lat, lng } }
 * @param {number}   [zoom=14]
 * @param {string}   [className]        - Additional wrapper classes
 */
const ComplaintMap = ({
   complaint,
   relatedComplaints = [],
   zoom = 14,
   className = '',
}) => {
   const primaryPos = complaint?.location?.coordinates
      ? [complaint.location.coordinates[1], complaint.location.coordinates[0]]
      : complaint?.location?.lat != null
         ? [complaint.location.lat, complaint.location.lng]
         : null;

   const center = primaryPos ?? [18.5204, 73.8567];

   return (
      <div className={`flex flex-col gap-3 ${className}`}>
         {/* Map container */}
         <div className="relative rounded-xl overflow-hidden border border-border h-72">
            <MapContainer
               center={center}
               zoom={zoom}
               style={{ width: '100%', height: '100%' }}
               attributionControl={false}
               className="z-0"
            >
               <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

               {/* Primary complaint marker */}
               {primaryPos && (
                  <MapMarker position={primaryPos} variant="primary" label="This complaint">
                     <Popup>
                        <div className="text-xs text-gray-800 font-medium">
                           {complaint.title ?? 'This complaint'}
                        </div>
                     </Popup>
                  </MapMarker>
               )}

               {/* Related complaint markers */}
               {relatedComplaints.map((r) => {
                  const pos = r?.location?.coordinates
                     ? [r.location.coordinates[1], r.location.coordinates[0]]
                     : r?.location?.lat != null
                        ? [r.location.lat, r.location.lng]
                        : null;
                  if (!pos) return null;
                  return (
                     <MapMarker key={r._id} position={pos} variant="secondary" label={r.title}>
                        <Popup>
                           <div className="text-xs text-gray-800 font-medium">
                              {r.title ?? 'Related report'}
                           </div>
                        </Popup>
                     </MapMarker>
                  );
               })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-10 bg-surface/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 flex flex-col gap-1.5 text-xs text-secondary-text">
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-accent shrink-0" />
                  This complaint
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-text shrink-0" />
                  Related reports
               </div>
            </div>
         </div>
      </div>
   );
};

export default ComplaintMap;
