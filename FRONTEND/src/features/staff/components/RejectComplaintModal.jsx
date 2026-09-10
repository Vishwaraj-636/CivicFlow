import { useState } from "react";

const REASONS = ['Wrong department', 'Insufficient information', 'Invalid complaint', 'Duplicate complaint', 'Not actionable'];

const RejectComplaintModal = ({ isOpen, onClose, onSubmit, loading = false, error = "" }) => {
   const [reason, setReason] = useState("");
   if (!isOpen) return null;

   const submit = async (event) => { event.preventDefault(); if (reason) await onSubmit?.(reason); };
   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4" role="dialog" aria-modal="true">
         <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-primary-text">Reject Complaint</h2>
            <label className="mt-5 block text-sm text-secondary-text">Reason
               <select required value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text"><option value="">Select a reason</option>{REASONS.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </label>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-border px-4 py-2 text-sm text-primary-text">Cancel</button><button type="submit" disabled={loading || !reason} className="rounded bg-danger px-4 py-2 text-sm font-semibold text-background disabled:opacity-50">{loading ? "Rejecting..." : "Reject complaint"}</button></div>
         </form>
      </div>
   );
};

export default RejectComplaintModal;
