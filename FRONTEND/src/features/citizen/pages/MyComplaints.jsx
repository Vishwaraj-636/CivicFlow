import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ComplaintCard from "../../../components/complaint/ComplaintCard";
import { getMyComplaints } from "../services/complaint.api";

const STATUS_FILTERS = [
   { id: "all", label: "All Reports" },
   { id: "active", label: "Active" },
   { id: "resolved", label: "Resolved" },
   { id: "rejected", label: "Rejected" },
];

const CATEGORIES = [
   "All Categories",
   "Roads & Transport",
   "Waste & Cleanliness",
   "Water & Utilities",
   "Street Infrastructure",
   "Drainage & Flooding",
];

const MyComplaints = () => {
   const [complaints, setComplaints] = useState([]);
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [activeTab, setActiveTab] = useState("all");
   const [selectedCategory, setSelectedCategory] = useState("All Categories");
   const navigate = useNavigate();

   const fetchComplaints = () => {
      setLoading(true);
      setError("");
      getMyComplaints()
         .then(setComplaints)
         .catch(() => setError("Unable to load your complaints. Please check your connection."))
         .finally(() => setLoading(false));
   };

   useEffect(() => {
      fetchComplaints();
   }, []);

   // Derived metric summaries from actual fetched data
   const counts = useMemo(() => {
      const total = complaints.length;
      const review = complaints.filter(
         (c) => c.status === "submitted" || c.status === "in_review"
      ).length;
      const progress = complaints.filter(
         (c) => c.status === "in_progress" || c.status === "assigned"
      ).length;
      const resolved = complaints.filter(
         (c) => c.status === "resolved" || c.status === "closed"
      ).length;
      const rejected = complaints.filter((c) => c.status === "rejected").length;
      return { total, review, progress, resolved, rejected };
   }, [complaints]);

   // Client-side filtering
   const filteredComplaints = useMemo(() => {
      return complaints.filter((complaint) => {
         // Status tab filter
         if (activeTab === "active") {
            const isActive = [
               "submitted",
               "in_review",
               "assigned",
               "in_progress",
            ].includes(complaint.status);
            if (!isActive) return false;
         } else if (activeTab === "resolved") {
            const isResolved = ["resolved", "closed"].includes(complaint.status);
            if (!isResolved) return false;
         } else if (activeTab === "rejected") {
            if (complaint.status !== "rejected") return false;
         }

         // Category filter
         if (
            selectedCategory !== "All Categories" &&
            complaint.category !== selectedCategory
         ) {
            return false;
         }

         // Search query filter
         if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase().trim();
            const matchId = complaint.complaintId?.toLowerCase().includes(q);
            const matchTitle = complaint.title?.toLowerCase().includes(q);
            const matchCategory = complaint.category?.toLowerCase().includes(q);
            const matchAddress = complaint.address?.toLowerCase().includes(q);
            if (!matchId && !matchTitle && !matchCategory && !matchAddress) {
               return false;
            }
         }

         return true;
      });
   }, [complaints, activeTab, selectedCategory, searchTerm]);

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased"
         style={{
            fontFamily:
               "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "--color-surface": "#FFFFFF",
            "--color-surface-secondary": "#F1F3F2",
            "--color-surface-elevated": "#F1F3F2",
            "--color-surface-bright": "#F7F7F5",
            "--color-border": "#E2E6E4",
            "--color-primary-text": "#17202A",
            "--color-secondary-text": "#52606D",
            "--color-muted-text": "#87919B",
            "--color-primary-accent": "#173B5E",
            "--color-accent-hover": "#122E4A",
         }}
      >
         <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 md:p-8 lg:p-10">
            {/* ── Page Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52606D]">
                     Citizen Services Portal
                  </span>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17202A] sm:text-3xl">
                     My Complaints
                  </h1>
                  <p className="mt-1 text-sm text-[#52606D]">
                     Review status updates, track resolution milestones, and manage your reported civic issues.
                  </p>
               </div>
               <Link
                  to="/citizen/complaints/report"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#173B5E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 shrink-0"
               >
                  <svg
                     className="h-4 w-4"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2.2}
                  >
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Report a Complaint
               </Link>
            </div>

            {/* ── Operational Metric Summary Strip ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
               <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#52606D]">
                     Total Reports
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#17202A] sm:text-3xl">
                     {counts.total}
                  </p>
                  <p className="mt-0.5 text-xs text-[#87919B]">Lifetime lodged</p>
               </div>
               <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#24527A]">
                     In Review
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#24527A] sm:text-3xl">
                     {counts.review}
                  </p>
                  <p className="mt-0.5 text-xs text-[#87919B]">Awaiting intake</p>
               </div>
               <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#587044]">
                     In Progress
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#587044] sm:text-3xl">
                     {counts.progress}
                  </p>
                  <p className="mt-0.5 text-xs text-[#87919B]">Fieldwork active</p>
               </div>
               <div className="rounded-xl border border-[#E2E6E4] bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#28704F]">
                     Resolved
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#28704F] sm:text-3xl">
                     {counts.resolved}
                  </p>
                  <p className="mt-0.5 text-xs text-[#87919B]">Completed cases</p>
               </div>
            </div>

            {/* ── Filter & Search Toolbar ── */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#E2E6E4] bg-white p-3.5 sm:p-4 shadow-sm">
               <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Status Segmented Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                     {STATUS_FILTERS.map((tab) => {
                        const count =
                           tab.id === "all"
                              ? counts.total
                              : tab.id === "active"
                                 ? counts.review + counts.progress
                                 : tab.id === "resolved"
                                    ? counts.resolved
                                    : counts.rejected;
                        const isSelected = activeTab === tab.id;
                        return (
                           <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer ${isSelected
                                    ? "bg-[#173B5E] text-white shadow-xs"
                                    : "bg-[#F1F3F2] text-[#52606D] hover:bg-[#E2E6E4] hover:text-[#17202A]"
                                 }`}
                           >
                              <span>{tab.label}</span>
                              <span
                                 className={`rounded-full px-1.5 py-0.2 text-[10px] ${isSelected
                                       ? "bg-white/20 text-white"
                                       : "bg-black/5 text-[#52606D]"
                                    }`}
                              >
                                 {count}
                              </span>
                           </button>
                        );
                     })}
                  </div>

                  {/* Category dropdown */}
                  <div className="flex items-center gap-2">
                     <label
                        htmlFor="categoryFilter"
                        className="text-xs font-semibold uppercase tracking-wider text-[#87919B] shrink-0"
                     >
                        Category:
                     </label>
                     <select
                        id="categoryFilter"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="min-h-[38px] rounded-lg border border-[#CBD2CF] bg-white px-3 py-1.5 text-xs font-medium text-[#17202A] transition-colors focus:border-[#173B5E] focus:outline-none"
                     >
                        {CATEGORIES.map((cat) => (
                           <option key={cat} value={cat}>
                              {cat}
                           </option>
                        ))}
                     </select>
                  </div>
               </div>

               {/* Search bar */}
               <div className="relative w-full">
                  <svg
                     className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87919B]"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                     />
                  </svg>
                  <input
                     type="text"
                     placeholder="Search reports by Ref ID, title, category, or address..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="min-h-[44px] w-full rounded-lg border border-[#CBD2CF] bg-[#F7F7F5] pl-9 pr-8 text-xs font-medium text-[#17202A] placeholder-[#87919B] transition-colors focus:border-[#173B5E] focus:bg-white focus:outline-none"
                  />
                  {searchTerm && (
                     <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#87919B] hover:text-[#17202A] cursor-pointer p-1"
                        title="Clear search"
                     >
                        ✕
                     </button>
                  )}
               </div>
            </div>

            {/* ── Error State ── */}
            {error && (
               <div className="flex items-center justify-between rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-[#A44A4A] shadow-sm">
                  <div className="flex items-center gap-3">
                     <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                     </svg>
                     <p className="text-sm font-semibold">{error}</p>
                  </div>
                  <button
                     onClick={fetchComplaints}
                     className="min-h-[36px] rounded-lg border border-[#A44A4A]/30 bg-white px-3 py-1 text-xs font-semibold text-[#A44A4A] hover:bg-[#FBF0F0]"
                  >
                     Retry
                  </button>
               </div>
            )}

            {/* ── Loading Skeleton ── */}
            {loading && (
               <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                     <div
                        key={i}
                        className="flex flex-col gap-3 rounded-2xl border border-[#E2E6E4] bg-white p-5"
                     >
                        <div className="flex items-center justify-between">
                           <div className="h-5 w-20 rounded-md bg-[#F1F3F2]" />
                           <div className="h-5 w-24 rounded-full bg-[#F1F3F2]" />
                        </div>
                        <div className="h-4 w-3/4 rounded bg-[#F1F3F2]" />
                        <div className="h-4 w-1/2 rounded bg-[#F1F3F2]" />
                        <div className="mt-2 h-3 w-1/3 rounded bg-[#F1F3F2]" />
                     </div>
                  ))}
               </div>
            )}

            {/* ── Empty State: No reports at all ── */}
            {!loading && !error && complaints.length === 0 && (
               <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD2CF] bg-white p-10 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FA] text-[#173B5E]">
                     <svg
                        className="h-7 w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                     </svg>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#17202A]">
                     No complaints submitted yet
                  </h3>
                  <p className="mt-1.5 max-w-sm text-xs text-[#52606D]">
                     When you report civic issues like road hazards, waste accumulation, or street light outages, they will appear here for status tracking.
                  </p>
                  <Link
                     to="/citizen/complaints/report"
                     className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#173B5E] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#122E4A]"
                  >
                     <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                     </svg>
                     Report Your First Issue
                  </Link>
               </div>
            )}

            {/* ── Empty State: Filter produced 0 matches ── */}
            {!loading &&
               !error &&
               complaints.length > 0 &&
               filteredComplaints.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD2CF] bg-white p-8 text-center shadow-sm">
                     <p className="text-sm font-bold text-[#17202A]">
                        No matching complaints found
                     </p>
                     <p className="mt-1 text-xs text-[#52606D]">
                        No complaints match your active filters or search criteria.
                     </p>
                     <button
                        onClick={() => {
                           setActiveTab("all");
                           setSelectedCategory("All Categories");
                           setSearchTerm("");
                        }}
                        className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#CBD2CF] bg-[#F1F3F2] px-4 py-1.5 text-xs font-semibold text-[#17202A] hover:bg-[#E2E6E4] cursor-pointer"
                     >
                        Reset All Filters
                     </button>
                  </div>
               )}

            {/* ── Populated Complaint Cards Grid ── */}
            {!loading && !error && filteredComplaints.length > 0 && (
               <div className="grid gap-4 sm:grid-cols-2">
                  {filteredComplaints.map((complaint) => (
                     <ComplaintCard
                        key={complaint._id}
                        complaint={complaint}
                        onClick={() => navigate(`/citizen/complaints/${complaint._id}`)}
                     />
                  ))}
               </div>
            )}
         </div>
      </div>
   );
};

export default MyComplaints;
