import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import ContinueWithGoogle from '../../../components/googleAuth/ContinueWithGoogle';
import { useAuth } from '../hook/useAuth';

const Login = () => {
   const { handleLogin, isAuthenticated, initialized } = useAuth();
   const navigate = useNavigate();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');

   // Redirect already-authenticated users away from the login page
   if (initialized && isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
   }

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      try {
         await handleLogin({ email, password });
         navigate('/dashboard');
      } catch (err) {
         setError(err.response?.data?.message || 'Login failed');
      }
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans selection:bg-primary-accent/30">
         <div className="w-full max-w-md relative z-10">
            <div className="bg-surface p-10 sm:p-12 rounded-2xl border border-border shadow-md">
               <div className="mb-10 text-center">
                  <h1 className="text-3xl font-light tracking-tight text-primary-text mb-3">Welcome Back</h1>
                  <p className="text-secondary-text text-sm font-medium tracking-wide">Enter your details to proceed.</p>
               </div>

               {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                     {error}
                  </div>
               )}

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
                     className="w-full bg-primary-accent hover:opacity-90 text-surface font-semibold text-sm rounded-lg py-3 mt-6 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2 group"
                  >
                     Sign In
                     <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </svg>
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
                     Don't have an account? <Link to="/register" className="text-primary-text hover:text-primary-accent font-medium ml-1 border-b border-transparent hover:border-primary-accent transition-all pb-0.5">Create one</Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Login;
