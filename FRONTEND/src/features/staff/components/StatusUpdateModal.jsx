import { useState } from "react";

const StatusUpdateModal = ({ isOpen, currentStatus, onClose, onSubmit, loading = false, error = "" }) => {
   const [status, setStatus] = useState("");
   const [remark, setRemark] = useState("");
   if (!isOpen) return null;

   const submit = async (event) => {
      event.preventDefault();
      if (status) await onSubmit?.({ newStatus: status, remark });
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4" role="dialog" aria-modal="true">
         <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-primary-text">Update Status</h2>
            <p className="mt-1 text-sm text-secondary-text">Current status: <span className="capitalize">{currentStatus?.replaceAll("_", " ")}</span></p>
            <label className="mt-5 block text-sm text-secondary-text">New status
               <select required value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text">
                  <option value="">Select status</option><option value="in_progress">In progress</option><option value="closed">Closed</option>
               </select>
            </label>
            <label className="mt-4 block text-sm text-secondary-text">Remark
               <textarea value={remark} onChange={(event) => setRemark(event.target.value)} rows="3" className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text" />
            </label>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-border px-4 py-2 text-sm text-primary-text">Cancel</button><button type="submit" disabled={loading || !status} className="rounded bg-primary-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-50">{loading ? "Saving..." : "Save status"}</button></div>
         </form>
      </div>
   );
};

export default StatusUpdateModal;
