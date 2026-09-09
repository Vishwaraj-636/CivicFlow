import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDepartments, createStaffRequest } from '../services/staffRequest.api';
import { useAuth } from '../hook/useAuth';

const DeptStaffRequest = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [departments, setDepartments] = useState([]);
   const [departmentId, setDepartmentId] = useState('');
   const [loading, setLoading] = useState(false);
   const [loadingDepts, setLoadingDepts] = useState(true);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   useEffect(() => {
      setLoadingDepts(true);
      getDepartments()
         .then((data) => {
            // Support both { departments: [...] } and direct array responses
            const list = Array.isArray(data) ? data : data.departments ?? [];
            setDepartments(list.filter((d) => d.isActive !== false));
         })
         .catch(() => setError('Unable to load departments. Please try again.'))
         .finally(() => setLoadingDepts(false));
   }, []);

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!departmentId) {
         setError('Please select a department.');
         return;
      }
      setError('');
      setLoading(true);
      try {
         await createStaffRequest({ departmentId });
         setSuccess('Your request has been submitted. You will be notified once an administrator reviews it.');
         setDepartmentId('');
         setTimeout(() => navigate('/dashboard'), 3500);
      } catch (err) {
         setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-primary-accent/30">
         <div className="w-full max-w-2xl relative z-10 my-8">
            <div className="bg-surface p-10 sm:p-12 rounded-2xl border border-border shadow-md">

               {/* Header */}
               <div className="mb-10 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-accent/10 border border-primary-accent/20 mb-5">
                     <svg className="w-7 h-7 text-primary-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                     </svg>
                  </div>
                  <h1 className="text-3xl font-light tracking-tight text-primary-text mb-3">
                     Department Staff Request
                  </h1>
                  <p className="text-secondary-text text-sm font-medium tracking-wide">
                     Select a department to apply for a staff role. Your request will be reviewed by administrators.
                  </p>
               </div>

               {/* Alerts */}
               {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-3">
                     <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                     {error}
                  </div>
               )}

               {success && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-start gap-3">
                     <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     {success}
                  </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Department Selector */}
                  <div className="space-y-1.5">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="departmentId">
                        Department <span className="text-red-400">*</span>
                     </label>
                     {loadingDepts ? (
                        <div className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-muted-text text-sm animate-pulse">
                           Loading departments…
                        </div>
                     ) : (
                        <select
                           id="departmentId"
                           name="departmentId"
                           value={departmentId}
                           onChange={(e) => { setDepartmentId(e.target.value); setError(''); }}
                           className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm appearance-none cursor-pointer"
                           required
                        >
                           <option value="" disabled>Select a department</option>
                           {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                 {dept.name || dept.fullname}
                              </option>
                           ))}
                        </select>
                     )}
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                     <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <p className="text-blue-400 text-xs leading-relaxed">
                        Your request will be reviewed by an administrator. You will be notified once a decision has been made.
                        Approved requests will upgrade your account to a department staff role.
                     </p>
                  </div>

                  {/* Submit */}
                  <button
                     type="submit"
                     disabled={loading || loadingDepts || !departmentId}
                     className="w-full bg-primary-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-surface font-semibold text-sm rounded-xl py-3.5 mt-2 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
                  >
                     {loading ? (
                        <>
                           <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                           </svg>
                           Submitting…
                        </>
                     ) : (
                        <>
                           Submit Request
                           <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                           </svg>
                        </>
                     )}
                  </button>
               </form>

               {/* Footer */}
               <div className="mt-8 text-center">
                  <p className="text-sm text-secondary-text">
                     Changed your mind?{' '}
                     <Link to="/dashboard" className="text-primary-text hover:text-primary-accent font-medium ml-1 border-b border-transparent hover:border-primary-accent transition-all pb-0.5">
                        Go back to dashboard
                     </Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default DeptStaffRequest;
