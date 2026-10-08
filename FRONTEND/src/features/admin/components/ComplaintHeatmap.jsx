import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { getAdminComplaintMapData } from "../services/complaintMap.api";
import { JAWG_ATTRIBUTION, JAWG_TILE_URL } from "../../../components/maps/mapTiles";

const PRIORITY_ORDER = { low: 1, medium: 2, high: 3, urgent: 4 };
const PRIORITY_COLORS = { low: "#39756B", medium: "#B58A5A", high: "#C47732", urgent: "#B44747" };
const DEFAULT_CENTER = [18.5204, 73.8567];

const toPosition = (complaint) => {
   const coordinates = complaint?.location?.coordinates;
   if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
   const [longitude, latitude] = coordinates;
   return typeof latitude === "number" && typeof longitude === "number" ? [latitude, longitude] : null;
};

const clusterComplaints = (complaints) => {
   const clusters = new Map();
   complaints.forEach((complaint) => {
      const position = toPosition(complaint);
      if (!position) return;
      const key = `${position[0].toFixed(3)}:${position[1].toFixed(3)}`;
      const current = clusters.get(key) ?? { complaints: [], latitude: position[0], longitude: position[1] };
      current.complaints.push(complaint);
      current.latitude = current.complaints.reduce((sum, item) => sum + toPosition(item)[0], 0) / current.complaints.length;
      current.longitude = current.complaints.reduce((sum, item) => sum + toPosition(item)[1], 0) / current.complaints.length;
      clusters.set(key, current);
   });
   return [...clusters.values()];
};

const ComplaintHeatmap = () => {
   const [complaints, setComplaints] = useState([]);
   const [category, setCategory] = useState("all");
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      getAdminComplaintMapData()
         .then(setComplaints)
         .catch(() => setError("Unable to load geographic complaint data."))
         .finally(() => setLoading(false));
   }, []);

   const categories = useMemo(() => [...new Set(complaints.map((complaint) => complaint.category).filter(Boolean))].sort(), [complaints]);
   const filteredComplaints = useMemo(() => category === "all" ? complaints : complaints.filter((complaint) => complaint.category === category), [complaints, category]);
   const clusters = useMemo(() => clusterComplaints(filteredComplaints), [filteredComplaints]);
   const center = clusters.length > 0 ? [clusters[0].latitude, clusters[0].longitude] : DEFAULT_CENTER;

   return (
      <section aria-labelledby="complaint-heatmap-heading" className="space-y-4 rounded-xl border border-[#E2E6E4] bg-white p-5 shadow-sm sm:p-6">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <p className="text-[11px] font-bold uppercase tracking-wider text-[#39756B]">Geographic oversight</p>
               <h2 id="complaint-heatmap-heading" className="mt-1 text-lg font-semibold text-[#17202A]">Complaint concentration map</h2>
               <p className="mt-1 text-xs text-[#52606D]">Larger circles indicate more complaints in one area. Color indicates the highest priority in that area.</p>
            </div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Category
               <select value={category} onChange={(event) => setCategory(event.target.value)} className="ml-2 rounded-lg border border-[#CBD2CF] bg-white px-3 py-2 text-xs font-medium normal-case text-[#17202A]">
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
               </select>
            </label>
         </div>

         {error && <p className="rounded-lg border border-[#F3D0D0] bg-[#FBF0F0] p-3 text-sm text-[#A44A4A]">{error}</p>}
         <div className="relative h-112 overflow-hidden rounded-xl border border-[#CBD2CF]">
            {loading ? <div className="flex h-full items-center justify-center text-sm text-[#52606D]">Loading complaint locations...</div> : (
               <MapContainer center={center} zoom={12} style={{ width: "100%", height: "100%" }} attributionControl={false}>
                  <TileLayer url={JAWG_TILE_URL} attribution={JAWG_ATTRIBUTION} />
                  {clusters.map((cluster) => {
                     const highestPriority = cluster.complaints.reduce((highest, complaint) => PRIORITY_ORDER[complaint.priority] > PRIORITY_ORDER[highest] ? complaint.priority : highest, "low");
                     const color = PRIORITY_COLORS[highestPriority];
                     return <CircleMarker key={`${cluster.latitude}-${cluster.longitude}`} center={[cluster.latitude, cluster.longitude]} radius={Math.min(26, 7 + cluster.complaints.length * 2)} pathOptions={{ color, fillColor: color, fillOpacity: 0.62, weight: 2 }}>
                        <Popup>
                           <div className="min-w-44 text-xs text-[#17202A]"><p className="font-bold">{cluster.complaints.length} complaint{cluster.complaints.length === 1 ? "" : "s"} in this area</p><p className="mt-1 capitalize">Highest priority: <strong>{highestPriority}</strong></p><ul className="mt-2 space-y-1">{cluster.complaints.slice(0, 5).map((complaint) => <li key={complaint._id}>{complaint.complaintId} · {complaint.category}</li>)}</ul>{cluster.complaints.length > 5 && <p className="mt-1 text-[#52606D]">+ {cluster.complaints.length - 5} more</p>}</div>
                        </Popup>
                     </CircleMarker>;
                  })}
               </MapContainer>
            )}
            <div className="absolute bottom-3 left-3 z-1000 flex flex-wrap gap-2 rounded-lg border border-[#CBD2CF] bg-white/95 p-2 text-[10px] font-semibold capitalize shadow-sm">
               {Object.entries(PRIORITY_COLORS).map(([priority, color]) => <span key={priority} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{priority}</span>)}
            </div>
         </div>
         <p className="text-xs text-[#87919B]">Showing {filteredComplaints.length} mapped complaints across {clusters.length} concentration areas.</p>
      </section>
   );
};

export default ComplaintHeatmap;
