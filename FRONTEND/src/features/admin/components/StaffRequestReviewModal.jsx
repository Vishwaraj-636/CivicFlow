import React, { useEffect, useRef, useState } from 'react';
import { approveStaffRequest, rejectStaffRequest } from '../services/staffRequest.api';

/* ─────────────────────────── Approve Modal ─────────────────────────── */
const ApproveModal = ({ request, onClose, onSuccess }) => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const applicantName = request?.applicant?.fullname ?? '—';
   const departmentName = request?.department?.name ?? request?.department?.fullname ?? '—';

   const handleApprove = async () => {
      setLoading(true);
      setError('');
      try {
         await approveStaffRequest(request._id);
         onSuccess('Request approved successfully.');
      } catch (err) {
         setError(err.response?.data?.message || 'Failed to approve request.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-6">
         {/* Icon */}
         <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
               <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
         </div>

         {/* Title */}
         <div className="text-center">
            <h2 className="text-xl font-semibold text-primary-text">Approve Staff Request?</h2>
            <p className="text-sm text-secondary-text mt-1">Review the details before confirming.</p>
         </div>

         {/* Details */}
         <div className="bg-surface-secondary/50 border border-border/60 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
               <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-text">Applicant</span>
               <span className="text-sm font-semibold text-primary-text">{applicantName}</span>
            </div>
            <div className="h-px bg-border/40" />
            <div className="flex justify-between items-center">
               <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-text">Department</span>
               <span className="text-sm font-semibold text-primary-text">{departmentName}</span>
            </div>
         </div>

         {/* Role upgrade note */}
         <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-400 text-xs leading-relaxed">
               This will upgrade the user's role from <span className="font-mono font-semibold">citizen</span> to{' '}
               <span className="font-mono font-semibold">dept_staff</span> and assign them to{' '}
               <span className="font-semibold">{departmentName}</span>.
            </p>
         </div>

         {/* Error */}
         {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
               {error}
            </div>
         )}

         {/* Actions */}
         <div className="flex gap-3 pt-1">
            <button
               onClick={onClose}
               disabled={loading}
               className="flex-1 py-2.5 text-sm font-semibold text-secondary-text border border-border rounded-xl hover:bg-surface-secondary/50 transition-colors cursor-pointer disabled:opacity-50"
            >
               Cancel
            </button>
            <button
               onClick={handleApprove}
               disabled={loading}
               className="flex-1 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
               {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
               ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
               )}
               Approve
            </button>
         </div>
      </div>
   );
};

/* ─────────────────────────── Reject Modal ─────────────────────────── */
const RejectModal = ({ request, onClose, onSuccess }) => {
   const [rejectionReason, setRejectionReason] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const textareaRef = useRef(null);

   useEffect(() => {
      textareaRef.current?.focus();
   }, []);

   const handleReject = async () => {
      if (!rejectionReason.trim()) {
         setError('Please provide a rejection reason.');
         return;
      }
      setLoading(true);
      setError('');
      try {
         await rejectStaffRequest(request._id, rejectionReason.trim());
         onSuccess('Request rejected successfully.');
      } catch (err) {
         setError(err.response?.data?.message || 'Failed to reject request.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-6">
         {/* Icon */}
         <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
               <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
         </div>

         {/* Title */}
         <div className="text-center">
            <h2 className="text-xl font-semibold text-primary-text">Reject Staff Request</h2>
            <p className="text-sm text-secondary-text mt-1">
               Rejecting request from <span className="text-primary-text font-medium">{request?.applicant?.fullname ?? '—'}</span>
            </p>
         </div>

         {/* Rejection Reason */}
         <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1">
               Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
               ref={textareaRef}
               value={rejectionReason}
               onChange={(e) => { setRejectionReason(e.target.value); setError(''); }}
               rows={3}
               maxLength={300}
               className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-4 py-3 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-red-500/60 focus:border-red-500/40 transition-all duration-200 resize-none"
               placeholder="Provide a reason for rejection…"
            />
            <div className="flex justify-between items-center px-1">
               <p className="text-xs text-muted-text/70">The rejection reason will be recorded and may be shared with the applicant.</p>
               <span className="text-xs text-muted-text/50 shrink-0 ml-2">{rejectionReason.length}/300</span>
            </div>
         </div>

         {/* Error */}
         {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
               {error}
            </div>
         )}

         {/* Actions */}
         <div className="flex gap-3 pt-1">
            <button
               onClick={onClose}
               disabled={loading}
               className="flex-1 py-2.5 text-sm font-semibold text-secondary-text border border-border rounded-xl hover:bg-surface-secondary/50 transition-colors cursor-pointer disabled:opacity-50"
            >
               Cancel
            </button>
            <button
               onClick={handleReject}
               disabled={loading}
               className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
               {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
               ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
               )}
               Reject
            </button>
         </div>
      </div>
   );
};

/* ─────────────────────── StaffRequestReviewModal ─────────────────────── */
/**
 * @param {'approve' | 'reject' | null} mode
 * @param {object | null} request  — the staff request being reviewed
 * @param {() => void} onClose
 * @param {(message: string) => void} onSuccess — called after a successful action
 */
const StaffRequestReviewModal = ({ mode, request, onClose, onSuccess }) => {
   if (!mode || !request) return null;

   // Trap focus and close on Escape
   const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
   };

   return (
      <div
         className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onKeyDown={handleKeyDown}
      >
         {/* Backdrop */}
         <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
         />

         {/* Modal */}
         <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl z-10">
            {/* Close button */}
            <button
               onClick={onClose}
               className="absolute top-4 right-4 text-muted-text hover:text-primary-text transition-colors cursor-pointer"
               aria-label="Close"
            >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>

            {mode === 'approve' ? (
               <ApproveModal request={request} onClose={onClose} onSuccess={onSuccess} />
            ) : (
               <RejectModal request={request} onClose={onClose} onSuccess={onSuccess} />
            )}
         </div>
      </div>
   );
};

export default StaffRequestReviewModal;

