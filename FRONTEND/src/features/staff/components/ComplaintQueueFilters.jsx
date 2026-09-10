import { COMPLAINT_CATEGORIES } from "../../../constants/complaintCategories";

const ComplaintQueueFilters = ({ value = {}, onChange }) => {
   const filters = { status: "", priority: "", category: "", date: "", ...value };
   const update = (field, nextValue) => onChange?.({ ...filters, [field]: nextValue });

   return (
      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
         <label className="text-sm text-secondary-text">Status
            <select value={filters.status} onChange={(event) => update("status", event.target.value)} className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text">
               <option value="">All statuses</option>
               {['submitted', 'assigned', 'in_review', 'in_progress', 'resolved', 'rejected', 'closed'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
         </label>
         <label className="text-sm text-secondary-text">Priority
            <select value={filters.priority} onChange={(event) => update("priority", event.target.value)} className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text">
               <option value="">All priorities</option>
               {['low', 'medium', 'high', 'urgent'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
         </label>
         <label className="text-sm text-secondary-text">Category
            <select value={filters.category} onChange={(event) => update("category", event.target.value)} className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text">
               <option value="">All categories</option>
               {COMPLAINT_CATEGORIES.map(({ id, label }) => <option key={id} value={label}>{label}</option>)}
            </select>
         </label>
         <label className="text-sm text-secondary-text">Date
            <input type="date" value={filters.date} onChange={(event) => update("date", event.target.value)} className="mt-1 w-full rounded border border-border bg-surface-elevated px-3 py-2 text-primary-text" />
         </label>
      </div>
   );
};

export default ComplaintQueueFilters;
