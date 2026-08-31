import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
   return (
      <nav className="w-full bg-surface border-b border-border sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
               <div className="w-8 h-8 rounded-lg bg-primary-accent flex items-center justify-center">
                  <span className="text-surface font-bold text-sm tracking-wider">CF</span>
               </div>
               <span className="text-xl font-bold tracking-tight text-primary-text group-hover:text-primary-accent transition-colors">
                  CivicFlow
               </span>
            </Link>

            <div className="flex items-center gap-4">
               <Link
                  to="/login"
                  className="text-sm font-medium text-secondary-text hover:text-primary-text transition-colors"
               >
                  Sign In
               </Link>
               <Link
                  to="/register"
                  className="text-sm font-semibold bg-primary-accent hover:opacity-90 text-surface px-4 py-2 rounded-lg transition-opacity duration-200"
               >
                  Register
               </Link>
            </div>
         </div>
      </nav>
   );
};

export default Navbar;

