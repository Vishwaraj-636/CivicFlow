import { useEffect, useMemo, useState } from "react";
import { getIncidents } from "../services/incident.api";

const IncidentIntelligenceOverview = () => {
   const [incidents, setIncidents] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      let active = true;

      getIncidents()
         .then((items) => {
            if (active) setIncidents(Array.isArray(items) ? items : []);
         })
         .catch(() => {
            if (active) setIncidents([]);
         })
         .finally(() => {
            if (active) setLoading(false);
         });

      return () => {
         active = false;
      };
   }, []);

   const metrics = useMemo(() => {
      const active = incidents.filter((item) => !["resolved", "closed", "deleted"].includes(item.status));
      const highConfidence = incidents.filter((item) => Number(item.similarityConfidence ?? item.confidence ?? 0) >= 0.78);
      const departments = new Set(
         incidents.flatMap((item) => item.departmentIds ?? item.departments ?? []).map((item) => item?._id ?? item)
      );

      return {
         active: active.length,
         highConfidence: highConfidence.length,
         departments: [...departments].filter(Boolean).length,
      };
   }, [incidents]);

   if (loading) {
      return (
         <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6">
            <div className="h-5 w-48 rounded bg-[#F1F3F2] animate-pulse" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
               {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 rounded-lg bg-[#F1F3F2] animate-pulse" />
               ))}
            </div>
         </section>
      );
   }

   if (incidents.length === 0) return null;

   return (
      <section className="rounded-xl border border-[#D9DED9] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
         <div className="flex items-start justify-between gap-4">
            <div>
               <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#39756B]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">HISC</p>
               </div>
               <h2 className="mt-1 text-base font-semibold tracking-tight text-[#17202A]">Incident Intelligence</h2>
               <p className="mt-1 text-xs text-[#87919B]">
                  Complaints are grouped into real-world incident clusters for coordinated response.
               </p>
            </div>
            <span className="hidden sm:inline-flex rounded-full border border-[#D8E8E2] bg-[#F0F7F4] px-3 py-1 text-[11px] font-semibold text-[#28634F]">
               Explainable matching
            </span>
         </div>

         <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Active incidents" value={metrics.active} />
            <Metric label="High-confidence matches" value={metrics.highConfidence} />
            <Metric label="Departments involved" value={metrics.departments} />
         </div>
      </section>
   );
};

function Metric({ label, value }) {
   return (
      <div className="rounded-lg border border-[#E2E6E4] bg-[#F7F7F5] p-4">
         <p className="text-[11px] font-semibold uppercase tracking-wider text-[#87919B]">{label}</p>
         <p className="mt-1 text-2xl font-semibold tracking-tight text-[#17202A]">{value}</p>
      </div>
   );
}

export default IncidentIntelligenceOverview;
