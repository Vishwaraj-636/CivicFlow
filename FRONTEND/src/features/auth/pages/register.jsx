import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ContinueWithGoogle from '../../../components/googleAuth/ContinueWithGoogle';
import { useAuth } from '../hook/useAuth';

const Register = () => {
   const { handleRegister, loading } = useAuth();
   const navigate = useNavigate();
   const [formData, setFormData] = useState({
      fullname: '',
      email: '',
      contact: '',
      password: '',
      confirmPassword: ''
   });
   const [error, setError] = useState('');

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
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-primary-accent/30">
         <div className="w-full max-w-xl relative z-10 my-8">
            <div className="bg-surface p-10 sm:p-12 rounded-2xl border border-border shadow-md">
               <div className="mb-10 text-center">
                  <h1 className="text-3xl font-light tracking-tight text-primary-text mb-3">Create Account</h1>
                  <p className="text-secondary-text text-sm font-medium tracking-wide">Create an account to get started.</p>
               </div>

               {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                     {error}
                  </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="fullname">Full Name</label>
                        <input
                           type="text"
                           id="fullname"
                           name="fullname"
                           value={formData.fullname}
                           onChange={handleChange}
                           className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                           placeholder="John Doe"
                           required
                        />
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
                  </div>

                  <div className="space-y-1">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="email">Email Address</label>
                     <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                        placeholder="you@example.com"
                        required
                     />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="password">Password</label>
                     <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                        placeholder="••••••••"
                        required
                     />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="confirmPassword">Confirm Password</label>
                     <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                        placeholder="••••••••"
                        required
                     />
                  </div>

                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-primary-accent hover:opacity-90 disabled:opacity-50 text-surface font-semibold text-sm rounded-lg py-3 mt-8 transition-opacity duration-200 cursor-pointer"
                  >
                     {loading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <div className="relative flex items-center py-2">
                     <div className="grow border-t border-border/60"></div>
                     <span className="shrink-0 px-4 text-xs text-muted-text font-medium uppercase tracking-wider">or</span>
                     <div className="grow border-t border-border/60"></div>
                  </div>

                  <ContinueWithGoogle />
               </form>

               <div className="mt-10 text-center">
                  <p className="text-sm text-secondary-text">
                     Already have an account? <Link to="/login" className="text-primary-text hover:text-primary-accent font-medium ml-1 border-b border-transparent hover:border-primary-accent transition-all pb-0.5">Sign in</Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Register;
