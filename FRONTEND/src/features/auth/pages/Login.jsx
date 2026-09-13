import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import ContinueWithGoogle from '../../../components/googleAuth/ContinueWithGoogle';
import { useAuth } from '../hook/useAuth';

const Login = () => {
   const { handleLogin, isAuthenticated, initialized } = useAuth();
   const navigate = useNavigate();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Redirect already-authenticated users away from the login page
   if (initialized && isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
   }

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
         await handleLogin({ email, password });
         navigate('/dashboard');
      } catch (err) {
         setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#F7F7F5] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 text-[#17202A] font-sans selection:bg-[#173B5E]/10">
         <div className="w-full max-w-md relative z-10">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E2E6E4] shadow-sm">

               {/* Institutional Eyebrow & Headline */}
               <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[11px] font-bold font-mono tracking-wider text-[#39756B] uppercase">
                        CIVICFLOW ACCESSION
                     </span>
                     <span className="text-[11px] font-mono text-[#87919B]">SECURED ACCESS</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17202A]">
                     Welcome back
                  </h1>
                  <p className="mt-1 text-sm text-[#52606D] leading-relaxed">
                     Sign in to access your municipal portal, complaint records, and civic services.
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
                  <div>
                     <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase mb-1.5" htmlFor="email">
                        Email Address <span className="text-red-600">*</span>
                     </label>
                     <div className="relative">
                        <input
                           type="email"
                           id="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] transition-colors"
                           placeholder="name@example.com"
                           required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#87919B]">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                           </svg>
                        </div>
                     </div>
                  </div>

                  <div>
                     <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-mono font-semibold text-[#52606D] tracking-wider uppercase" htmlFor="password">
                           Password <span className="text-red-600">*</span>
                        </label>
                        <span className="text-xs text-[#87919B]">Institutional Auth</span>
                     </div>
                     <div className="relative">
                        <input
                           type={showPassword ? 'text' : 'password'}
                           id="password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full min-h-[44px] px-3.5 py-2.5 bg-white text-[#17202A] text-sm rounded-lg border border-[#CBD2CF] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20 focus:border-[#173B5E] placeholder-[#87919B] font-mono transition-colors pr-10"
                           placeholder="••••••••••••"
                           required
                        />
                        <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#87919B] hover:text-[#52606D] transition-colors cursor-pointer"
                           aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                           {showPassword ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                           ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                           )}
                        </button>
                     </div>
                  </div>

                  <button
                     type="submit"
                     disabled={isSubmitting}
                     className="w-full min-h-[44px] mt-2 px-5 py-2.5 bg-[#173B5E] hover:bg-[#122E4A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                     {isSubmitting ? (
                        <>
                           <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                           </svg>
                           <span>Signing In…</span>
                        </>
                     ) : (
                        <>
                           <span>Sign In to CivicFlow</span>
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
                  <span className="text-[#52606D]">Don't have a civic account?</span>
                  <Link to="/register" className="font-semibold text-[#173B5E] hover:text-[#122E4A] underline decoration-[#CBD2CF] underline-offset-4 transition-colors">
                     Register here →
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Login;