import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');

   const handleSubmit = (e) => {
      e.preventDefault();
      // Handle login logic
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-primary-accent/30">
         <div className="w-full max-w-md relative z-10">
            <div className="bg-surface/60 backdrop-blur-xl p-10 sm:p-12 rounded-3xl shadow-2xl border border-border/50 transition-all duration-500">
               <div className="mb-10 text-center">
                  <h1 className="text-3xl font-light tracking-tight text-primary-text mb-3">Welcome Back</h1>
                  <p className="text-secondary-text text-sm font-medium tracking-wide">Enter your details to proceed.</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                     <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text ml-1" htmlFor="email">Email Address</label>
                     <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                        placeholder="you@example.com"
                        required
                     />
                  </div>

                  <div className="space-y-1">
                     <div className="flex justify-between items-center ml-1">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-text" htmlFor="password">Password</label>
                        <a href="#" className="text-[11px] uppercase tracking-wider font-semibold text-primary-accent hover:text-accent-hover transition-colors">Forgot?</a>
                     </div>
                     <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface-secondary/50 border border-border/60 rounded-xl px-5 py-3.5 text-primary-text text-sm placeholder-muted-text/50 focus:outline-none focus:ring-1 focus:ring-primary-accent focus:border-primary-accent focus:bg-surface-secondary transition-all duration-300 shadow-sm"
                        placeholder="••••••••"
                        required
                     />
                  </div>

                  <button
                     type="submit"
                     className="w-full relative group overflow-hidden bg-primary-accent text-surface font-semibold text-sm py-4 rounded-xl mt-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(181,138,90,0.3)] transform active:scale-[0.98]"
                  >
                     <span className="relative z-10 flex items-center justify-center gap-2">
                        Sign In
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
                     Don't have an account? <Link to="/register" className="text-primary-text hover:text-primary-accent font-medium ml-1 border-b border-transparent hover:border-primary-accent transition-all pb-0.5">Create one</Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Login;
