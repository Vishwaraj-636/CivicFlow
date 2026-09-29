import { useEffect, useMemo, useState } from "react";
import { getIncidentForComplaintSafe } from "../services/incident.api";

const FEATURE_LABELS = {
   category: "Category",
   geographic: "Geographic",
   geo: "Geographic",
   lexical: "Lexical",
   semantic: "Semantic",
   temporal: "Temporal",
};

function toPercent(value) {
   const number = Number(value);
   if (!Number.isFinite(number)) return 0;
   return Math.max(0, Math.min(100, number <= 1 ? number * 100 : number));
}

function normalizeMatches(incident) {
   return incident?.complaints
      ?? incident?.complaintIds
      ?? incident?.members
      ?? incident?.relatedComplaints
      ?? [];
}

function getClassification(incident) {
   return (
      incident?.classification
      ?? incident?.matchType
      ?? incident?.relationship
      ?? incident?.incidentType
      ?? null
   );
}

function getConfidence(incident) {
   return incident?.confidence
      ?? incident?.similarityConfidence
      ?? incident?.similarityScore
      ?? incident?.score
      ?? 0;
}

function getFeatures(incident) {
   const features = incident?.features
      ?? incident?.featureVector
      ?? incident?.evidence
      ?? {};

   return Object.entries(features)
      .filter(([key, value]) => FEATURE_LABELS[key] && Number.isFinite(Number(value)))
      .map(([key, value]) => ({
         key,
         label: FEATURE_LABELS[key],
         value: toPercent(value),
      }));
}

function classificationStyle(classification) {
   const value = String(classification ?? "").toLowerCase();

   if (value.includes("duplicate")) {
      return {
         label: "Likely duplicate",
         className: "border-[#D8E8E2] bg-[#F0F7F4] text-[#28634F]",
      };
   }

   if (value.includes("related")) {
      return {
         label: "Related incident",
         className: "border-[#E5DCCF] bg-[#F8F4ED] text-[#7B6042]",
      };
   }

   return {
      label: classification ? String(classification).replaceAll("_", " ") : "No match",
      className: "border-[#E2E6E4] bg-[#F7F7F5] text-[#52606D]",
   };
}

const IncidentIntelligencePanel = ({ complaintId }) => {
   const [incident, setIncident] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      let active = true;

      async function load() {
         setLoading(true);
         setError("");

         try {
            const result = await getIncidentForComplaintSafe(complaintId);
            if (active) setIncident(result);
         } catch {
            if (active) setError("Incident intelligence is temporarily unavailable.");
         } finally {
            if (active) setLoading(false);
         }
      }

      load();
      return () => {
         active = false;
      };
   }, [complaintId]);

   const classification = useMemo(
      () => classificationStyle(getClassification(incident)),
      [incident]
   );

   const confidence = toPercent(getConfidence(incident));
   const features = getFeatures(incident);
   const matches = normalizeMatches(incident);
   const explanations = incident?.explanations
      ?? incident?.explanation
      ?? incident?.matchReasons
      ?? [];

   if (loading) {
      return (
         <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-base font-semibold tracking-tight text-[#17202A]">Incident Intelligence</h2>
                  <p className="mt-1 text-xs text-[#87919B]">HISC similarity analysis</p>
               </div>
               <span className="h-2 w-2 rounded-full bg-[#39756B] animate-pulse" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
               {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 rounded-lg bg-[#F1F3F2] animate-pulse" />
               ))}
            </div>
         </section>
      );
   }

   if (error) {
      return (
         <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs">
            <h2 className="text-base font-semibold text-[#17202A]">Incident Intelligence</h2>
            <p className="mt-2 text-sm text-[#87919B]">{error}</p>
         </section>
      );
   }

   if (!incident) {
      return (
         <section className="rounded-xl border border-dashed border-[#CBD2CF] bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
               <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#87919B]" />
               <div>
                  <h2 className="text-base font-semibold text-[#17202A]">Incident Intelligence</h2>
                  <p className="mt-1 text-sm text-[#52606D]">
                     No related incident has been identified for this complaint yet.
                  </p>
               </div>
            </div>
         </section>
      );
   }

   return (
      <section className="rounded-xl border border-[#D9DED9] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
               <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#39756B]" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">
                     HISC analysis
                  </p>
               </div>
               <h2 className="mt-1 text-base font-semibold tracking-tight text-[#17202A]">
                  Incident Intelligence
               </h2>
               <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#87919B]">
                  Explainable hybrid matching across category, geography, wording, semantic evidence, and time.
               </p>
            </div>

            <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${classification.className}`}>
               {classification.label}
            </span>
         </div>

         <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E2E6E4] bg-[#F7F7F5] p-4">
               <p className="text-[11px] font-semibold uppercase tracking-wider text-[#87919B]">Confidence</p>
               <p className="mt-1 text-2xl font-semibold tracking-tight text-[#17202A]">{confidence.toFixed(0)}%</p>
            </div>
            <div className="rounded-lg border border-[#E2E6E4] bg-[#F7F7F5] p-4">
               <p className="text-[11px] font-semibold uppercase tracking-wider text-[#87919B]">Incident</p>
               <p className="mt-1 truncate font-mono text-sm font-semibold text-[#17202A]">
                  {incident.clusterId ?? incident.incidentId ?? incident._id ?? "—"}
               </p>
            </div>
            <div className="rounded-lg border border-[#E2E6E4] bg-[#F7F7F5] p-4">
               <p className="text-[11px] font-semibold uppercase tracking-wider text-[#87919B]">Reports grouped</p>
               <p className="mt-1 text-2xl font-semibold tracking-tight text-[#17202A]">
                  {incident.complaintCount ?? matches.length ?? 0}
               </p>
            </div>
         </div>

         {features.length > 0 && (
            <div className="space-y-3">
               <div className="flex items-center justify-between border-b border-[#E2E6E4] pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Evidence vector</h3>
                  <span className="text-[11px] text-[#87919B]">0–100 contribution</span>
               </div>
               <div className="grid gap-3 sm:grid-cols-2">
                  {features.map((feature) => (
                     <div key={feature.key}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                           <span className="font-medium text-[#52606D]">{feature.label}</span>
                           <span className="font-mono text-[#17202A]">{feature.value.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#E9ECEA]">
                           <div
                              className="h-full rounded-full bg-[#39756B] transition-all"
                              style={{ width: `${feature.value}%` }}
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {(incident.explanation || explanations.length > 0) && (
            <div className="rounded-lg border border-[#E5DCCF] bg-[#FBF8F2] p-4">
               <p className="text-xs font-semibold uppercase tracking-wider text-[#7B6042]">Why this match?</p>
               {incident.explanation && (
                  <p className="mt-2 text-sm leading-relaxed text-[#52606D]">{incident.explanation}</p>
               )}
               {Array.isArray(explanations) && explanations.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-sm text-[#52606D]">
                     {explanations.slice(0, 5).map((item, index) => (
                        <li key={index} className="flex gap-2">
                           <span className="text-[#9A7652]">•</span>
                           <span>{typeof item === "string" ? item : item.reason ?? item.text ?? JSON.stringify(item)}</span>
                        </li>
                     ))}
                  </ul>
               )}
            </div>
         )}

         {matches.length > 0 && (
            <div className="space-y-3">
               <div className="flex items-center justify-between border-b border-[#E2E6E4] pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Grouped reports</h3>
                  <span className="text-[11px] text-[#87919B]">Same real-world incident candidates</span>
               </div>
               <div className="space-y-2">
                  {matches.slice(0, 6).map((match, index) => {
                     const id = match?._id ?? match?.complaintId ?? match?.id ?? match;
                     const title = match?.title ?? match?.description ?? "Linked complaint";
                     return (
                        <div key={id ?? index} className="flex items-start justify-between gap-4 rounded-lg border border-[#E2E6E4] px-3 py-3">
                           <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#17202A]">{title}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-[#87919B]">{String(id)}</p>
                           </div>
                           {match?.similarityScore != null && (
                              <span className="shrink-0 font-mono text-xs text-[#39756B]">
                                 {toPercent(match.similarityScore).toFixed(0)}%
                              </span>
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         {(incident.estimatedIndividualCost != null || incident.estimatedClusterCost != null || incident.estimatedSavings != null) && (
            <div className="rounded-lg border border-[#E2E6E4] bg-[#F7F7F5] p-4">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Operational cost comparison</p>
                     <p className="mt-1 text-xs text-[#87919B]">Estimated dispatch cost before vs. coordinated incident handling</p>
                  </div>
               </div>
               <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <CostStat label="Separate response" value={incident.estimatedIndividualCost} />
                  <CostStat label="Cluster response" value={incident.estimatedClusterCost} />
                  <CostStat label="Estimated saving" value={incident.estimatedSavings} emphasize />
               </div>
            </div>
         )}
      </section>
   );
};

function CostStat({ label, value, emphasize = false }) {
   if (value == null) return null;

   return (
      <div className={`rounded-lg border p-3 ${emphasize ? "border-[#D8E8E2] bg-[#F0F7F4]" : "border-[#E2E6E4] bg-white"}`}>
         <p className="text-[11px] font-semibold uppercase tracking-wider text-[#87919B]">{label}</p>
         <p className="mt-1 text-lg font-semibold text-[#17202A]">
            {typeof value === "number" ? value.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : value}
         </p>
      </div>
   );
}

export default IncidentIntelligencePanel;
