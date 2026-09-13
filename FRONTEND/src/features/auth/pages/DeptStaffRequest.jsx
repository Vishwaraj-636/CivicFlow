import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDepartments, createStaffRequest, getMyStaffRequest } from '../services/staffRequest.api';
import { useAuth } from '../hook/useAuth';

const DeptStaffRequest = () => {
   const { user } = useAuth();
   const navigate = useNavigate();

   const [departments, setDepartments] = useState([]);
   const [departmentId, setDepartmentId] = useState('');
   const [staffNumber, setStaffNumber] = useState('');
   const [loadingDepts, setLoadingDepts] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   // Existing request status state
   const [existingRequest, setExistingRequest] = useState(null);
   const [loadingRequest, setLoadingRequest] = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   const fetchStaffRequest = async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoadingRequest(true);
      try {
         const data = await getMyStaffRequest();
         if (data && data.request) {
            setExistingRequest(data.request);
         } else {
            setExistingRequest(null);
         }
      } catch (err) {
         if (err.response?.status === 404) {
            setExistingRequest(null);
         } else {
            console.error('Failed to fetch staff request:', err);
         }
      } finally {
         if (isRefresh) setRefreshing(false);
         else setLoadingRequest(false);
      }
   };

   useEffect(() => {
      setLoadingDepts(true);
      getDepartments()
         .then((data) => {
            const list = Array.isArray(data) ? data : data?.departments ?? [];
            setDepartments(list.filter((d) => d.isActive !== false));
         })
         .catch(() => setError('Unable to load departments. Please try again.'))
         .finally(() => setLoadingDepts(false));

      fetchStaffRequest();
   }, []);

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!departmentId) {
         setError('Please select a department.');
         return;
      }
      setError('');
      setSubmitting(true);
      try {
         await createStaffRequest({ departmentId });
         setSuccess('Your staff access request has been submitted for administrative review.');
         setDepartmentId('');
         // Fetch the newly submitted request to show the pending dossier
         await fetchStaffRequest();
      } catch (err) {
         setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
      } finally {
         setSubmitting(false);
      }
   };

   const userInitials = user?.fullname
      ? user.fullname.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'CF';

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#F7F7F5] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 text-[#17202A] font-sans selection:bg-[#173B5E]/10">
         <div className="w-full max-w-2xl relative z-10 my-4 sm:my-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E2E6E4] shadow-sm">

               {/* Alerts */}
               {error && (
                  <div className="mb-6 p-3.5 rounded-lg bg-[#FBF0F0] border border-[#F3C5C5] text-[#A44A4A] text-xs font-medium flex items-start gap-2.5">
                     <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#A44A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                     <span className="leading-snug">{error}</span>
                  </div>
               )}

               {success && (
                  <div className="mb-6 p-3.5 rounded-lg bg-[#ECF5F0] border border-[#C6E7D5] text-[#28704F] text-xs font-medium flex items-start gap-2.5">
                     <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#28704F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <span className="leading-snug">{success}</span>
                  </div>
               )}

               {/* Loading State for Existing Request */}
               {loadingRequest ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                     <svg className="w-6 h-6 text-[#173B5E] animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                     </svg>
                     <p className="text-xs font-mono text-[#87919B]">Checking staff accession records…</p>
                  </div>
               ) : existingRequest ? (
                  /* ========================================================================= */
                  /* SECTION: CITIZEN-FACING STAFF APPLICATION STATUS DOSSIERS                 */
                  /* ========================================================================= */
                  <div>
                     {/* STATE A: PENDING */}
                     {existingRequest.status === 'pending' && (
                        <div className="rounded-xl border border-[#E2E6E4] p-6 bg-white relative overflow-hidden">
                           <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>

                           <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-[#FEF8EB] text-[#8E5A0B] border border-[#F9E2AF]">
                                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                 Pending Review
                              </span>
                              <span className="text-[11px] font-mono text-[#87919B]">
                                 State: 202-PENDING
                              </span>
                           </div>

                           <div className="mb-4">
                              <p className="text-xs font-mono text-[#87919B] uppercase tracking-wider">Nominated Division</p>
                              <h3 className="font-bold text-lg text-[#17202A] mt-0.5">
                                 {existingRequest.departmentId?.fullname || existingRequest.departmentId?.name || 'Department'}
                              </h3>
                              <p className="text-xs text-[#52606D] font-mono mt-0.5">
                                 Docket: #REQ-{existingRequest._id ? existingRequest._id.slice(-6).toUpperCase() : 'PENDING'}
                              </p>
                           </div>

                           <p className="text-xs text-[#52606D] leading-relaxed bg-[#F1F3F2]/70 p-3.5 rounded-lg border border-[#E2E6E4] mb-4">
                              Your staff access request is currently awaiting administrative review.
                           </p>

                           <div className="space-y-2 border-t border-[#E2E6E4] pt-3 text-xs">
                              <div className="flex justify-between py-0.5">
                                 <span className="text-[#87919B]">Submission Date:</span>
                                 <span className="font-mono text-[#17202A]">
                                    {existingRequest.createdAt
                                       ? new Date(existingRequest.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                       : 'Recent'}
                                 </span>
                              </div>
                              <div className="flex justify-between py-0.5">
                                 <span className="text-[#87919B]">Current Status:</span>
                                 <span className="font-medium text-[#52606D]">Administrative Review in Progress</span>
                              </div>
                           </div>

                           <div className="mt-6 pt-4 border-t border-[#E2E6E4] flex flex-col sm:flex-row gap-3">
                              <button
                                 type="button"
                                 onClick={() => fetchStaffRequest(true)}
                                 disabled={refreshing}
                                 className="flex-1 min-h-[44px] px-4 py-2 bg-[#F1F3F2] hover:bg-[#EEF4FA] border border-[#E2E6E4] text-[#17202A] text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                              >
                                 <svg className={`w-3.5 h-3.5 text-[#52606D] ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                 </svg>
                                 <span>{refreshing ? 'Refreshing Status…' : 'Refresh Status'}</span>
                              </button>
                              <Link
                                 to="/dashboard"
                                 className="min-h-[44px] px-4 py-2 bg-white hover:bg-[#F1F3F2] border border-[#CBD2CF] text-[#52606D] hover:text-[#17202A] text-xs font-semibold rounded-lg flex items-center justify-center transition-colors"
                              >
                                 Return to Dashboard
                              </Link>
                           </div>
                        </div>
                     )}

                     {/* STATE B: APPROVED */}
                     {existingRequest.status === 'approved' && (
                        <div className="rounded-xl border border-[#E2E6E4] p-6 bg-white relative overflow-hidden">
                           <div className="absolute top-0 left-0 right-0 h-1 bg-green-600"></div>

                           <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-[#EBF7F2] text-[#1B6A47] border border-[#BDE5D4]">
                                 <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                 </svg>
                                 Access Approved
                              </span>
                              <span className="text-[11px] font-mono text-[#87919B]">
                                 State: 200-ACTIVE
                              </span>
                           </div>

                           <div className="mb-4">
                              <p className="text-xs font-mono text-[#87919B] uppercase tracking-wider">Authorized Division</p>
                              <h3 className="font-bold text-lg text-[#17202A] mt-0.5">
                                 {existingRequest.departmentId?.fullname || existingRequest.departmentId?.name || 'Department Staff'}
                              </h3>
                              <p className="text-xs text-[#39756B] font-mono font-medium mt-0.5">
                                 Role Elevation: dept_staff
                              </p>
                           </div>

                           <p className="text-xs text-[#52606D] leading-relaxed bg-[#F1F3F2]/70 p-3.5 rounded-lg border border-[#E2E6E4] mb-4">
                              Your staff nomination has been approved. Your account has been elevated to <span className="font-mono font-semibold text-[#17202A]">Department Staff (dept_staff)</span> and assigned to the selected department.
                           </p>

                           <div className="space-y-2 border-t border-[#E2E6E4] pt-3 text-xs">
                              <div className="flex justify-between py-0.5">
                                 <span className="text-[#87919B]">Authorized Account:</span>
                                 <span className="font-medium text-[#17202A]">{user?.email || existingRequest.email}</span>
                              </div>
                              {existingRequest.reviewedAt && (
                                 <div className="flex justify-between py-0.5">
                                    <span className="text-[#87919B]">Approval Date:</span>
                                    <span className="font-mono text-[#17202A]">
                                       {new Date(existingRequest.reviewedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                 </div>
                              )}
                           </div>

                           <div className="mt-6 pt-4 border-t border-[#E2E6E4] flex flex-col sm:flex-row gap-3">
                              <button
                                 type="button"
                                 onClick={() => navigate('/staff')}
                                 className="flex-1 min-h-[44px] px-4 py-2.5 bg-[#173B5E] hover:bg-[#122E4A] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                              >
                                 <span>Enter Staff Workspace</span>
                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                 </svg>
                              </button>
                              <Link
                                 to="/dashboard"
                                 className="min-h-[44px] px-4 py-2 bg-white hover:bg-[#F1F3F2] border border-[#CBD2CF] text-[#52606D] hover:text-[#17202A] text-xs font-semibold rounded-lg flex items-center justify-center transition-colors"
                              >
                                 Return to Dashboard
                              </Link>
                           </div>
                        </div>
                     )}

                     {/* STATE C: REJECTED */}
                     {existingRequest.status === 'rejected' && (
                        <div className="rounded-xl border border-[#E2E6E4] p-6 bg-white relative overflow-hidden">
                           <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>

                           <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-[#FBF0F0] text-[#A44A4A] border border-[#F3C5C5]">
                                 <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" />
                                 </svg>
                                 Application Dismissed
                              </span>
                              <span className="text-[11px] font-mono text-[#87919B]">
                                 State: 403-DISMISSED
                              </span>
                           </div>

                           <div className="mb-4">
                              <p className="text-xs font-mono text-[#87919B] uppercase tracking-wider">Target Department</p>
                              <h3 className="font-bold text-lg text-[#17202A] mt-0.5">
                                 {existingRequest.departmentId?.fullname || existingRequest.departmentId?.name || 'Department'}
                              </h3>
                              <p className="text-xs text-[#A44A4A] font-mono mt-0.5">
                                 Status: Request Rejected
                              </p>
                           </div>

                           <p className="text-xs text-[#52606D] leading-relaxed mb-3">
                              Your staff access request was rejected by municipal administration.
                           </p>

                           {/* Rejection Reason Box */}
                           <div className="p-3.5 rounded-lg bg-[#FBF0F0] border border-[#F3C5C5] text-[#A44A4A] text-xs leading-relaxed mb-4">
                              <div className="flex items-start gap-2">
                                 <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#A44A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                                 <div>
                                    <span className="font-bold uppercase font-mono tracking-wider block text-[10px] mb-1">
                                       Rejection Reason:
                                    </span>
                                    {existingRequest.rejectionReason || 'Applicant nomination could not be verified by municipal administration.'}
                                 </div>
                              </div>
                           </div>

                           {existingRequest.reviewedAt && (
                              <div className="space-y-2 border-t border-[#E2E6E4] pt-3 text-xs mb-4">
                                 <div className="flex justify-between py-0.5">
                                    <span className="text-[#87919B]">Review Decision Date:</span>
                                    <span className="font-mono text-[#17202A]">
                                       {new Date(existingRequest.reviewedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                 </div>
                              </div>
                           )}

                           <div className="mt-6 pt-4 border-t border-[#E2E6E4] flex flex-col sm:flex-row gap-3">
                              <Link
                                 to="/dashboard"
                                 className="flex-1 min-h-[44px] px-4 py-2.5 bg-white hover:bg-[#F1F3F2] border border-[#CBD2CF] text-[#17202A] text-xs font-semibold rounded-lg flex items-center justify-center transition-colors"
                              >
                                 Return to Dashboard
                              </Link>
                           </div>
                        </div>
                     )}
                  </div>
               ) : (
                  /* ========================================================================= */
                  /* SECTION: STAFF ACCESS REQUEST FORM (Nomination)                           */
                  /* ========================================================================= */
                  <div>
                     {/* Header */}
                     <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase font-mono text-[#39756B] bg-[#EBF7F2] border border-[#BDE5D4]">
                              Civil Service Nomination
                           </span>
                           <span className="text-[11px] font-mono text-[#87919B]">CF-STAFF-REQ</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17202A]">
                           Apply for Department Staff Access
                        </h1>
                        <p className="mt-1 text-sm text-[#52606D] leading-relaxed">
                           Citizens can request department staff access for administrative review and, if approved, access departmental complaint processing tools.
                        </p>
                     </div>

                     <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Applicant Identity Context Bar */}
                        <div className="p-3.5 rounded-lg bg-[#F1F3F2] border border-[#E2E6E4] flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6E4] flex items-center justify-center text-[#173B5E] font-bold text-xs font-mono">
                                 {userInitials}
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-[#17202A]">{user?.fullname || 'Citizen Applicant'}</p>
                                 <p className="text-[11px] text-[#52606D] font-mono">{user?.email || 'citizen@municipal.gov'}</p>
                              </div>
                           </div>
                           <span className="text-xs font-mono bg-white border border-[#E2E6E4] px-2 py-0.5 rounded text-[#52606D]">
                              Current: {user?.role || 'Citizen'}
                           </span>
                        </div>

                        {/* Department Dropdown Selection (GET /api/departments) */}
                        <div>
                           <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase" htmlFor="departmentId">
                                 Target Department <span className="text-red-600">*</span>
                              </label>
                              <span className="text-[11px] font-mono text-[#39756B]">GET /api/departments</span>
                           </div>
                           {loadingDepts ? (
                              <div className="w-full min-h-[44px] bg-[#F1F3F2] border border-[#CBD2CF] rounded-lg px-3.5 py-2.5 text-[#87919B] text-sm flex items-center">
                                 Loading municipal departments…
                              </div>
                           ) : (
                              <div className="relative">
                                 <select
                                    id="departmentId"
                                    name="departmentId"
                                    value={departmentId}
                                    onChange={(e) => { setDepartmentId(e.target.value); setError(''); }}
                                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] appearance-none cursor-pointer pr-10"
                                    required
                                 >
                                    <option value="" disabled>Select a department</option>
                                    {departments.map((dept) => (
                                       <option key={dept._id} value={dept._id}>
                                          {dept.fullname || dept.name}
                                       </option>
                                    ))}
                                 </select>
                                 <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#52606D]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                 </div>
                              </div>
                           )}
                           <p className="mt-1.5 text-xs text-[#87919B]">
                              Select the municipal division coordinating your complaint processing responsibilities.
                           </p>
                        </div>

                        {/* Optional Staff Identifier */}
                        <div>
                           <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-1.5" htmlFor="staffNumber">
                              Employee ID / Staff Number (Optional)
                           </label>
                           <input
                              type="text"
                              id="staffNumber"
                              name="staffNumber"
                              value={staffNumber}
                              onChange={(e) => setStaffNumber(e.target.value)}
                              className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] font-mono transition-colors"
                              placeholder="e.g. EMP-10492"
                           />
                        </div>

                        {/* Administrative Protocol Notice */}
                        <div className="p-4 rounded-lg bg-[#EEF4FA] border border-[#CBD2CF]/60 flex items-start gap-3">
                           <svg className="w-5 h-5 text-[#173B5E] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                           <div className="text-xs text-[#52606D] leading-relaxed">
                              <p className="font-semibold text-[#17202A] mb-0.5">Administrative Review Protocol</p>
                              Staff nominations require manual review and administrative verification by an authorized municipal administrator under staff access governance.
                           </div>
                        </div>

                        {/* Submit Button */}
                        <button
                           type="submit"
                           disabled={submitting || loadingDepts || !departmentId}
                           className="w-full min-h-[44px] px-5 py-2.5 bg-[#173B5E] hover:bg-[#122E4A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                           {submitting ? (
                              <>
                                 <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                 </svg>
                                 <span>Submitting Request…</span>
                              </>
                           ) : (
                              <>
                                 <span>Submit Staff Access Request</span>
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                              </>
                           )}
                        </button>
                     </form>

                     {/* Footer */}
                     <div className="mt-8 pt-5 border-t border-[#E2E6E4] text-center">
                        <p className="text-sm text-[#52606D]">
                           Changed your mind?{' '}
                           <Link to="/dashboard" className="text-[#173B5E] hover:underline font-medium ml-1">
                              Go back to dashboard
                           </Link>
                        </p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default DeptStaffRequest;