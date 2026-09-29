import { useEffect, useState } from "react";
import { Link, Outlet, useOutlet } from "react-router-dom";
import axios from "axios";
import { getStaffRequests } from "../services/staffRequest.api";

// Department API instance configured for Admin credentials
const departmentApi = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

// Canonical CivicFlow complaint categories (no invented categories)
const CANONICAL_CATEGORIES = [
   "Roads & Transport",
   "Waste & Cleanliness",
   "Water & Utilities",
   "Street Infrastructure",
   "Drainage & Flooding",
];

const AdminDashboard = () => {
   const outlet = useOutlet();

   // Staff Request Metrics State
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [counts, setCounts] = useState({
      pending: 0,
      approved: 0,
      rejected: 0,
   });

   // Department Governance State
   const [departments, setDepartments] = useState([]);
   const [deptLoading, setDeptLoading] = useState(true);
   const [deptError, setDeptError] = useState("");
   const [deptSuccessMessage, setDeptSuccessMessage] = useState("");

   // Create Modal State
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [createFormData, setCreateFormData] = useState({
      fullname: "",
      code: "",
      description: "",
      categories: [],
      isActive: true,
   });
   const [createSubmitting, setCreateSubmitting] = useState(false);
   const [createError, setCreateError] = useState("");

   // Edit Modal State
   const [editingDepartment, setEditingDepartment] = useState(null);
   const [editFormData, setEditFormData] = useState({
      fullname: "",
      code: "",
      description: "",
      categories: [],
      isActive: true,
   });
   const [editSubmitting, setEditSubmitting] = useState(false);
   const [editError, setEditError] = useState("");

   // Deactivate Modal State
   const [deactivatingDepartment, setDeactivatingDepartment] = useState(null);
   const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);
   const [deactivateError, setDeactivateError] = useState("");

   // Permanent Delete Modal State (High friction)
   const [deletingDepartment, setDeletingDepartment] = useState(null);
   const [deleteSubmitting, setDeleteSubmitting] = useState(false);
   const [deleteError, setDeleteError] = useState("");

   // Fetch Staff Requests Metrics
   useEffect(() => {
      if (outlet) return;

      let isMounted = true;
      const fetchMetrics = async () => {
         setLoading(true);
         setError("");
         try {
            const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
               getStaffRequests({ status: "pending" }),
               getStaffRequests({ status: "approved" }),
               getStaffRequests({ status: "rejected" }),
            ]);

            if (!isMounted) return;

            const extractCount = (res) => {
               if (Array.isArray(res)) return res.length;
               if (Array.isArray(res?.requests)) return res.requests.length;
               return 0;
            };

            setCounts({
               pending: extractCount(pendingRes),
               approved: extractCount(approvedRes),
               rejected: extractCount(rejectedRes),
            });
         } catch (err) {
            if (isMounted) {
               console.error("Failed to load admin metrics:", err);
               setError("Unable to synchronize staff request metrics from server.");
            }
         } finally {
            if (isMounted) setLoading(false);
         }
      };

      fetchMetrics();

      return () => {
         isMounted = false;
      };
   }, [outlet]);

   // Fetch Active Department Roster (GET /api/departments returns active departments only)
   const fetchDepartments = async () => {
      setDeptLoading(true);
      setDeptError("");
      try {
         const res = await departmentApi.get("/departments");
         const list = Array.isArray(res.data) ? res.data : [];
         setDepartments(list);
      } catch (err) {
         console.error("Failed to load departments:", err);
         const message =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to synchronize active department roster from server.";
         setDeptError(message);
      } finally {
         setDeptLoading(false);
      }
   };

   useEffect(() => {
      if (outlet) return;
      fetchDepartments();
   }, [outlet]);

   // Auto-dismiss success messages after 6 seconds
   useEffect(() => {
      if (!deptSuccessMessage) return;
      const timer = setTimeout(() => {
         setDeptSuccessMessage("");
      }, 6000);
      return () => clearTimeout(timer);
   }, [deptSuccessMessage]);

   // Close modals on Escape key
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === "Escape") {
            if (isCreateModalOpen) setIsCreateModalOpen(false);
            if (editingDepartment) setEditingDepartment(null);
            if (deactivatingDepartment) setDeactivatingDepartment(null);
            if (deletingDepartment) setDeletingDepartment(null);
         }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [isCreateModalOpen, editingDepartment, deactivatingDepartment, deletingDepartment]);

   // Format date utility
   const formatDate = (isoString) => {
      if (!isoString) return "—";
      try {
         const date = new Date(isoString);
         return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
         });
      } catch {
         return isoString;
      }
   };

   const formatDateTime = (isoString) => {
      if (!isoString) return "—";
      try {
         const date = new Date(isoString);
         return `${date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
         })} • ${date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
         })}`;
      } catch {
         return isoString;
      }
   };

   // Toggle category in forms
   const handleCategoryToggle = (category, isEdit = false) => {
      if (isEdit) {
         setEditFormData((prev) => {
            const exists = prev.categories.includes(category);
            return {
               ...prev,
               categories: exists
                  ? prev.categories.filter((c) => c !== category)
                  : [...prev.categories, category],
            };
         });
      } else {
         setCreateFormData((prev) => {
            const exists = prev.categories.includes(category);
            return {
               ...prev,
               categories: exists
                  ? prev.categories.filter((c) => c !== category)
                  : [...prev.categories, category],
            };
         });
      }
   };

   // Open Edit Modal
   const openEditModal = (dept) => {
      setEditingDepartment(dept);
      setEditFormData({
         fullname: dept.fullname || "",
         code: dept.code || "",
         description: dept.description || "",
         categories: Array.isArray(dept.categories) ? [...dept.categories] : [],
         isActive: dept.isActive !== undefined ? dept.isActive : true,
      });
      setEditError("");
   };

   // Open Deactivate Confirmation
   const openDeactivateModal = (dept) => {
      setDeactivatingDepartment(dept);
      setDeactivateError("");
   };

   // Open Permanent Delete Confirmation
   const openDeleteModal = (dept) => {
      setDeletingDepartment(dept);
      setDeleteError("");
   };

   // Handler: POST /api/departments (Create)
   const handleCreateDepartment = async (e) => {
      e.preventDefault();
      setCreateError("");

      const trimmedName = createFormData.fullname.trim();
      const trimmedCode = createFormData.code.trim().toUpperCase();

      if (trimmedName.length < 3) {
         setCreateError("Department Name must be at least 3 characters long.");
         return;
      }
      if (trimmedCode.length < 2) {
         setCreateError("Department Code must be at least 2 characters long.");
         return;
      }

      setCreateSubmitting(true);
      try {
         const payload = {
            fullname: trimmedName,
            code: trimmedCode,
            description: createFormData.description.trim(),
            categories: createFormData.categories,
            isActive: createFormData.isActive,
         };

         await departmentApi.post("/departments", payload);
         setIsCreateModalOpen(false);
         setCreateFormData({
            fullname: "",
            code: "",
            description: "",
            categories: [],
            isActive: true,
         });
         if (createFormData.isActive) {
            setDeptSuccessMessage("Department registered successfully.");
         } else {
            setDeptSuccessMessage(
               "Department registered with inactive status (will not appear in the active roster)."
            );
         }
         fetchDepartments();
      } catch (err) {
         console.error("Failed to create department:", err);
         if (err.response?.status === 409) {
            setCreateError(
               err.response.data?.error ||
               "Department code already exists. Division codes must be unique across the municipal registry."
            );
         } else if (err.response?.status === 400) {
            const validationErrors = err.response.data?.errors;
            if (Array.isArray(validationErrors) && validationErrors.length > 0) {
               setCreateError(validationErrors.map((v) => v.msg).join(", "));
            } else {
               setCreateError(err.response.data?.error || "Invalid department input data.");
            }
         } else if (err.response?.status === 403) {
            setCreateError("Forbidden: Administrator privileges required.");
         } else if (err.response?.status === 401) {
            setCreateError("Session expired or unauthorized. Please re-authenticate.");
         } else {
            setCreateError(
               err.response?.data?.error || "Failed to register department due to a server error."
            );
         }
      } finally {
         setCreateSubmitting(false);
      }
   };

   // Handler: PATCH /api/departments/:id (Update)
   const handleEditDepartment = async (e) => {
      e.preventDefault();
      if (!editingDepartment) return;
      setEditError("");

      const trimmedName = editFormData.fullname.trim();
      const trimmedCode = editFormData.code.trim().toUpperCase();

      if (trimmedName.length < 3) {
         setEditError("Department Name must be at least 3 characters long.");
         return;
      }
      if (trimmedCode.length < 2) {
         setEditError("Department Code must be at least 2 characters long.");
         return;
      }

      setEditSubmitting(true);
      try {
         const payload = {
            fullname: trimmedName,
            code: trimmedCode,
            description: editFormData.description.trim(),
            categories: editFormData.categories,
            isActive: editFormData.isActive,
         };

         await departmentApi.patch(`/departments/${editingDepartment._id}`, payload);
         setEditingDepartment(null);
         if (editFormData.isActive) {
            setDeptSuccessMessage("Department details updated successfully.");
         } else {
            setDeptSuccessMessage(
               "Department details updated. Set to inactive; will no longer appear in active roster."
            );
         }
         fetchDepartments();
      } catch (err) {
         console.error("Failed to update department:", err);
         if (err.response?.status === 409) {
            setEditError(
               err.response.data?.error ||
               "Department code already exists. Division codes must be unique across the municipal registry."
            );
         } else if (err.response?.status === 400) {
            const validationErrors = err.response.data?.errors;
            if (Array.isArray(validationErrors) && validationErrors.length > 0) {
               setEditError(validationErrors.map((v) => v.msg).join(", "));
            } else {
               setEditError(err.response.data?.error || "Invalid department update data.");
            }
         } else if (err.response?.status === 404) {
            setEditError("Department no longer exists.");
         } else if (err.response?.status === 403) {
            setEditError("Forbidden: Administrator privileges required.");
         } else {
            setEditError(
               err.response?.data?.error || "Failed to update department due to a server error."
            );
         }
      } finally {
         setEditSubmitting(false);
      }
   };

   // Handler: PATCH /api/departments/:id (Deactivate)
   const handleDeactivateDepartment = async () => {
      if (!deactivatingDepartment) return;
      setDeactivateSubmitting(true);
      setDeactivateError("");
      try {
         await departmentApi.patch(`/departments/${deactivatingDepartment._id}`, {
            isActive: false,
         });
         setDeactivatingDepartment(null);
         setDeptSuccessMessage(
            `Department "${deactivatingDepartment.fullname}" deactivated. It has been removed from active municipal selections.`
         );
         fetchDepartments();
      } catch (err) {
         console.error("Failed to deactivate department:", err);
         setDeactivateError(
            err.response?.data?.error || "Unable to deactivate department. Please try again."
         );
      } finally {
         setDeactivateSubmitting(false);
      }
   };

   // Handler: DELETE /api/departments/:id (Hard Delete)
   const handleDeleteDepartment = async () => {
      if (!deletingDepartment) return;
      setDeleteSubmitting(true);
      setDeleteError("");
      try {
         await departmentApi.delete(`/departments/${deletingDepartment._id}`);
         const deletedName = deletingDepartment.fullname;
         setDeletingDepartment(null);
         setDeptSuccessMessage(
            `Department "${deletedName}" permanently deleted from database.`
         );
         fetchDepartments();
      } catch (err) {
         console.error("Failed to delete department:", err);
         setDeleteError(
            err.response?.data?.error || "Unable to delete department from database."
         );
      } finally {
         setDeleteSubmitting(false);
      }
   };

   // Client-derivable metrics from loaded department roster
   const activeDepartmentsCount = departments.filter((d) => d.isActive).length;
   const registeredDepartmentsCount = departments.length;
   const coveredCategoriesCount = new Set(
      departments.flatMap((d) => (Array.isArray(d.categories) ? d.categories : []))
   ).size;

   // When visiting child route like /admin/staff-requests, render the outlet directly
   if (outlet) {
      return <Outlet />;
   }

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased"
         style={{
            fontFamily:
               "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
         }}
      >
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Top Breadcrumb & Administrator Identity Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E6E4] pb-4">
               <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium">
                  <span className="text-[#52606D]">Administration</span>
                  <span className="text-[#CBD2CF]">/</span>
                  <span className="text-[#17202A] font-semibold">Executive Oversight</span>
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
                     Admin Workspace
                  </h1>
                  <p className="text-sm text-[#52606D] mt-1 max-w-2xl">
                     Governance, staff access verification, and municipal account oversight.
                  </p>
               </div>

               {/* Quick Nav Button */}
               <Link
                  to="/admin/staff-requests"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#173B5E] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 shadow-xs self-start md:self-auto cursor-pointer"
               >
                  Staff Access Queue →
               </Link>
            </div>

            {/* Error Banner if staff request metrics failed */}
            {error && (
               <div className="flex items-start gap-3 rounded-xl border border-[#F3C5C5] bg-[#FBF0F0] p-4 text-xs sm:text-sm text-[#A44A4A]">
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
                  <div>
                     <p className="font-semibold">{error}</p>
                     <p className="text-xs mt-0.5 opacity-90">
                        Check backend connectivity at /api/admin/requests/staff
                     </p>
                  </div>
               </div>
            )}

            {/* 2. EXECUTIVE SUMMARY METRIC STRIP (Request Metrics Only) */}
            <section aria-labelledby="request-metrics-heading">
               <h2 id="request-metrics-heading" className="sr-only">
                  Executive Request Metrics
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Metric Card 1: Pending */}
                  <div className="bg-white border border-[#E2E6E4] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#CBD2CF] transition-colors">
                     <div className="flex items-start justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#87919B]">
                           PENDING STAFF REQUESTS
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF8E8] text-[#8A6D12] border border-[#EED99E]">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#8A6D12] mr-1.5"></span>
                           Action Required
                        </span>
                     </div>
                     <div className="mt-4 flex items-baseline gap-3">
                        <span className="font-bold text-4xl text-[#17202A] tracking-tight">
                           {loading ? "…" : counts.pending}
                        </span>
                        <span className="text-xs font-medium text-[#52606D]">
                           active submissions
                        </span>
                     </div>
                     <p className="text-xs text-[#52606D] mt-3 pt-3 border-t border-[#E2E6E4] flex items-center gap-1.5">
                        <svg
                           className="w-4 h-4 text-[#8A6D12] shrink-0"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                           />
                        </svg>
                        Awaiting administrative verification
                     </p>
                  </div>

                  {/* Metric Card 2: Approved */}
                  <div className="bg-white border border-[#E2E6E4] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#CBD2CF] transition-colors">
                     <div className="flex items-start justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#87919B]">
                           APPROVED REQUESTS
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECF5F0] text-[#28704F] border border-[#B7DEC9]">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#28704F] mr-1.5"></span>
                           Active Roster
                        </span>
                     </div>
                     <div className="mt-4 flex items-baseline gap-3">
                        <span className="font-bold text-4xl text-[#17202A] tracking-tight">
                           {loading ? "…" : counts.approved}
                        </span>
                        <span className="text-xs font-medium text-[#52606D]">
                           verified staff members
                        </span>
                     </div>
                     <p className="text-xs text-[#52606D] mt-3 pt-3 border-t border-[#E2E6E4] flex items-center gap-1.5">
                        <svg
                           className="w-4 h-4 text-[#28704F] shrink-0"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                           />
                        </svg>
                        Access credentials granted to department staff
                     </p>
                  </div>

                  {/* Metric Card 3: Rejected */}
                  <div className="bg-white border border-[#E2E6E4] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#CBD2CF] transition-colors">
                     <div className="flex items-start justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#87919B]">
                           REJECTED REQUESTS
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FBF0F0] text-[#A44A4A] border border-[#F3C5C5]">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#A44A4A] mr-1.5"></span>
                           Archived
                        </span>
                     </div>
                     <div className="mt-4 flex items-baseline gap-3">
                        <span className="font-bold text-4xl text-[#17202A] tracking-tight">
                           {loading ? "…" : counts.rejected}
                        </span>
                        <span className="text-xs font-medium text-[#52606D]">
                           dismissed filings
                        </span>
                     </div>
                     <p className="text-xs text-[#52606D] mt-3 pt-3 border-t border-[#E2E6E4] flex items-center gap-1.5">
                        <svg
                           className="w-4 h-4 text-[#A44A4A] shrink-0"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                           />
                        </svg>
                        Applications closed or unverified
                     </p>
                  </div>
               </div>
            </section>

            {/* 3. PRIMARY ADMINISTRATIVE ACTION BANNER */}
            <section className="bg-[#F1F3F2] border border-[#CBD2CF] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
               <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-[#173B5E]/10 border border-[#173B5E]/20 flex items-center justify-center text-[#173B5E] shrink-0">
                     <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                        />
                     </svg>
                  </div>
                  <div>
                     <div className="text-xs font-bold uppercase tracking-wider text-[#173B5E]">
                        Direct Access Queue
                     </div>
                     <p className="text-sm font-medium text-[#17202A] mt-0.5">
                        {loading
                           ? "Synchronizing pending verification queue…"
                           : `${counts.pending} applicant(s) awaiting departmental verification and security authorization.`}
                     </p>
                  </div>
               </div>
               <Link
                  to="/admin/staff-requests"
                  className="min-h-[44px] px-6 py-2.5 bg-[#173B5E] hover:bg-[#122E4A] text-white rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#173B5E]/40 shrink-0 w-full sm:w-auto cursor-pointer"
               >
                  Review Staff Access Requests
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
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                     />
                  </svg>
               </Link>
            </section>

            

            {/* ========================================================================= */}
            {/* 5. APPROVED MUNICIPAL DEPARTMENT ROSTER & GOVERNANCE SECTION (GENERATION 8) */}
            {/* ========================================================================= */}
            <section
               aria-labelledby="department-governance-heading"
               className="pt-6 border-t border-[#E2E6E4] space-y-6"
            >
               {/* Section Header & Toolbar */}
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                     <div className="text-[11px] font-bold uppercase tracking-widest text-[#52606D] mb-1">
                        CIVIL INFRASTRUCTURE &amp; DIVISION GOVERNANCE
                     </div>
                     <h2
                        id="department-governance-heading"
                        className="font-bold text-xl sm:text-2xl text-[#17202A] tracking-tight"
                     >
                        Municipal Department Roster &amp; Governance
                     </h2>
                     <p className="text-sm text-[#52606D] mt-1 max-w-2xl">
                        Manage operational municipal divisions, triage routing categories, and administrative activity status.
                     </p>
                  </div>

                  {/* Toolbar Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                     <button
                        type="button"
                        onClick={() => {
                           setIsCreateModalOpen(true);
                           setCreateError("");
                        }}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#173B5E] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 shadow-xs cursor-pointer"
                     >
                        <svg
                           className="w-4 h-4"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                           strokeWidth={2}
                        >
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Register Department</span>
                     </button>

                     <button
                        type="button"
                        onClick={fetchDepartments}
                        disabled={deptLoading}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white border border-[#CBD2CF] px-4 py-2.5 text-xs font-semibold text-[#17202A] hover:bg-[#F1F3F2] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                     >
                        <svg
                           className={`w-4 h-4 text-[#52606D] ${deptLoading ? "rotate-180 transition-transform duration-500" : ""}`}
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                           strokeWidth={2}
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                           />
                        </svg>
                        <span>{deptLoading ? "Synchronizing…" : "Refresh Roster"}</span>
                     </button>
                  </div>
               </div>

               {/* Section Feedback Notifications */}
               {deptSuccessMessage && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#B7DEC9] bg-[#ECF5F0] p-4 text-xs sm:text-sm text-[#28704F]">
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
                        <span className="font-semibold">{deptSuccessMessage}</span>
                     </div>
                     <button
                        type="button"
                        onClick={() => setDeptSuccessMessage("")}
                        className="text-[#28704F] hover:text-[#184530] p-1 rounded transition-colors"
                        aria-label="Dismiss notification"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                     </button>
                  </div>
               )}

               {deptError && (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-[#F3C5C5] bg-[#FBF0F0] p-4 text-xs sm:text-sm text-[#A44A4A]">
                     <div className="flex items-start gap-2.5">
                        <svg
                           className="w-5 h-5 shrink-0 mt-0.5"
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
                        <div>
                           <p className="font-semibold">{deptError}</p>
                           <p className="text-xs mt-0.5 opacity-90">
                              Error communicating with GET /api/departments
                           </p>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={fetchDepartments}
                        className="shrink-0 px-3 py-1 rounded bg-[#A44A4A] text-white text-xs font-semibold hover:bg-[#833838] transition-colors"
                     >
                        Retry
                     </button>
                  </div>
               )}

              

               {/* DEPARTMENT ROSTER CONTAINER */}
               <div className="bg-white border border-[#E2E6E4] rounded-xl overflow-hidden shadow-xs">
                  {/* SKELETON LOADING STATE */}
                  {deptLoading && departments.length === 0 ? (
                     <div className="p-6 space-y-4">
                        <div className="text-xs font-semibold text-[#87919B] uppercase tracking-wider">
                           Synchronizing Municipal Department Roster…
                        </div>
                        <div className="space-y-3">
                           {[1, 2, 3].map((n) => (
                              <div
                                 key={n}
                                 className="border border-[#E2E6E4] rounded-lg p-4 bg-[#F7F7F5] space-y-3"
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="h-4 bg-[#E2E6E4] rounded w-1/3"></div>
                                    <div className="h-4 bg-[#E2E6E4] rounded w-16"></div>
                                 </div>
                                 <div className="h-3 bg-[#E2E6E4] rounded w-2/3"></div>
                                 <div className="flex gap-2 pt-1">
                                    <div className="h-5 bg-[#E2E6E4] rounded-full w-24"></div>
                                    <div className="h-5 bg-[#E2E6E4] rounded-full w-28"></div>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="text-[11px] font-mono text-[#87919B]">
                           Neutral static loading placeholder (no pulse animation)
                        </div>
                     </div>
                  ) : departments.length === 0 ? (
                     /* EMPTY STATE */
                     <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#F1F3F2] text-[#52606D] flex items-center justify-center border border-[#CBD2CF]">
                           <svg
                              className="w-6 h-6 text-[#52606D]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                           </svg>
                        </div>
                        <h3 className="font-semibold text-base text-[#17202A]">
                           No active departments currently available
                        </h3>
                        <p className="text-xs text-[#52606D] max-w-sm">
                           No active municipal departments are currently available in the roster. You may register a new operational division below.
                        </p>
                        <button
                           type="button"
                           onClick={() => {
                              setIsCreateModalOpen(true);
                              setCreateError("");
                           }}
                           className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#173B5E] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#122E4A]"
                        >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                           </svg>
                           <span>Register Department</span>
                        </button>
                     </div>
                  ) : (
                     <>
                        {/* DESKTOP STRUCTURED TABLE (hidden on mobile) */}
                        <div className="hidden md:block overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="border-b border-[#E2E6E4] bg-[#F1F3F2] text-[11px] font-bold uppercase tracking-wider text-[#52606D]">
                                    <th className="py-3.5 px-5 font-semibold">DIVISION (FULLNAME &amp; CODE)</th>
                                    <th className="py-3.5 px-5 font-semibold">DESCRIPTION</th>
                                    <th className="py-3.5 px-5 font-semibold">ROUTED CATEGORIES</th>
                                    <th className="py-3.5 px-5 font-semibold">STATUS</th>
                                    <th className="py-3.5 px-5 font-semibold">REGISTERED</th>
                                    <th className="py-3.5 px-5 font-semibold text-right">GOVERNANCE ACTIONS</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E2E6E4] text-xs sm:text-sm">
                                 {departments.map((dept) => (
                                    <tr
                                       key={dept._id}
                                       className="hover:bg-[#F7F7F5] transition-colors"
                                    >
                                       {/* DIVISION */}
                                       <td className="py-4 px-5">
                                          <div className="flex items-center gap-2.5">
                                             <span className="font-semibold text-[#17202A]">
                                                {dept.fullname}
                                             </span>
                                             <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EEF4FA] text-[#173B5E] border border-[#CBD2CF] font-medium">
                                                {dept.code}
                                             </span>
                                          </div>
                                       </td>

                                       {/* DESCRIPTION */}
                                       <td className="py-4 px-5 max-w-xs text-[#52606D] text-xs leading-relaxed">
                                          <div className="line-clamp-2" title={dept.description || ""}>
                                             {dept.description || "No description provided."}
                                          </div>
                                       </td>

                                       {/* ROUTED CATEGORIES */}
                                       <td className="py-4 px-5">
                                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                                             {Array.isArray(dept.categories) && dept.categories.length > 0 ? (
                                                dept.categories.map((cat) => (
                                                   <span
                                                      key={cat}
                                                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F3F2] text-[#52606D] border border-[#CBD2CF]"
                                                   >
                                                      {cat}
                                                   </span>
                                                ))
                                             ) : (
                                                <span className="text-xs text-[#87919B] italic">
                                                   None assigned
                                                </span>
                                             )}
                                          </div>
                                       </td>

                                       {/* STATUS */}
                                       <td className="py-4 px-5 whitespace-nowrap">
                                          {dept.isActive ? (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECF5F0] text-[#28704F] border border-[#B7DEC9]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#28704F]"></span>
                                                Active
                                             </span>
                                          ) : (
                                             <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F3F2] text-[#52606D] border border-[#CBD2CF]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#52606D]"></span>
                                                Inactive
                                             </span>
                                          )}
                                       </td>

                                       {/* REGISTERED */}
                                       <td className="py-4 px-5 text-xs text-[#52606D] whitespace-nowrap font-mono">
                                          {formatDate(dept.createdAt)}
                                       </td>

                                       {/* ACTIONS */}
                                       <td className="py-4 px-5 text-right whitespace-nowrap">
                                          <div className="inline-flex items-center gap-1.5">
                                             <button
                                                type="button"
                                                onClick={() => openEditModal(dept)}
                                                className="min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold text-[#173B5E] hover:bg-[#EEF4FA] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                             >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                Edit
                                             </button>

                                             <button
                                                type="button"
                                                onClick={() => openDeactivateModal(dept)}
                                                className="min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold text-[#52606D] hover:bg-[#F1F3F2] focus:outline-none focus:ring-2 focus:ring-[#52606D]/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                             >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                                Deactivate
                                             </button>

                                             <button
                                                type="button"
                                                onClick={() => openDeleteModal(dept)}
                                                className="min-h-[36px] px-2.5 py-1 rounded text-xs font-semibold text-[#BA1A1A] hover:bg-[#FBF0F0] focus:outline-none focus:ring-2 focus:ring-[#BA1A1A]/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                             >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>

                        {/* MOBILE RESPONSIVE STACKED CARDS (shown on mobile, hidden on md+) */}
                        <div className="md:hidden divide-y divide-[#E2E6E4]">
                           {departments.map((dept) => (
                              <div key={dept._id} className="p-5 space-y-3.5">
                                 <div className="flex items-start justify-between gap-2">
                                    <div>
                                       <h4 className="font-semibold text-base text-[#17202A]">
                                          {dept.fullname}
                                       </h4>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EEF4FA] text-[#173B5E] border border-[#CBD2CF] font-medium">
                                             {dept.code}
                                          </span>
                                          <span className="text-[11px] font-mono text-[#87919B]">
                                             Reg: {formatDate(dept.createdAt)}
                                          </span>
                                       </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ECF5F0] text-[#28704F] border border-[#B7DEC9] shrink-0">
                                       <span className="w-1.5 h-1.5 rounded-full bg-[#28704F]"></span>
                                       Active
                                    </span>
                                 </div>

                                 <p className="text-xs text-[#52606D] leading-relaxed">
                                    {dept.description || "No description provided."}
                                 </p>

                                 <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#87919B] mb-1.5">
                                       Routed Categories
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                       {Array.isArray(dept.categories) && dept.categories.length > 0 ? (
                                          dept.categories.map((cat) => (
                                             <span
                                                key={cat}
                                                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F3F2] text-[#52606D] border border-[#CBD2CF]"
                                             >
                                                {cat}
                                             </span>
                                          ))
                                       ) : (
                                          <span className="text-xs text-[#87919B] italic">None assigned</span>
                                       )}
                                    </div>
                                 </div>

                                 {/* Mobile Action Touch Cluster (>= 44px min-height) */}
                                 <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E6E4]">
                                    <button
                                       type="button"
                                       onClick={() => openEditModal(dept)}
                                       className="min-h-[44px] rounded-lg border border-[#CBD2CF] bg-white text-xs font-semibold text-[#173B5E] hover:bg-[#EEF4FA] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                       </svg>
                                       Edit
                                    </button>

                                    <button
                                       type="button"
                                       onClick={() => openDeactivateModal(dept)}
                                       className="min-h-[44px] rounded-lg border border-[#CBD2CF] bg-white text-xs font-semibold text-[#52606D] hover:bg-[#F1F3F2] focus:outline-none focus:ring-2 focus:ring-[#52606D]/30 flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                       </svg>
                                       Deactivate
                                    </button>

                                    <button
                                       type="button"
                                       onClick={() => openDeleteModal(dept)}
                                       className="min-h-[44px] rounded-lg border border-[#F3C5C5] bg-[#FBF0F0] text-xs font-semibold text-[#BA1A1A] hover:bg-[#F8DADA] focus:outline-none focus:ring-2 focus:ring-[#BA1A1A]/30 flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                       </svg>
                                       Delete
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </>
                  )}

                  {/* Roster Technical Footnote */}
                  
               </div>
            </section>

            {/* ========================================================================= */}
            {/* IN-PAGE ADMINISTRATIVE GOVERNANCE MODALS */}
            {/* ========================================================================= */}

            {/* MODAL 1: REGISTER DEPARTMENT (POST /api/departments) */}
            {isCreateModalOpen && (
               <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-register-title"
                  onClick={(e) => {
                     if (e.target === e.currentTarget) setIsCreateModalOpen(false);
                  }}
               >
                  <div className="bg-white border border-[#CBD2CF] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-xl relative my-8">
                     <div className="flex items-center justify-between pb-4 border-b border-[#E2E6E4]">
                        <div>
                           <span className="text-[11px] font-bold uppercase tracking-wider text-[#39756B]">
                              POST /api/departments
                           </span>
                           <h3 id="modal-register-title" className="font-bold text-lg text-[#17202A] mt-0.5">
                              Register Department
                           </h3>
                        </div>
                        <button
                           type="button"
                           onClick={() => setIsCreateModalOpen(false)}
                           className="w-8 h-8 rounded-lg text-[#52606D] hover:bg-[#F1F3F2] flex items-center justify-center transition-colors"
                           aria-label="Close dialog"
                        >
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                        </button>
                     </div>

                     {createError && (
                        <div className="mt-4 p-3 bg-[#FBF0F0] border border-[#F3C5C5] rounded-lg text-xs text-[#A44A4A] flex items-start gap-2">
                           <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                           <span>{createError}</span>
                        </div>
                     )}

                     <form onSubmit={handleCreateDepartment} className="space-y-4 mt-5">
                        {/* Department Name */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1">
                              Department Name <span className="text-[#BA1A1A]">*</span>
                           </label>
                           <input
                              type="text"
                              required
                              value={createFormData.fullname}
                              onChange={(e) =>
                                 setCreateFormData({ ...createFormData, fullname: e.target.value })
                              }
                              placeholder="e.g. Public Works Department"
                              className="w-full min-h-[44px] px-3.5 border border-[#CBD2CF] rounded-lg text-sm text-[#17202A] placeholder-[#87919B] focus:border-[#173B5E] focus:ring-2 focus:ring-[#173B5E]/20 outline-none transition-colors"
                           />
                           <span className="text-[11px] text-[#87919B] mt-1 block">
                              Full legal designation. Minimum 3 characters required.
                           </span>
                        </div>

                        {/* Department Code */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1">
                              Department Code <span className="text-[#BA1A1A]">*</span>
                           </label>
                           <input
                              type="text"
                              required
                              value={createFormData.code}
                              onChange={(e) =>
                                 setCreateFormData({
                                    ...createFormData,
                                    code: e.target.value.toUpperCase(),
                                 })
                              }
                              placeholder="e.g. PWD"
                              className="w-full min-h-[44px] px-3.5 font-mono uppercase border border-[#CBD2CF] rounded-lg text-sm text-[#17202A] placeholder-[#87919B] focus:border-[#173B5E] focus:ring-2 focus:ring-[#173B5E]/20 outline-none transition-colors"
                           />
                           <span className="text-[11px] text-[#87919B] mt-1 block">
                              Unique alphanumeric identifier (min 2 characters, auto-uppercase).
                           </span>
                        </div>

                        {/* Description */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1">
                              Description (Optional)
                           </label>
                           <textarea
                              rows={2}
                              value={createFormData.description}
                              onChange={(e) =>
                                 setCreateFormData({ ...createFormData, description: e.target.value })
                              }
                              placeholder="Operational mandate &amp; civil scope"
                              className="w-full p-3 border border-[#CBD2CF] rounded-lg text-sm text-[#17202A] placeholder-[#87919B] focus:border-[#173B5E] focus:ring-2 focus:ring-[#173B5E]/20 outline-none transition-colors resize-none"
                           />
                        </div>

                        {/* Complaint Routing Categories */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1.5">
                              Complaint Routing Categories
                           </label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#F7F7F5] border border-[#E2E6E4] rounded-lg">
                              {CANONICAL_CATEGORIES.map((cat) => {
                                 const isChecked = createFormData.categories.includes(cat);
                                 return (
                                    <label
                                       key={cat}
                                       className="flex items-center gap-2 cursor-pointer text-xs text-[#17202A] py-1 select-none"
                                    >
                                       <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleCategoryToggle(cat, false)}
                                          className="w-4 h-4 rounded border-[#CBD2CF] text-[#173B5E] focus:ring-[#173B5E]"
                                       />
                                       <span>{cat}</span>
                                    </label>
                                 );
                              })}
                           </div>
                           <span className="text-[11px] text-[#87919B] mt-1 block">
                              Canonical categories used by citizen intake triage.
                           </span>
                        </div>

                        {/* Operational Status */}
                        <div className="pt-1">
                           <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                              <input
                                 type="checkbox"
                                 checked={createFormData.isActive}
                                 onChange={(e) =>
                                    setCreateFormData({
                                       ...createFormData,
                                       isActive: e.target.checked,
                                    })
                                 }
                                 className="w-4 h-4 rounded border-[#CBD2CF] text-[#173B5E] focus:ring-[#173B5E]"
                              />
                              <span className="text-xs font-medium text-[#17202A]">
                                 Department is active for routing &amp; staff applications
                              </span>
                           </label>
                           {!createFormData.isActive && (
                              <p className="text-[11px] text-[#8A6D12] mt-0.5 ml-6">
                                 Notice: Since GET /api/departments only returns active departments, inactive records will not appear in the active roster view.
                              </p>
                           )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#E2E6E4]">
                           <button
                              type="button"
                              onClick={() => setIsCreateModalOpen(false)}
                              disabled={createSubmitting}
                              className="min-h-[44px] px-5 rounded-lg border border-[#CBD2CF] text-xs font-semibold text-[#17202A] hover:bg-[#F1F3F2] focus:outline-none focus:ring-2 focus:ring-[#CBD2CF] transition-colors"
                           >
                              Cancel
                           </button>
                           <button
                              type="submit"
                              disabled={createSubmitting}
                              className="min-h-[44px] px-6 rounded-lg bg-[#173B5E] hover:bg-[#122E4A] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#173B5E]/40 transition-colors shadow-xs disabled:opacity-50"
                           >
                              {createSubmitting ? "Registering…" : "+ Register Department"}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            )}

            {/* MODAL 2: EDIT DEPARTMENT (PATCH /api/departments/:id) */}
            {editingDepartment && (
               <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-edit-title"
                  onClick={(e) => {
                     if (e.target === e.currentTarget) setEditingDepartment(null);
                  }}
               >
                  <div className="bg-white border border-[#CBD2CF] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-xl relative my-8">
                     <div className="flex items-center justify-between pb-4 border-b border-[#E2E6E4]">
                        <div>
                           <span className="text-[11px] font-bold uppercase tracking-wider text-[#24527A]">
                              PATCH /api/departments/:id
                           </span>
                           <h3 id="modal-edit-title" className="font-bold text-lg text-[#17202A] mt-0.5">
                              Edit Department
                           </h3>
                        </div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EEF4FA] text-[#173B5E] border border-[#CBD2CF]">
                           {editingDepartment.code}
                        </span>
                     </div>

                     {editError && (
                        <div className="mt-4 p-3 bg-[#FBF0F0] border border-[#F3C5C5] rounded-lg text-xs text-[#A44A4A] flex items-start gap-2">
                           <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                           <span>{editError}</span>
                        </div>
                     )}

                     <form onSubmit={handleEditDepartment} className="space-y-4 mt-5">
                        {/* Department Name */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1">
                              Department Name <span className="text-[#BA1A1A]">*</span>
                           </label>
                           <input
                              type="text"
                              required
                              value={editFormData.fullname}
                              onChange={(e) =>
                                 setEditFormData({ ...editFormData, fullname: e.target.value })
                              }
                              className="w-full min-h-[44px] px-3.5 border border-[#CBD2CF] rounded-lg text-sm text-[#17202A] focus:border-[#173B5E] focus:ring-2 focus:ring-[#173B5E]/20 outline-none transition-colors"
                           />
                        </div>

                        {/* Department Code */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1">
                              Department Code <span className="text-[#BA1A1A]">*</span>
                           </label>
                           <input
                              type="text"
                              required
                              value={editFormData.code}
                              onChange={(e) =>
                                 setEditFormData({
                                    ...editFormData,
                                    code: e.target.value.toUpperCase(),
                                 })
                              }
                              className="w-full min-h-[44px] px-3.5 font-mono uppercase border border-[#CBD2CF] rounded-lg text-sm text-[#17202A] focus:border-[#173B5E] focus:ring-2 focus:ring-[#173B5E]/20 outline-none transition-colors"
                           />
                           <span className="text-[11px] text-[#87919B] mt-1 block">
                              Must remain unique across municipal records.
                           </span>
                        </div>

                        {/* Description */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1">
                              Description
                           </label>
                           <textarea
                              rows={2}
                              value={editFormData.description}
                              onChange={(e) =>
                                 setEditFormData({ ...editFormData, description: e.target.value })
                              }
                              className="w-full p-3 border border-[#CBD2CF] rounded-lg text-sm text-[#17202A] focus:border-[#173B5E] focus:ring-2 focus:ring-[#173B5E]/20 outline-none transition-colors resize-none"
                           />
                        </div>

                        {/* Complaint Routing Categories */}
                        <div>
                           <label className="block text-xs font-bold uppercase tracking-wider text-[#52606D] mb-1.5">
                              Complaint Routing Categories
                           </label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#F7F7F5] border border-[#E2E6E4] rounded-lg">
                              {CANONICAL_CATEGORIES.map((cat) => {
                                 const isChecked = editFormData.categories.includes(cat);
                                 return (
                                    <label
                                       key={cat}
                                       className="flex items-center gap-2 cursor-pointer text-xs text-[#17202A] py-1 select-none"
                                    >
                                       <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleCategoryToggle(cat, true)}
                                          className="w-4 h-4 rounded border-[#CBD2CF] text-[#173B5E] focus:ring-[#173B5E]"
                                       />
                                       <span>{cat}</span>
                                    </label>
                                 );
                              })}
                           </div>
                        </div>

                        {/* Operational Status */}
                        <div className="pt-1">
                           <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                              <input
                                 type="checkbox"
                                 checked={editFormData.isActive}
                                 onChange={(e) =>
                                    setEditFormData({
                                       ...editFormData,
                                       isActive: e.target.checked,
                                    })
                                 }
                                 className="w-4 h-4 rounded border-[#CBD2CF] text-[#173B5E] focus:ring-[#173B5E]"
                              />
                              <span className="text-xs font-medium text-[#17202A]">
                                 Operational Status (Active)
                              </span>
                           </label>
                        </div>

                        {/* Timestamp Attribution */}
                        {editingDepartment.updatedAt && (
                           <div className="p-3 bg-[#F1F3F2] border border-[#CBD2CF] rounded-lg text-xs text-[#52606D] flex items-center justify-between">
                              <span>Last updated: {formatDateTime(editingDepartment.updatedAt)}</span>
                              <span className="font-mono text-[11px] text-[#17202A]">
                                 ID: {editingDepartment._id.slice(-6)}
                              </span>
                           </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#E2E6E4]">
                           <button
                              type="button"
                              onClick={() => setEditingDepartment(null)}
                              disabled={editSubmitting}
                              className="min-h-[44px] px-5 rounded-lg border border-[#CBD2CF] text-xs font-semibold text-[#17202A] hover:bg-[#F1F3F2] focus:outline-none focus:ring-2 focus:ring-[#CBD2CF] transition-colors"
                           >
                              Cancel
                           </button>
                           <button
                              type="submit"
                              disabled={editSubmitting}
                              className="min-h-[44px] px-6 rounded-lg bg-[#39756B] hover:bg-[#28574F] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#39756B]/40 transition-colors shadow-xs disabled:opacity-50"
                           >
                              {editSubmitting ? "Saving…" : "Save Changes"}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            )}

            {/* MODAL 3: DEACTIVATE CONFIRMATION (PATCH /api/departments/:id with isActive: false) */}
            {deactivatingDepartment && (
               <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-deactivate-title"
                  onClick={(e) => {
                     if (e.target === e.currentTarget) setDeactivatingDepartment(null);
                  }}
               >
                  <div className="bg-white border border-[#CBD2CF] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-xl relative my-8 space-y-4">
                     <div className="flex items-center gap-3 pb-4 border-b border-[#E2E6E4]">
                        <div className="w-10 h-10 rounded-lg bg-[#EEF4FA] text-[#24527A] flex items-center justify-center border border-[#CBD2CF]">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                        </div>
                        <div>
                           <span className="text-[11px] font-bold uppercase tracking-wider text-[#52606D]">
                              LIFECYCLE STATUS
                           </span>
                           <h3 id="modal-deactivate-title" className="font-bold text-base sm:text-lg text-[#17202A]">
                              Deactivate Department?
                           </h3>
                        </div>
                     </div>

                     {deactivateError && (
                        <div className="p-3 bg-[#FBF0F0] border border-[#F3C5C5] rounded-lg text-xs text-[#A44A4A]">
                           {deactivateError}
                        </div>
                     )}

                     <p className="text-xs sm:text-sm text-[#17202A] leading-relaxed">
                        You are about to change <span className="font-semibold">{deactivatingDepartment.fullname} [{deactivatingDepartment.code}]</span> status to inactive (<code className="font-mono text-xs bg-[#F1F3F2] px-1 py-0.5 rounded border border-[#CBD2CF]">isActive: false</code>).
                     </p>

                     <div className="p-4 bg-[#F1F3F5] border-l-4 border-[#52606D] rounded-r text-xs text-[#52606D] leading-relaxed space-y-1">
                        <div className="font-bold text-[#17202A] flex items-center gap-1.5">
                           <svg className="w-4 h-4 text-[#52606D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           Institutional Policy Clarification
                        </div>
                        <p>
                           This will remove the department from the active municipal department list used for new department selections. Existing records are not deleted.
                        </p>
                     </div>

                     <div className="text-[11px] text-[#87919B]">
                        Note: Because GET /api/departments synchronizes active records only, this department will not appear in the active roster upon refresh.
                     </div>

                     <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E6E4]">
                        <button
                           type="button"
                           onClick={() => setDeactivatingDepartment(null)}
                           disabled={deactivateSubmitting}
                           className="min-h-[44px] px-5 rounded-lg border border-[#CBD2CF] text-xs font-semibold text-[#17202A] hover:bg-[#F1F3F2] focus:outline-none focus:ring-2 focus:ring-[#CBD2CF] transition-colors"
                        >
                           Cancel
                        </button>
                        <button
                           type="button"
                           onClick={handleDeactivateDepartment}
                           disabled={deactivateSubmitting}
                           className="min-h-[44px] px-6 rounded-lg bg-[#52606D] hover:bg-[#43474E] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#52606D]/40 transition-colors shadow-xs disabled:opacity-50"
                        >
                           {deactivateSubmitting ? "Deactivating…" : "Deactivate Department"}
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* MODAL 4: PERMANENT DELETE (DELETE /api/departments/:id — HIGH FRICTION DESTRUCTIVE CONFIRMATION) */}
            {deletingDepartment && (
               <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-delete-title"
                  onClick={(e) => {
                     if (e.target === e.currentTarget) setDeletingDepartment(null);
                  }}
               >
                  <div className="bg-white border-2 border-[#BA1A1A] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8 space-y-4">
                     <div className="flex items-center gap-3 pb-4 border-b border-[#E2E6E4]">
                        <div className="w-10 h-10 rounded-lg bg-[#FBF0F0] text-[#A44A4A] flex items-center justify-center border border-[#F3C5C5]">
                           <svg className="w-5 h-5 text-[#BA1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                        </div>
                        <div>
                           <span className="text-[11px] font-bold uppercase tracking-wider text-[#BA1A1A]">
                              DELETE /api/departments/:id
                           </span>
                           <h3 id="modal-delete-title" className="font-bold text-base sm:text-lg text-[#BA1A1A]">
                              Permanently Delete Department?
                           </h3>
                        </div>
                     </div>

                     {deleteError && (
                        <div className="p-3 bg-[#FBF0F0] border border-[#F3C5C5] rounded-lg text-xs text-[#A44A4A]">
                           {deleteError}
                        </div>
                     )}

                     <div className="space-y-2 text-xs sm:text-sm text-[#17202A]">
                        <p className="font-semibold text-sm">
                           You are initiating permanent database removal of:
                        </p>
                        <div className="p-3 bg-[#F7F7F5] border border-[#CBD2CF] rounded-lg font-mono text-xs flex justify-between items-center">
                           <span className="font-bold text-[#17202A]">{deletingDepartment.fullname}</span>
                           <span className="bg-[#EEF4FA] text-[#173B5E] px-2 py-0.5 rounded border border-[#CBD2CF]">
                              {deletingDepartment.code}
                           </span>
                        </div>
                     </div>

                     {/* Warning Banner */}
                     <div className="p-4 bg-[#FBF0F0] border border-[#F3C5C5] rounded-xl text-xs text-[#17202A] space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-[#BA1A1A]">
                           <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                           Warning: This permanently removes the department from the database.
                        </div>
                        <p className="text-[#52606D] leading-relaxed">
                           Existing complaints, staff records, or staff requests may still reference this department. The current backend does not perform dependency checks or cleanup when deleting a department.
                        </p>
                     </div>

                     {/* Safe Alternative Recommendation */}
                     <div className="p-3.5 bg-[#EEF4FA] border border-[#CBD2CF] rounded-xl text-xs text-[#24527A] flex items-start gap-2">
                        <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#173B5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="leading-relaxed">
                           <strong className="font-semibold text-[#173B5E]">Recommended alternative:</strong> Deactivate the department instead if it should no longer appear in active municipal selections.
                        </p>
                     </div>

                     {/* Actions */}
                     <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E6E4]">
                        <button
                           type="button"
                           onClick={() => setDeletingDepartment(null)}
                           disabled={deleteSubmitting}
                           className="min-h-[44px] px-5 rounded-lg border border-[#CBD2CF] text-xs font-semibold text-[#17202A] hover:bg-[#F1F3F2] focus:outline-none focus:ring-2 focus:ring-[#CBD2CF] transition-colors"
                        >
                           Cancel
                        </button>
                        <button
                           type="button"
                           onClick={handleDeleteDepartment}
                           disabled={deleteSubmitting}
                           className="min-h-[44px] px-6 rounded-lg bg-[#BA1A1A] hover:bg-[#93000A] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#BA1A1A]/40 transition-colors shadow-xs disabled:opacity-50"
                        >
                           {deleteSubmitting ? "Deleting…" : "Delete Permanently"}
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default AdminDashboard;