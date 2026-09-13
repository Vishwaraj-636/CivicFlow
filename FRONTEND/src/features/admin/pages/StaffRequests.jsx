import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
   approveStaffRequest,
   getStaffRequests,
   rejectStaffRequest,
} from "../services/staffRequest.api";

const TABS = [
   { key: "pending", label: "Pending" },
   { key: "approved", label: "Approved" },
   { key: "rejected", label: "Rejected" },
];

const statusStyles = {
   pending: {
      label: "Pending",
      badgeClass:
         "bg-[#FDF8E8] text-[#8A6D12] border border-[#EED99E]",
      dotClass: "bg-[#8A6D12]",
   },
   approved: {
      label: "Approved",
      badgeClass:
         "bg-[#ECF5F0] text-[#28704F] border border-[#B7DEC9]",
      dotClass: "bg-[#28704F]",
   },
   rejected: {
      label: "Rejected",
      badgeClass:
         "bg-[#FBF0F0] text-[#A44A4A] border border-[#F3C5C5]",
      dotClass: "bg-[#A44A4A]",
   },
};

const StaffRequests = () => {
   const [activeTab, setActiveTab] = useState("pending");
   const [selectedDept, setSelectedDept] = useState("");
   const [requests, setRequests] = useState([]);
   const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [toast, setToast] = useState("");
   const [refreshKey, setRefreshKey] = useState(0);

   // Modal state
   const [modal, setModal] = useState({ mode: null, request: null });
   const [modalLoading, setModalLoading] = useState(false);
   const [modalError, setModalError] = useState("");
   const [rejectionReason, setRejectionReason] = useState("");
   const textareaRef = useRef(null);

   const showToast = (message) => {
      setToast(message);
      setTimeout(() => setToast(""), 4000);
   };

   // Fetch tab requests + tab counts
   useEffect(() => {
      let isMounted = true;
      const fetchData = async () => {
         setLoading(true);
         setError("");
         try {
            const query = { status: activeTab };
            if (selectedDept) query.departmentId = selectedDept;

            const [tabRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
               getStaffRequests(query),
               getStaffRequests({ status: "pending" }),
               getStaffRequests({ status: "approved" }),
               getStaffRequests({ status: "rejected" }),
            ]);

            if (!isMounted) return;

            const extractList = (res) => {
               if (Array.isArray(res)) return res;
               if (Array.isArray(res?.requests)) return res.requests;
               return [];
            };

            const tabList = extractList(tabRes);
            setRequests(tabList);
            setCounts({
               pending: extractList(pendingRes).length,
               approved: extractList(approvedRes).length,
               rejected: extractList(rejectedRes).length,
            });
         } catch (err) {
            if (isMounted) {
               console.error("Failed to load staff requests:", err);
               setError("Unable to load staff requests. Please check backend service connection.");
            }
         } finally {
            if (isMounted) setLoading(false);
         }
      };

      fetchData();

      return () => {
         isMounted = false;
      };
   }, [activeTab, selectedDept, refreshKey]);

   // Dynamically extract unique departments from requests for the filter dropdown
   const departmentsList = useMemo(() => {
      const map = new Map();
      requests.forEach((req) => {
         const dept = req.departmentId;
         if (dept && dept._id && !map.has(dept._id)) {
            map.set(dept._id, {
               id: dept._id,
               name: dept.fullname || dept.name || "Department",
               code: dept.code || "",
            });
         }
      });
      return Array.from(map.values());
   }, [requests]);

   // Focus textarea when reject modal opens
   useEffect(() => {
      if (modal.mode === "reject") {
         setTimeout(() => textareaRef.current?.focus(), 50);
      }
   }, [modal.mode]);

   // Modal open / close handlers
   const handleOpenApprove = (req) => {
      setModalError("");
      setModal({ mode: "approve", request: req });
   };

   const handleOpenReject = (req) => {
      setModalError("");
      setRejectionReason("");
      setModal({ mode: "reject", request: req });
   };

   const handleCloseModal = () => {
      if (modalLoading) return;
      setModal({ mode: null, request: null });
      setModalError("");
      setRejectionReason("");
   };

   // Approve confirmation action
   const handleConfirmApprove = async () => {
      if (!modal.request?._id) return;
      setModalLoading(true);
      setModalError("");
      try {
         await approveStaffRequest(modal.request._id);
         handleCloseModal();
         showToast("Staff access approved successfully. Applicant elevated to dept_staff.");
         setRefreshKey((k) => k + 1);
      } catch (err) {
         setModalError(
            err.response?.data?.message || err.response?.data?.error || "Failed to approve request."
         );
      } finally {
         setModalLoading(false);
      }
   };

   // Reject confirmation action
   const handleConfirmReject = async () => {
      if (!modal.request?._id) return;
      if (!rejectionReason.trim()) {
         setModalError("Please provide a formal rejection reason.");
         return;
      }
      setModalLoading(true);
      setModalError("");
      try {
         await rejectStaffRequest(modal.request._id, rejectionReason.trim());
         handleCloseModal();
         showToast("Staff access request rejected and applicant account dismissed.");
         setRefreshKey((k) => k + 1);
      } catch (err) {
         setModalError(
            err.response?.data?.message || err.response?.data?.error || "Failed to reject request."
         );
      } finally {
         setModalLoading(false);
      }
   };

   // Keyboard escape key listener
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === "Escape" && modal.mode && !modalLoading) {
            handleCloseModal();
         }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [modal.mode, modalLoading]);

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased"
         style={{
            fontFamily:
               "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
         }}
      >
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Top Breadcrumb & Administrator Badge Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E6E4] pb-4">
               <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium">
                  <Link
                     to="/admin"
                     className="text-[#52606D] hover:text-[#17202A] transition-colors flex items-center gap-1"
                  >
                     <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                     </svg>
                     Administration
                  </Link>
                  <span className="text-[#CBD2CF]">/</span>
                  <span className="text-[#17202A] font-semibold">Staff Access Governance</span>
               </div>

               <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F3F2] border border-[#CBD2CF] text-[#52606D] self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-[#39756B] mr-2"></span>
                  Municipal Administrator • Executive Oversight
               </div>
            </div>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E6E4] pb-6">
               <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#39756B] mb-1.5 flex items-center gap-1.5">
                     <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                     </svg>
                     MUNICIPAL ADMINISTRATION
                  </div>
                  <h1 className="font-bold text-2xl sm:text-[32px] text-[#17202A] tracking-tight leading-tight">
                     Staff Access Verification
                  </h1>
                  <p className="text-sm text-[#52606D] mt-1 max-w-2xl">
                     Review credentials, departmental nominations, and authorize access for municipal personnel.
                  </p>
               </div>

               <Link
                  to="/admin"
                  className="min-h-[44px] px-4 py-2 bg-white hover:bg-[#F1F3F2] text-[#52606D] hover:text-[#17202A] border border-[#CBD2CF] rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors self-start md:self-auto shadow-xs"
               >
                  ← Admin Overview
               </Link>
            </div>

            {/* Toast Notification */}
            {toast && (
               <div className="p-4 bg-[#ECF5F0] border border-[#B7DEC9] rounded-xl text-[#28704F] text-sm flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                     <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                     <span className="font-medium">{toast}</span>
                  </div>
                  <button
                     onClick={() => setToast("")}
                     className="text-[#28704F] hover:opacity-75 font-bold text-xs cursor-pointer p-1"
                     aria-label="Dismiss toast"
                  >
                     ✕
                  </button>
               </div>
            )}

            {/* Error Banner */}
            {error && (
               <div className="flex items-start gap-3 rounded-xl border border-[#F3C5C5] bg-[#FBF0F0] p-4 text-sm text-[#A44A4A]">
                  <svg
                     className="w-5 h-5 shrink-0 mt-0.5"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                     />
                  </svg>
                  <div className="flex-1">
                     <p className="font-semibold">{error}</p>
                  </div>
                  <button
                     onClick={() => setRefreshKey((k) => k + 1)}
                     className="text-xs font-semibold px-2.5 py-1 bg-white border border-[#F3C5C5] rounded hover:bg-[#FBF0F0] transition-colors cursor-pointer"
                  >
                     Retry
                  </button>
               </div>
            )}

            {/* MAIN VERIFICATION QUEUE CARD */}
            <div className="bg-white border border-[#E2E6E4] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
               {/* Filter & Tab Bar Header */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E6E4] pb-4">
                  {/* Status Tabs */}
                  <div className="flex items-center space-x-6 overflow-x-auto pb-1 sm:pb-0">
                     {TABS.map((tab) => {
                        const count = counts[tab.key] || 0;
                        const isActive = activeTab === tab.key;
                        return (
                           <button
                              key={tab.key}
                              onClick={() => setActiveTab(tab.key)}
                              className={`flex items-center space-x-2 pb-3 border-b-2 text-sm font-semibold transition-colors relative cursor-pointer focus:outline-none ${isActive
                                    ? "border-[#173B5E] text-[#173B5E]"
                                    : "border-transparent text-[#52606D] hover:text-[#17202A]"
                                 }`}
                           >
                              <span>{tab.label}</span>
                              <span
                                 className={`px-2 py-0.5 rounded-full text-xs font-bold border ${tab.key === "pending" && count > 0
                                       ? "bg-[#FDF8E8] text-[#8A6D12] border-[#EED99E]"
                                       : isActive
                                          ? "bg-[#173B5E]/10 text-[#173B5E] border-[#173B5E]/20"
                                          : "bg-[#F1F3F2] text-[#52606D] border-[#E2E6E4]"
                                    }`}
                              >
                                 {count}
                              </span>
                           </button>
                        );
                     })}
                  </div>

                  {/* Department Select Filter */}
                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                     <label
                        htmlFor="dept-filter"
                        className="text-xs font-bold uppercase tracking-wider text-[#87919B] whitespace-nowrap"
                     >
                        Department:
                     </label>
                     <div className="relative min-w-[220px]">
                        <select
                           id="dept-filter"
                           value={selectedDept}
                           onChange={(e) => setSelectedDept(e.target.value)}
                           className="w-full h-10 pl-3 pr-8 bg-white text-[#17202A] border border-[#CBD2CF] rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 focus:border-[#173B5E] appearance-none cursor-pointer"
                        >
                           <option value="">All Municipal Departments</option>
                           {departmentsList.map((d) => (
                              <option key={d.id} value={d.id}>
                                 {d.name} {d.code ? `(${d.code})` : ""}
                              </option>
                           ))}
                        </select>
                        <svg
                           className="w-4 h-4 text-[#87919B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                           />
                        </svg>
                     </div>
                  </div>
               </div>

               {/* Table Content Area */}
               {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#87919B] text-sm">
                     <svg className="w-7 h-7 animate-spin text-[#173B5E]" fill="none" viewBox="0 0 24 24">
                        <circle
                           className="opacity-25"
                           cx="12"
                           cy="12"
                           r="10"
                           stroke="currentColor"
                           strokeWidth="4"
                        />
                        <path
                           className="opacity-75"
                           fill="currentColor"
                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                     </svg>
                     <span>Loading verification queue…</span>
                  </div>
               ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#87919B]">
                     <svg
                        className="w-12 h-12 opacity-30 text-[#87919B]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={1}
                           d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                     </svg>
                     <p className="text-sm font-medium text-[#52606D]">
                        No {activeTab} requests found{selectedDept ? " for this department" : ""}.
                     </p>
                  </div>
               ) : (
                  <>
                     {/* DESKTOP TABLE VIEW */}
                     <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-[#E2E6E4] bg-[#F1F3F2]/50">
                                 <th
                                    scope="col"
                                    className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#87919B]"
                                 >
                                    APPLICANT
                                 </th>
                                 <th
                                    scope="col"
                                    className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#87919B]"
                                 >
                                    ASSIGNED DEPARTMENT
                                 </th>
                                 <th
                                    scope="col"
                                    className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#87919B]"
                                 >
                                    DATE SUBMITTED
                                 </th>
                                 <th
                                    scope="col"
                                    className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#87919B]"
                                 >
                                    VERIFICATION STATUS
                                 </th>
                                 <th
                                    scope="col"
                                    className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#87919B] text-right"
                                 >
                                    {activeTab === "pending"
                                       ? "ACTIONS"
                                       : activeTab === "rejected"
                                          ? "REJECTION REASON"
                                          : "STATUS"}
                                 </th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-[#E2E6E4] text-sm">
                              {requests.map((req) => {
                                 const applicant = req.userId ?? {
                                    fullname: req.fullname,
                                    email: req.email,
                                 };
                                 const department = req.departmentId;
                                 const initials = applicant?.fullname
                                    ? applicant.fullname
                                       .split(" ")
                                       .map((n) => n[0])
                                       .slice(0, 2)
                                       .join("")
                                       .toUpperCase()
                                    : "CF";
                                 const formattedDate = req.createdAt
                                    ? new Date(req.createdAt).toLocaleDateString("en-IN", {
                                       day: "numeric",
                                       month: "short",
                                       year: "numeric",
                                    })
                                    : "—";
                                 const cfg =
                                    statusStyles[req.status] || statusStyles.pending;

                                 return (
                                    <tr
                                       key={req._id}
                                       className="hover:bg-[#F1F3F2]/40 transition-colors"
                                    >
                                       {/* Applicant Cell */}
                                       <td className="py-4 px-4">
                                          <div className="flex items-center space-x-3">
                                             <div className="w-9 h-9 rounded-full bg-[#173B5E] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                {initials}
                                             </div>
                                             <div>
                                                <div className="font-semibold text-[#17202A]">
                                                   {applicant?.fullname || "—"}
                                                </div>
                                                <div className="text-xs text-[#52606D]">
                                                   {applicant?.email || req.email || ""}
                                                </div>
                                             </div>
                                          </div>
                                       </td>

                                       {/* Department Cell */}
                                       <td className="py-4 px-4 font-medium text-[#17202A]">
                                          {department?.fullname ||
                                             department?.name ||
                                             "—"}
                                          {department?.code ? ` (${department.code})` : ""}
                                       </td>

                                       {/* Date Submitted Cell */}
                                       <td className="py-4 px-4 text-xs text-[#52606D] whitespace-nowrap">
                                          {formattedDate}
                                       </td>

                                       {/* Status Badge Cell */}
                                       <td className="py-4 px-4">
                                          <span
                                             className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeClass}`}
                                          >
                                             <span
                                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dotClass}`}
                                             ></span>
                                             {cfg.label}
                                          </span>
                                       </td>

                                       {/* Actions / Reason Cell */}
                                       <td className="py-4 px-4 text-right">
                                          {activeTab === "pending" ? (
                                             <div className="flex items-center justify-end space-x-2">
                                                <button
                                                   onClick={() => handleOpenApprove(req)}
                                                   className="min-h-[44px] px-3.5 py-2 bg-[#39756B] hover:bg-[#2C5E56] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#39756B]/30 shadow-xs cursor-pointer"
                                                   aria-label={`Approve ${applicant?.fullname}`}
                                                >
                                                   <svg
                                                      className="w-4 h-4"
                                                      fill="none"
                                                      viewBox="0 0 24 24"
                                                      stroke="currentColor"
                                                      strokeWidth={2}
                                                   >
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         d="M5 13l4 4L19 7"
                                                      />
                                                   </svg>
                                                   Approve
                                                </button>
                                                <button
                                                   onClick={() => handleOpenReject(req)}
                                                   className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#FBF0F0] text-[#A44A4A] border border-[#F3C5C5] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#A44A4A]/20 cursor-pointer"
                                                   aria-label={`Reject ${applicant?.fullname}`}
                                                >
                                                   <svg
                                                      className="w-4 h-4"
                                                      fill="none"
                                                      viewBox="0 0 24 24"
                                                      stroke="currentColor"
                                                      strokeWidth={2}
                                                   >
                                                      <path
                                                         strokeLinecap="round"
                                                         strokeLinejoin="round"
                                                         d="M6 18L18 6M6 6l12 12"
                                                      />
                                                   </svg>
                                                   Reject
                                                </button>
                                             </div>
                                          ) : activeTab === "rejected" ? (
                                             <span className="text-xs text-[#52606D] italic">
                                                {req.rejectionReason || "No reason recorded"}
                                             </span>
                                          ) : (
                                             <span className="text-xs text-[#28704F] font-medium">
                                                Active Staff
                                             </span>
                                          )}
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>

                     {/* RESPONSIVE MOBILE STACKED CARDS VIEW */}
                     <div className="block md:hidden space-y-4">
                        {requests.map((req) => {
                           const applicant = req.userId ?? {
                              fullname: req.fullname,
                              email: req.email,
                           };
                           const department = req.departmentId;
                           const initials = applicant?.fullname
                              ? applicant.fullname
                                 .split(" ")
                                 .map((n) => n[0])
                                 .slice(0, 2)
                                 .join("")
                                 .toUpperCase()
                              : "CF";
                           const formattedDate = req.createdAt
                              ? new Date(req.createdAt).toLocaleDateString("en-IN", {
                                 day: "numeric",
                                 month: "short",
                                 year: "numeric",
                              })
                              : "—";
                           const cfg =
                              statusStyles[req.status] || statusStyles.pending;

                           return (
                              <div
                                 key={req._id}
                                 className="bg-[#F1F3F2]/50 border border-[#CBD2CF] rounded-xl p-4 space-y-3.5"
                              >
                                 <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                       <div className="w-10 h-10 rounded-full bg-[#173B5E] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                          {initials}
                                       </div>
                                       <div>
                                          <h4 className="font-semibold text-sm text-[#17202A]">
                                             {applicant?.fullname || "—"}
                                          </h4>
                                          <p className="text-xs text-[#52606D]">
                                             {applicant?.email || req.email || ""}
                                          </p>
                                       </div>
                                    </div>
                                    <span
                                       className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badgeClass}`}
                                    >
                                       {cfg.label}
                                    </span>
                                 </div>

                                 <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-[#E2E6E4]">
                                    <div>
                                       <span className="text-[#87919B] block text-[10px] font-bold uppercase">
                                          Department
                                       </span>
                                       <span className="font-medium text-[#17202A]">
                                          {department?.fullname || department?.name || "—"}
                                          {department?.code ? ` (${department.code})` : ""}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-[#87919B] block text-[10px] font-bold uppercase">
                                          Submitted
                                       </span>
                                       <span className="font-medium text-[#17202A]">
                                          {formattedDate}
                                       </span>
                                    </div>
                                 </div>

                                 {activeTab === "pending" && (
                                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                                       <button
                                          onClick={() => handleOpenApprove(req)}
                                          className="min-h-[44px] w-full bg-[#39756B] hover:bg-[#2C5E56] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                                       >
                                          <svg
                                             className="w-4 h-4"
                                             fill="none"
                                             viewBox="0 0 24 24"
                                             stroke="currentColor"
                                             strokeWidth={2}
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                             />
                                          </svg>
                                          Approve
                                       </button>
                                       <button
                                          onClick={() => handleOpenReject(req)}
                                          className="min-h-[44px] w-full bg-white hover:bg-[#FBF0F0] text-[#A44A4A] border border-[#F3C5C5] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                       >
                                          <svg
                                             className="w-4 h-4"
                                             fill="none"
                                             viewBox="0 0 24 24"
                                             stroke="currentColor"
                                             strokeWidth={2}
                                          >
                                             <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                             />
                                          </svg>
                                          Reject
                                       </button>
                                    </div>
                                 )}

                                 {activeTab === "rejected" && req.rejectionReason && (
                                    <div className="text-xs text-[#52606D] bg-white p-2.5 rounded border border-[#E2E6E4]">
                                       <span className="font-semibold block text-[#A44A4A] text-[10px] uppercase">
                                          Rejection Reason:
                                       </span>
                                       {req.rejectionReason}
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  </>
               )}

               {/* Queue Footer Context */}
               <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E2E6E4] text-xs text-[#52606D]">
                  <span className="font-medium">
                     Showing {requests.length} of {counts[activeTab] || requests.length} {activeTab} filings
                  </span>
                  <span className="text-[#87919B]">
                     Civil Service Docket • Municipal Staff Oversight
                  </span>
               </div>
            </div>
         </div>

         {/* ─────────────────────────── APPROVE MODAL ─────────────────────────── */}
         {modal.mode === "approve" && modal.request && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
               <div
                  className="absolute inset-0"
                  onClick={handleCloseModal}
                  aria-label="Close modal overlay"
               />
               <div className="relative w-full max-w-lg bg-white border border-[#CBD2CF] rounded-2xl shadow-2xl z-10 overflow-hidden">
                  <div className="h-1.5 bg-[#39756B]" />

                  <div className="p-6 sm:p-7 space-y-5">
                     {/* Modal Header */}
                     <div className="flex items-start justify-between">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="w-6 h-6 rounded-full bg-[#ECF5F0] text-[#28704F] flex items-center justify-center">
                                 <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       d="M5 13l4 4L19 7"
                                    />
                                 </svg>
                              </span>
                              <h3 className="font-bold text-lg text-[#17202A] tracking-tight">
                                 Approve Staff Access
                              </h3>
                           </div>
                           <p className="text-xs text-[#52606D]">
                              Review applicant credentials before elevating account permissions.
                           </p>
                        </div>
                        <button
                           onClick={handleCloseModal}
                           disabled={modalLoading}
                           className="text-[#87919B] hover:text-[#17202A] p-1 cursor-pointer"
                           aria-label="Close"
                        >
                           ✕
                        </button>
                     </div>

                     {/* Applicant Summary Card */}
                     <div className="bg-[#F1F3F2] border border-[#E2E6E4] rounded-xl p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 rounded-full bg-[#173B5E] text-white font-bold text-sm flex items-center justify-center shrink-0">
                              {modal.request?.fullname
                                 ? modal.request.fullname
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()
                                 : "CF"}
                           </div>
                           <div>
                              <div className="font-semibold text-sm text-[#17202A]">
                                 {modal.request?.fullname || modal.request?.userId?.fullname || "—"}
                              </div>
                              <div className="text-xs text-[#52606D]">
                                 {modal.request?.email || modal.request?.userId?.email || ""}
                              </div>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E6E4] text-xs">
                           <div>
                              <span className="text-[#87919B] block text-[10px] font-bold uppercase">
                                 Department
                              </span>
                              <span className="font-medium text-[#17202A]">
                                 {modal.request?.departmentId?.fullname ||
                                    modal.request?.departmentId?.name ||
                                    "—"}
                                 {modal.request?.departmentId?.code
                                    ? ` (${modal.request.departmentId.code})`
                                    : ""}
                              </span>
                           </div>
                           <div>
                              <span className="text-[#87919B] block text-[10px] font-bold uppercase">
                                 Target Role
                              </span>
                              <span className="font-medium text-[#17202A]">
                                 dept_staff (Elevated)
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Consequence Notice */}
                     <div className="bg-[#EEF4FA] border border-[#CBD2CF] rounded-xl p-3.5 text-xs text-[#17202A] flex items-start gap-2.5 leading-relaxed">
                        <svg
                           className="w-5 h-5 text-[#173B5E] shrink-0 mt-0.5"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                           />
                        </svg>
                        <p>
                           <strong className="font-semibold text-[#173B5E]">
                              Institutional Policy Note:
                           </strong>{" "}
                           This will upgrade the applicant's role to department staff (
                           <code className="text-[11px] font-mono bg-white/70 px-1 py-0.5 rounded border border-[#CBD2CF]">
                              dept_staff
                           </code>
                           ) and assign them to the selected department roster under the Municipal Transparency Directive.
                        </p>
                     </div>

                     {/* Modal Error Display */}
                     {modalError && (
                        <div className="p-3 bg-[#FBF0F0] border border-[#F3C5C5] rounded-lg text-[#A44A4A] text-xs">
                           {modalError}
                        </div>
                     )}

                     {/* Action Buttons */}
                     <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E6E4]">
                        <button
                           onClick={handleCloseModal}
                           disabled={modalLoading}
                           className="min-h-[44px] px-5 py-2.5 bg-white hover:bg-[#F1F3F2] text-[#52606D] hover:text-[#17202A] border border-[#CBD2CF] rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                           Cancel
                        </button>
                        <button
                           onClick={handleConfirmApprove}
                           disabled={modalLoading}
                           className="min-h-[44px] px-5 py-2.5 bg-[#173B5E] hover:bg-[#122E4A] text-white rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                        >
                           {modalLoading ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                 <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                 />
                                 <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                 />
                              </svg>
                           ) : (
                              <svg
                                 className="w-4 h-4"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                                 strokeWidth={2}
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                 />
                              </svg>
                           )}
                           Approve Access
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ─────────────────────────── REJECT MODAL ─────────────────────────── */}
         {modal.mode === "reject" && modal.request && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
               <div
                  className="absolute inset-0"
                  onClick={handleCloseModal}
                  aria-label="Close modal overlay"
               />
               <div className="relative w-full max-w-lg bg-white border border-[#CBD2CF] rounded-2xl shadow-2xl z-10 overflow-hidden">
                  <div className="h-1.5 bg-[#A44A4A]" />

                  <div className="p-6 sm:p-7 space-y-5">
                     {/* Modal Header */}
                     <div className="flex items-start justify-between">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="w-6 h-6 rounded-full bg-[#FBF0F0] text-[#A44A4A] flex items-center justify-center">
                                 <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       d="M6 18L18 6M6 6l12 12"
                                    />
                                 </svg>
                              </span>
                              <h3 className="font-bold text-lg text-[#17202A] tracking-tight">
                                 Reject Staff Access Request
                              </h3>
                           </div>
                           <p className="text-xs text-[#52606D]">
                              Rejecting request from{" "}
                              <strong className="text-[#17202A] font-semibold">
                                 {modal.request?.fullname || modal.request?.userId?.fullname || "Applicant"}
                              </strong>{" "}
                              (
                              {modal.request?.departmentId?.fullname ||
                                 modal.request?.departmentId?.name ||
                                 "Department"}
                              )
                           </p>
                        </div>
                        <button
                           onClick={handleCloseModal}
                           disabled={modalLoading}
                           className="text-[#87919B] hover:text-[#17202A] p-1 cursor-pointer"
                           aria-label="Close"
                        >
                           ✕
                        </button>
                     </div>

                     {/* Rejection Reason Form */}
                     <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                           <label
                              htmlFor="rejection-reason"
                              className="text-[11px] font-bold uppercase tracking-wider text-[#17202A]"
                           >
                              REJECTION REASON <span className="text-[#A44A4A]">*</span>
                           </label>
                           <span className="text-[11px] text-[#87919B] font-mono">
                              {rejectionReason.length} / 300
                           </span>
                        </div>
                        <textarea
                           id="rejection-reason"
                           ref={textareaRef}
                           rows={3}
                           maxLength={300}
                           value={rejectionReason}
                           onChange={(e) => {
                              setRejectionReason(e.target.value);
                              setModalError("");
                           }}
                           className="w-full p-3 bg-white text-[#17202A] border border-[#CBD2CF] rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#A44A4A]/30 focus:border-[#A44A4A] resize-none leading-relaxed"
                           placeholder="Provide a formal civil service reason for rejection…"
                        />
                     </div>

                     {/* Consequence Warning Notice */}
                     <div className="bg-[#FBF0F0] border border-[#F3C5C5] rounded-xl p-3.5 text-xs text-[#A44A4A] flex items-start gap-2.5 leading-relaxed">
                        <svg
                           className="w-5 h-5 text-[#A44A4A] shrink-0 mt-0.5"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                           />
                        </svg>
                        <p>
                           <strong className="font-semibold">Administrative Notice:</strong>{" "}
                           Rejecting this staff request permanently closes the application and deletes the applicant account according to the administrative workflow.
                        </p>
                     </div>

                     {/* Modal Error Display */}
                     {modalError && (
                        <div className="p-3 bg-[#FBF0F0] border border-[#F3C5C5] rounded-lg text-[#A44A4A] text-xs">
                           {modalError}
                        </div>
                     )}

                     {/* Action Buttons */}
                     <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E6E4]">
                        <button
                           onClick={handleCloseModal}
                           disabled={modalLoading}
                           className="min-h-[44px] px-5 py-2.5 bg-white hover:bg-[#F1F3F2] text-[#52606D] hover:text-[#17202A] border border-[#CBD2CF] rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                           Cancel
                        </button>
                        <button
                           onClick={handleConfirmReject}
                           disabled={modalLoading}
                           className="min-h-[44px] px-5 py-2.5 bg-[#A44A4A] hover:bg-[#8A3A3A] text-white rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                        >
                           {modalLoading ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                 <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                 />
                                 <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                 />
                              </svg>
                           ) : (
                              <svg
                                 className="w-4 h-4"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                                 strokeWidth={2}
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                 />
                              </svg>
                           )}
                           Reject Request
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default StaffRequests;