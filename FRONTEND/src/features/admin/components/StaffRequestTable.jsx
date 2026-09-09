import React, { useEffect, useState } from 'react';
import { getStaffRequests } from '../services/staffRequest.api';

const TABS = [
   { key: 'pending', label: 'Pending' },
   { key: 'approved', label: 'Approved' },
   { key: 'rejected', label: 'Rejected' },
];

const statusConfig = {
   pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' },
   approved: { label: 'Approved', className: 'bg-green-500/10 text-green-400 border border-green-500/30' },
   rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-400 border border-red-500/30' },
};

const StaffRequestTable = ({ onApprove, onReject, refreshKey }) => {
   const [activeTab, setActiveTab] = useState('pending');
   const [requests, setRequests] = useState([]);
   const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   const fetchRequests = async (status) => {
      setLoading(true);
      setError('');
      try {
         const data = await getStaffRequests({ status });
         const list = Array.isArray(data) ? data : data.requests ?? [];
         setRequests(list);
         setCounts((prev) => ({ ...prev, [status]: list.length }));
      } catch (err) {
         setError('Failed to load staff requests.');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchRequests(activeTab);
   }, [activeTab, refreshKey]);

   const handleTabChange = (key) => {
      setActiveTab(key);
   };

   return (
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
         {/* Tab Bar */}
         <div className="flex border-b border-border px-6">
            {TABS.map((tab) => (
               <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`relative py-4 px-1 mr-6 text-sm font-medium transition-colors cursor-pointer ${activeTab === tab.key
                     ? 'text-primary-text'
                     : 'text-muted-text hover:text-secondary-text'
                     }`}
               >
                  {tab.label}
                  {tab.key === 'pending' && counts.pending > 0 && (
                     <span className="ml-2 text-[11px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
                        {counts.pending}
                     </span>
                  )}
                  {activeTab === tab.key && (
                     <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-accent rounded-t-full" />
                  )}
               </button>
            ))}
         </div>

         {/* Content */}
         {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-text text-sm">
               <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
               </svg>
               Loading requests…
            </div>
         ) : error ? (
            <div className="flex items-center justify-center py-20 gap-3 text-red-400 text-sm">
               <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               {error}
            </div>
         ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-text">
               <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               <p className="text-sm">No {activeTab} requests found</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead>
                     <tr className="border-b border-border bg-surface-secondary/30">
                        <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-text px-6 py-3.5">Applicant</th>
                        <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-text px-6 py-3.5">Department</th>
                        <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-text px-6 py-3.5">Date Submitted</th>
                        <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-text px-6 py-3.5">Status</th>
                        {activeTab === 'pending' && (
                           <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-text px-6 py-3.5">Actions</th>
                        )}
                        {activeTab === 'rejected' && (
                           <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-text px-6 py-3.5">Reason</th>
                        )}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                     {requests.map((req) => {
                        const applicant = req.userId ?? { fullname: req.fullname, email: req.email };
                        const department = req.departmentId;
                        const initials = applicant?.fullname
                           ? applicant.fullname.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                           : '?';
                        const formattedDate = req.createdAt
                           ? new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                           : '—';
                        const cfg = statusConfig[req.status] ?? statusConfig.pending;

                        return (
                           <tr key={req._id} className="hover:bg-surface-secondary/20 transition-colors">
                              {/* Applicant */}
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center shrink-0">
                                       <span className="text-primary-accent text-[11px] font-bold">{initials}</span>
                                    </div>
                                    <div>
                                       <p className="text-sm font-medium text-primary-text">{applicant?.fullname ?? '—'}</p>
                                       <p className="text-xs text-muted-text">{applicant?.email ?? ''}</p>
                                    </div>
                                 </div>
                              </td>

                              {/* Department */}
                              <td className="px-6 py-4">
                                 <span className="text-sm text-secondary-text">
                                    {department?.name ?? department?.fullname ?? '—'}
                                 </span>
                              </td>

                              {/* Date */}
                              <td className="px-6 py-4">
                                 <span className="text-sm text-muted-text">{formattedDate}</span>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4">
                                 <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg ${cfg.className}`}>
                                    {cfg.label}
                                 </span>
                              </td>

                              {/* Actions (pending only) */}
                              {activeTab === 'pending' && (
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                       <button
                                          onClick={() => onApprove(req)}
                                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors cursor-pointer"
                                       >
                                          Approve
                                       </button>
                                       <button
                                          onClick={() => onReject(req)}
                                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors cursor-pointer"
                                       >
                                          Reject
                                       </button>
                                    </div>
                                 </td>
                              )}

                              {/* Rejection reason */}
                              {activeTab === 'rejected' && (
                                 <td className="px-6 py-4">
                                    <span className="text-xs text-muted-text italic">
                                       {req.rejectionReason ?? '—'}
                                    </span>
                                 </td>
                              )}
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
};

export default StaffRequestTable;

