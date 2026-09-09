import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hook/useAuth';

const CompleteGoogleProfile = () => {
   const { handleCompleteProfile, getDepartments, loading } = useAuth();
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
      getDepartments().then(setDepartments).catch(() => setError('Unable to load departments'));
   }, []);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      setError('');
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

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

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-primary-accent/30">
         <div className="w-full max-w-lg relative z-10 my-8">
            <div className="bg-surface p-10 sm:p-12 rounded-2xl border border-border shadow-md">
               <div className="mb-10 text-center">
                  <h1 className="text-3xl font-light tracking-tight text-primary-text mb-3">Complete Your Profile</h1>
                  <p className="text-secondary-text text-sm font-medium tracking-wide">Please provide a few more details to set up your account.</p>
               </div>

               {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                     {error}
                  </div>
               )}

               {success && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
                     {success}
                  </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1 block">I am joining as a</label>
                     <div className="grid grid-cols-2 gap-4">
                        <button
                           type="button"
                           onClick={() => setRole('citizen')}
                           className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${role === 'citizen' ? 'bg-primary-accent/10 border-primary-accent text-primary-accent' : 'bg-surface-secondary/50 border-border/60 text-secondary-text hover:border-primary-accent/50'}`}
                        >
                           Citizen
                        </button>
                        <button
                           type="button"
                           onClick={() => setRole('dept_staff')}
                           className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${role === 'dept_staff' ? 'bg-primary-accent/10 border-primary-accent text-primary-accent' : 'bg-surface-secondary/50 border-border/60 text-secondary-text hover:border-primary-accent/50'}`}
                        >
                           Department Staff
                        </button>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="contact">Contact Number</label>
                     <input
                        type="tel"
                        id="contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                        placeholder="1234567890"
                        required
                     />
                  </div>

                  {role === 'dept_staff' && (
                     <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="departmentId">Department</label>
                        <select
                           id="departmentId"
                           name="departmentId"
                           value={formData.departmentId}
                           onChange={handleChange}
                           className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                           required={role === 'dept_staff'}
                        >
                           <option value="">Select a department</option>
                           {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>{dept.fullname}</option>
                           ))}
                        </select>
                        <p className="text-[11px] text-muted-text mt-2 ml-1">Staff requests require admin approval before full access is granted.</p>
                     </div>
                  )}

                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-primary-accent hover:opacity-90 disabled:opacity-50 text-surface font-semibold text-sm rounded-lg py-3 mt-8 transition-opacity duration-200 cursor-pointer"
                  >
                     {loading ? 'Submitting...' : 'Complete Profile'}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
};

export default CompleteGoogleProfile;