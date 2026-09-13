import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import ContinueWithGoogle from '../../../components/googleAuth/ContinueWithGoogle';
import { useAuth } from '../hook/useAuth';

const Register = () => {
   const { handleRegister, loading, isAuthenticated, initialized } = useAuth();
   const navigate = useNavigate();
   const [formData, setFormData] = useState({
      fullname: '',
      email: '',
      contact: '',
      password: '',
      confirmPassword: ''
   });
   const [error, setError] = useState('');

   // Redirect already-authenticated users away from the register page
   if (initialized && isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
   }

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      setError('');
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
         setError('Passwords do not match');
         return;
      }

      try {
         await handleRegister({
            fullname: formData.fullname,
            email: formData.email,
            contact: formData.contact,
            password: formData.password
         });
         navigate('/citizen');
      } catch (err) {
         setError(err.response?.data?.message || 'Registration failed');
      }
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#F7F7F5] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 text-[#17202A] font-sans selection:bg-[#173B5E]/10">
         <div className="w-full max-w-xl relative z-10 my-4 sm:my-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E2E6E4] shadow-sm">

               {/* Institutional Eyebrow & Headline */}
               <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[11px] font-bold font-mono tracking-wider text-[#39756B] uppercase">
                        RESIDENT ONBOARDING
                     </span>
                     <span className="inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded bg-[#F1F3F2] text-[#52606D] border border-[#E2E6E4]">
                        REGISTER
                     </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17202A]">
                     Create your CivicFlow account
                  </h1>
                  <p className="mt-1 text-sm text-[#52606D] leading-relaxed">
                     Create your CivicFlow account to file civic complaints, track their progress, and access municipal services.
                  </p>
               </div>

               {/* Error Alert */}
               {error && (
                  <div className="mb-6 p-3.5 rounded-lg bg-[#FBF0F0] border border-[#F3C5C5] text-[#A44A4A] text-xs font-medium flex items-start gap-2.5">
                     <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#A44A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                     <span className="leading-snug">{error}</span>
                  </div>
               )}

               {/* Form */}
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-1.5" htmlFor="fullname">
                           Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                           type="text"
                           id="fullname"
                           name="fullname"
                           value={formData.fullname}
                           onChange={handleChange}
                           className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] transition-colors"
                           placeholder="John Doe"
                           required
                        />
                     </div>

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
                  </div>

                  <div>
                     <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-1.5" htmlFor="email">
                        Email Address <span className="text-red-600">*</span>
                     </label>
                     <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] transition-colors"
                        placeholder="resident@municipality.gov"
                        required
                     />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-1.5" htmlFor="password">
                           Password <span className="text-red-600">*</span>
                        </label>
                        <input
                           type="password"
                           id="password"
                           name="password"
                           value={formData.password}
                           onChange={handleChange}
                           className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] font-mono transition-colors"
                           placeholder="••••••••••••"
                           required
                        />
                     </div>

                     <div>
                        <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-1.5" htmlFor="confirmPassword">
                           Confirm Password <span className="text-red-600">*</span>
                        </label>
                        <input
                           type="password"
                           id="confirmPassword"
                           name="confirmPassword"
                           value={formData.confirmPassword}
                           onChange={handleChange}
                           className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] font-mono transition-colors"
                           placeholder="••••••••••••"
                           required
                        />
                     </div>
                  </div>

                  {/* Institutional Compliance Notice */}
                  <div className="p-3.5 rounded-lg bg-[#EEF4FA] border border-[#CBD2CF]/60 flex items-start gap-3">
                     <svg className="w-4 h-4 text-[#173B5E] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <div className="text-xs text-[#52606D] leading-relaxed">
                        <span className="font-semibold text-[#17202A]">CivicFlow account notice:</span> Your account provides access to complaint reporting, complaint tracking, and available municipal services.
                     </div>
                  </div>

                  {/* Submit Button */}
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
                           <span>Creating Account…</span>
                        </>
                     ) : (
                        <>
                           <span>Create Account</span>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                           </svg>
                        </>
                     )}
                  </button>

                  <div className="relative my-6">
                     <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E6E4]"></div>
                     </div>
                     <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-mono">
                        <span className="bg-white px-3 text-[#87919B]">or continue with</span>
                     </div>
                  </div>

                  <ContinueWithGoogle />
               </form>

               {/* Card Footer */}
               <div className="mt-8 pt-5 border-t border-[#E2E6E4] flex items-center justify-between text-xs">
                  <span className="text-[#52606D]">Already registered with municipal portal?</span>
                  <Link to="/login" className="font-semibold text-[#173B5E] hover:text-[#122E4A] underline decoration-[#CBD2CF] underline-offset-4 transition-colors">
                     Sign in →
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Register;