import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
   const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      contactNumber: '',
      password: '',
      role: 'citizen'
   });

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
   };

   const handleRoleChange = (role) => {
      setFormData(prev => ({ ...prev, role }));
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      // Handle registration logic
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-primary-accent/30">
         <div className="w-full max-w-xl relative z-10 my-8">
            <div className="bg-surface/60 backdrop-blur-xl p-10 sm:p-12 rounded-3xl shadow-2xl border border-border/50 transition-all duration-500">
               <div className="mb-10 text-center">
                  <h1 className="text-3xl font-light tracking-tight text-primary-text mb-3">Create Account</h1>
                  <p className="text-secondary-text text-sm font-medium tracking-wide">Join us to get started on your journey.</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="fullName">Full Name</label>
                        <input
                           type="text"
                           id="fullName"
                           name="fullName"
                           value={formData.fullName}
                           onChange={handleChange}
                           className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                           placeholder="John Doe"
                           required
                        />
                     </div>

                     <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="contactNumber">Contact Number</label>
                        <input
                           type="tel"
                           id="contactNumber"
                           name="contactNumber"
                           value={formData.contactNumber}
                           onChange={handleChange}
                           className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                           placeholder="+1 (555) 000-0000"
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

                  <div className="pt-4">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1 block mb-3">Account Type</label>
                     <div className="grid grid-cols-3 gap-4">
                        {[
                           { id: 'citizen', label: 'Citizen', icon: '👤' },
                           { id: 'deptstaff', label: 'Dept Staff', icon: '🏢' },
                           { id: 'admin', label: 'Admin', icon: '🛡️' }
                        ].map((roleType) => (
                           <label
                              key={roleType.id}
                              className={`
                      relative flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden
                      ${formData.role === roleType.id
                                    ? 'bg-primary-accent/10 border-primary-accent shadow-[0_0_15px_rgba(181,138,90,0.15)]'
                                    : 'bg-surface-secondary/30 border-border/60 hover:border-primary-accent/50 hover:bg-surface-secondary/60'}
                    `}
                           >
                              <input
                                 type="checkbox"
                                 className="hidden"
                                 checked={formData.role === roleType.id}
                                 onChange={() => handleRoleChange(roleType.id)}
                              />
                              {formData.role === roleType.id && (
                                 <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-accent shadow-[0_0_5px_rgba(181,138,90,0.8)]"></div>
                              )}
                              <span className="text-xl mb-2 opacity-80">{roleType.icon}</span>
                              <span className={`text-xs font-semibold tracking-wide ${formData.role === roleType.id ? 'text-primary-accent' : 'text-secondary-text'}`}>
                                 {roleType.label}
                              </span>
                           </label>
                        ))}
                     </div>
                  </div>

                  <button
                     type="submit"
                     className="w-full relative group overflow-hidden bg-primary-accent text-surface font-semibold text-sm py-4 rounded-xl mt-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(181,138,90,0.3)] transform active:scale-[0.98]"
                  >
                     <span className="relative z-10 flex items-center justify-center gap-2">
                        Create Account
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                     </span>
                     {/* Subtle hover gradient */}
                     <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                  </button>
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
