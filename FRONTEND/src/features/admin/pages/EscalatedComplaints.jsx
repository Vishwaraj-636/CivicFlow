import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ComplaintSlaStatus from "../../../components/complaint/ComplaintSlaStatus";
import { getEscalatedComplaints, getEscalationSummary } from "../services/escalation.api";

const EscalatedComplaints = () => {
   const [complaints, setComplaints] = useState([]);
   const [summary, setSummary] = useState({ total: 0, openComplaints: 0, departments: [] });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   const loadEscalations = async () => {
      setLoading(true);
      setError("");
      try {
         const [escalatedComplaints, escalationSummary] = await Promise.all([
            getEscalatedComplaints(),
            getEscalationSummary(),
         ]);
         setComplaints(escalatedComplaints);
         setSummary(escalationSummary);
      } catch (loadError) {
         setError(loadError.response?.data?.error ?? "Unable to load escalated complaints.");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadEscalations();
   }, []);

   return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased">
         <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex flex-col gap-4 border-b border-[#E2E6E4] pb-6 sm:flex-row sm:items-end sm:justify-between">
               <div>
                  <Link to="/admin" className="text-xs font-semibold text-[#52606D] hover:text-[#173B5E]">← Administration</Link>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#A44A4A]">SLA Governance</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Escalated Complaints</h1>
                  <p className="mt-1 text-sm text-[#52606D]">Overdue unresolved complaints requiring administrator attention.</p>
               </div>
               <button type="button" onClick={loadEscalations} disabled={loading} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#CBD2CF] bg-white px-4 py-2 text-xs font-semibold text-[#173B5E] hover:bg-[#F1F3F2] disabled:opacity-50">
                  {loading ? "Refreshing..." : "Refresh"}
               </button>
            </div>

            {error && <div className="rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-sm text-[#A44A4A]">{error}</div>}

            <section aria-label="Escalation metrics" className="grid gap-3 sm:grid-cols-3">
               <div className="rounded-xl border border-[#F3D0D0] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#A44A4A]">Escalated</p><p className="mt-2 text-3xl font-semibold">{summary.total}</p><p className="mt-1 text-xs text-[#87919B]">Complaints beyond SLA</p></div>
               <div className="rounded-xl border border-[#E2E6E4] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Open Intake</p><p className="mt-2 text-3xl font-semibold">{summary.openComplaints}</p><p className="mt-1 text-xs text-[#87919B]">Unresolved complaints</p></div>
               <div className="rounded-xl border border-[#E2E6E4] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">Departments</p><p className="mt-2 text-3xl font-semibold">{summary.departments.length}</p><p className="mt-1 text-xs text-[#87919B]">With overdue cases</p></div>
            </section>

            <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6">
               <div className="border-b border-[#E2E6E4] pb-3"><h2 className="text-base font-semibold">Repeated SLA failures by department</h2><p className="mt-1 text-xs text-[#87919B]">Higher counts indicate departments needing operational review.</p></div>
               {summary.departments.length === 0 ? <p className="py-6 text-sm text-[#52606D]">No departments have escalated complaints.</p> : (
                  <div className="mt-4 overflow-x-auto"><table className="w-full min-w-140 text-left text-sm"><thead className="border-b border-[#E2E6E4] text-xs uppercase tracking-wider text-[#52606D]"><tr><th className="px-3 py-3">Department</th><th className="px-3 py-3">Escalated cases</th><th className="px-3 py-3">Oldest escalation</th></tr></thead><tbody className="divide-y divide-[#E2E6E4]">{summary.departments.map((department) => <tr key={String(department.departmentId)}><td className="px-3 py-3 font-medium">{department.departmentName} <span className="text-xs text-[#87919B]">({department.departmentCode})</span></td><td className="px-3 py-3 font-semibold text-[#A44A4A]">{department.escalatedCount}</td><td className="px-3 py-3 text-xs text-[#52606D]">{department.oldestEscalation ? new Date(department.oldestEscalation).toLocaleString("en-IN") : "—"}</td></tr>)}</tbody></table></div>
               )}
            </section>

            <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6">
               <div className="border-b border-[#E2E6E4] pb-3"><h2 className="text-base font-semibold">Escalation register</h2><p className="mt-1 text-xs text-[#87919B]">Every complaint below exceeded its assigned resolution deadline.</p></div>
               {loading ? <p className="py-6 text-sm text-[#52606D]">Loading escalation register...</p> : complaints.length === 0 ? <p className="py-6 text-sm text-[#28704F]">No overdue unresolved complaints.</p> : (
                  <div className="mt-4 overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="border-b border-[#E2E6E4] text-xs uppercase tracking-wider text-[#52606D]"><tr><th className="px-3 py-3">Complaint</th><th className="px-3 py-3">Department</th><th className="px-3 py-3">Priority</th><th className="px-3 py-3">SLA</th><th className="px-3 py-3">Escalated</th><th className="px-3 py-3">Action</th></tr></thead><tbody className="divide-y divide-[#E2E6E4]">{complaints.map((complaint) => <tr key={complaint._id}><td className="max-w-70 px-3 py-3"><p className="font-mono text-xs text-[#87919B]">{complaint.complaintId}</p><p className="truncate font-medium" title={complaint.title}>{complaint.title}</p></td><td className="px-3 py-3 text-xs">{complaint.assignedDepartment?.fullname ?? "Unassigned"}</td><td className="px-3 py-3 text-xs font-semibold capitalize">{complaint.priority}</td><td className="px-3 py-3"><ComplaintSlaStatus complaint={complaint} compact /></td><td className="px-3 py-3 text-xs text-[#52606D]">{complaint.escalatedAt ? new Date(complaint.escalatedAt).toLocaleString("en-IN") : "—"}</td><td className="px-3 py-3"><Link to={`/admin/complaints/${complaint._id}`} className="text-xs font-semibold text-[#173B5E] hover:underline">Review</Link></td></tr>)}</tbody></table></div>
               )}
            </section>
         </main>
      </div>
   );
};

export default EscalatedComplaints;
