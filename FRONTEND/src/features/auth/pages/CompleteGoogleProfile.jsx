import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hook/useAuth';

const CompleteGoogleProfile = () => {
   const { handleCompleteProfile, getDepartments, loading, user } = useAuth();
   const navigate = useNavigate();

   const [role, setRole] = useState('citizen');
   const [formData, setFormData] = useState({
      contact: '',
      departmentId: ''
   });
   const [departments, setDepartments] = useState([]);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');

   useEffect(() => {
      getDepartments()
         .then((data) => {
            const list = Array.isArray(data) ? data : data?.departments ?? [];
            setDepartments(list.filter((d) => d.isActive !== false));
         })
         .catch(() => setError('Unable to load departments'));
   }, []);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      setError('');
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (role === 'dept_staff' && !formData.departmentId) {
         setError('Please select a department.');
         return;
      }

      try {
         if (role === 'citizen') {
            await handleCompleteProfile({
               role: 'citizen',
               contact: formData.contact
            });
            navigate('/citizen');
         } else if (role === 'dept_staff') {
            await handleCompleteProfile({
               role: 'dept_staff',
               contact: formData.contact,
               departmentId: formData.departmentId
            });
            setSuccess('Staff request submitted successfully. You will be contacted once admin reviews your request.');
            setTimeout(() => {
               navigate('/login');
            }, 3000);
         }
      } catch (err) {
         setError(err.response?.data?.message || 'Profile completion failed');
      }
   };

   const userInitials = user?.fullname
      ? user.fullname.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'CF';

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#F7F7F5] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 text-[#17202A] font-sans selection:bg-[#173B5E]/10">
         <div className="w-full max-w-xl relative z-10 my-4 sm:my-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E2E6E4] shadow-sm">

               {/* Institutional Eyebrow & Headline */}
               <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                     <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[#F1F3F2] text-[#39756B] font-semibold border border-[#E2E6E4] uppercase tracking-wider">
                        SSO Identity Validation
                     </span>
                     <span className="text-[11px] font-mono text-[#87919B]">STEP 2 OF 2</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17202A]">
                     Complete your CivicFlow profile
                  </h1>
                  <p className="mt-1 text-sm text-[#52606D] leading-relaxed">
                     Verify your intended municipal role and required contact details to finalize administrative onboarding.
                  </p>
               </div>

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

               <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Google Authenticated Context Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F1F3F2] border border-[#E2E6E4] text-xs">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#173B5E] text-white flex items-center justify-center font-bold text-xs">
                           {userInitials}
                        </div>
                        <div>
                           <p className="font-semibold text-[#17202A]">{user?.email || 'Google User'}</p>
                           <p className="text-[#87919B] font-mono text-[10px]">Google SSO Verified Session</p>
                        </div>
                     </div>
                     <span className="text-[11px] font-mono text-[#39756B] font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Authenticated
                     </span>
                  </div>

                  {/* Role Selection */}
                  <div>
                     <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-2">
                        Select Intended Municipal Role <span className="text-red-600">*</span>
                     </label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Citizen Option */}
                        <div
                           onClick={() => setRole('citizen')}
                           className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${role === 'citizen'
                                 ? 'border-[#173B5E] bg-[#EEF4FA]/70'
                                 : 'border-[#E2E6E4] bg-white hover:border-[#CBD2CF]'
                              }`}
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <input
                                    type="radio"
                                    name="role"
                                    checked={role === 'citizen'}
                                    onChange={() => setRole('citizen')}
                                    className="text-[#173B5E] focus:ring-[#173B5E]"
                                 />
                                 <span className="text-sm font-bold text-[#17202A]">Citizen</span>
                              </div>
                              <span className="text-[10px] font-mono bg-white border border-[#E2E6E4] px-1.5 py-0.5 rounded text-[#52606D]">
                                 ROLE_CITIZEN
                              </span>
                           </div>
                           <p className="mt-2 text-xs text-[#52606D] leading-snug">
                              Standard resident access to report civic issues and track complaint progress.
                           </p>
                        </div>

                        {/* Department Staff Option */}
                        <div
                           onClick={() => setRole('dept_staff')}
                           className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${role === 'dept_staff'
                                 ? 'border-[#173B5E] bg-[#EEF4FA]/70'
                                 : 'border-[#E2E6E4] bg-white hover:border-[#CBD2CF]'
                              }`}
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <input
                                    type="radio"
                                    name="role"
                                    checked={role === 'dept_staff'}
                                    onChange={() => setRole('dept_staff')}
                                    className="text-[#173B5E] focus:ring-[#173B5E]"
                                 />
                                 <span className="text-sm font-bold text-[#17202A]">Department Staff</span>
                              </div>
                              <span className="text-[10px] font-mono bg-white border border-[#E2E6E4] px-1.5 py-0.5 rounded text-[#52606D]">
                                 ROLE_STAFF
                              </span>
                           </div>
                           <p className="mt-2 text-xs text-[#52606D] leading-snug">
                              Municipal personnel requiring access to departmental complaint triage and processing.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Contact Number */}
                  <div>
                     <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-1.5" htmlFor="contact">
                        Contact Number <span className="text-red-600">*</span>
                     </label>
                     <input
                        type="tel"
                        id="contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] font-mono transition-colors"
                        placeholder="9876543210"
                        required
                     />
                  </div>

                  {/* Conditional Department Selection */}
                  {role === 'dept_staff' && (
                     <div className="p-3.5 rounded-lg bg-[#F1F3F2]/80 border border-[#E2E6E4] space-y-2">
                        <div className="flex items-center justify-between">
                           <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase" htmlFor="departmentId">
                              Department <span className="text-red-600">*</span>
                           </label>
                           <span className="text-[10px] font-mono text-[#87919B] bg-white px-2 py-0.5 rounded border border-[#E2E6E4]">
                              Required for Staff
                           </span>
                        </div>
                        <div className="relative">
                           <select
                              id="departmentId"
                              name="departmentId"
                              value={formData.departmentId}
                              onChange={handleChange}
                              className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] appearance-none cursor-pointer pr-10"
                              required={role === 'dept_staff'}
                           >
                              <option value="">Select a department</option>
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
                        <p className="text-[11px] text-[#87919B]">
                           Note: Selecting a department will route your account to the administrative approval queue.
                        </p>
                     </div>
                  )}

                  {/* Primary Submit Button */}
                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full min-h-[44px] mt-2 px-5 py-2.5 bg-[#173B5E] hover:bg-[#122E4A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                     {loading ? (
                        <>
                           <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                           </svg>
                           <span>Submitting…</span>
                        </>
                     ) : (
                        <>
                           <span>Finalize Profile & Enter Portal</span>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                           </svg>
                        </>
                     )}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
};

export default CompleteGoogleProfile;