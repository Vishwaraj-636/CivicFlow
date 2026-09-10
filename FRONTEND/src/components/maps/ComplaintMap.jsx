import React from 'react';
import { MapContainer, TileLayer, Popup } from 'react-leaflet';
import MapMarker from './MapMarker';
import { JAWG_ATTRIBUTION, JAWG_TILE_URL } from './mapTiles';

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
               <TileLayer url={JAWG_TILE_URL} attribution={JAWG_ATTRIBUTION} />

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

         </div>
      </div>
   );
};

export default ComplaintMap;
