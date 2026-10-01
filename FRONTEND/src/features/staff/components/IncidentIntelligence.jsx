import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const api = axios.create({ baseURL: "http://localhost:3000/api", withCredentials: true });

const IncidentIntelligence = () => {
   const [incidents, setIncidents] = useState([]);
   const [error, setError] = useState("");

   useEffect(() => {
      let active = true;
      const load = async () => {
         try {
            const response = await api.get("/incidents");
            const list = Array.isArray(response.data) ? response.data : [];
            if (!active) return;
            setIncidents(list);
         } catch {
            if (active) setError("Incident intelligence could not be loaded. Complaint intake and staff operations remain available.");
         }
      };
      load();
      return () => { active = false; };
   }, []);

   return (
      <section aria-label="Incident intelligence" className="space-y-4">
         <div className="flex items-end justify-between border-b border-[#E2E6E4] pb-3">
            <div>
               <p className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">HISC incident intelligence</p>
               <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#17202A]">Coordinated civic incidents</h2>
            </div>
            <span className="text-xs text-[#87919B]">Live coordination view</span>
         </div>
         {error ? <p className="rounded-lg border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-sm text-[#A44A4A]">{error}</p> : (
            <>
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#D7E6E1] bg-[#F3F8F6] p-5">
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">Active incidents</p>
                     <p className="mt-2 text-3xl font-semibold text-[#17202A]">{incidents.length}</p>
                     <p className="mt-1 text-xs text-[#52606D]">Reports grouped by real-world problem</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E6E4] bg-white p-5">
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Reports coordinated</p>
                     <p className="mt-2 text-3xl font-semibold text-[#17202A]">{incidents.reduce((total, incident) => total + (incident.complaintCount ?? 0), 0)}</p>
                     <p className="mt-1 text-xs text-[#87919B]">Candidate retrieval uses location and time</p>
                  </div>
               </div>
               {incidents.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                     {incidents.slice(0, 6).map((incident) => (
                        <Link key={incident._id} to={`/staff/incidents/${incident._id}`} className="rounded-xl border border-[#E2E6E4] bg-white p-4 transition-colors hover:border-[#39756B]">
                           <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-xs font-semibold text-[#24527A]">{incident.clusterId}</span>
                              <span className="text-xs capitalize text-[#52606D]">{incident.status?.replaceAll("_", " ")}</span>
                           </div>
                           <p className="mt-3 text-sm font-semibold text-[#17202A]">{incident.complaintCount} coordinated reports</p>
                           <p className="mt-1 text-xs text-[#87919B]">Open incident details →</p>
                        </Link>
                     ))}
                  </div>
               )}
            </>
         )}
      </section>
   );
};

export default IncidentIntelligence;