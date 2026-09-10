import { useState } from "react";

const ResolveComplaintModal = ({ isOpen, onClose, onSubmit, loading = false, error = "" }) => {
   const [resolutionDescription, setResolutionDescription] = useState("");
   const [resolutionMedia, setResolutionMedia] = useState([]);
   if (!isOpen) return null;

   const submit = async (event) => {
      event.preventDefault();
      if (resolutionDescription.trim()) await onSubmit?.({ resolutionDescription: resolutionDescription.trim(), resolutionMedia });
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4" role="dialog" aria-modal="true">
         <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-primary-text">Resolve Complaint</h2>
            <label className="mt-5 block text-sm text-secondary-text">Resolution description
               <textarea required value={resolutionDescription} onChange={(event) => setResolutionDescription(event.target.value)} rows="4" placeholder="Describe the action taken" className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text" />
            </label>
            <label className="mt-4 block text-sm text-secondary-text">Resolution evidence
               <input type="file" multiple accept="image/*,video/*" onChange={(event) => setResolutionMedia([...event.target.files])} className="mt-1 block w-full text-sm text-secondary-text" />
            </label>
            {resolutionMedia.length > 0 && <p className="mt-2 text-xs text-muted-text">{resolutionMedia.length} file(s) selected</p>}
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-border px-4 py-2 text-sm text-primary-text">Cancel</button><button type="submit" disabled={loading || !resolutionDescription.trim()} className="rounded bg-primary-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-50">{loading ? "Resolving..." : "Resolve complaint"}</button></div>
         </form>
      </div>
   );
};

export default ResolveComplaintModal;
