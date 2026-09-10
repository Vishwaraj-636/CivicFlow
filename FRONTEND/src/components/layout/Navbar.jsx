import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hook/useAuth';

const Navbar = () => {
   const { isAuthenticated, user, handleLogout } = useAuth();
   const navigate = useNavigate();

   const onLogout = async () => {
      await handleLogout();
      navigate('/login');
   };

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
               {isAuthenticated ? (
                  <>
                     {user?.role === "citizen" && (
                        <div className="flex items-center gap-6 mr-4 border-r border-border pr-6 hidden md:flex">
                           <Link to="/citizen" className="text-sm font-medium text-secondary-text hover:text-primary-text">
                              Dashboard
                           </Link>
                           <Link to="/citizen/complaints/report" className="text-sm font-medium text-secondary-text hover:text-primary-text">
                              Report Complaint
                           </Link>
                           <Link to="/citizen/complaints" className="text-sm font-medium text-secondary-text hover:text-primary-text">
                              My Complaints
                           </Link>
                           <Link to="/citizen/profile" className="text-sm font-medium text-secondary-text hover:text-primary-text">
                              Profile
                           </Link>
                        </div>
                     )}
                     <span className="text-sm font-medium text-secondary-text">
                        {user?.fullname || user?.email}
                     </span>
                     <button
                        onClick={onLogout}
                        className="text-sm font-semibold bg-primary-accent hover:opacity-90 text-surface px-4 py-2 rounded-lg transition-opacity duration-200 cursor-pointer"
                     >
                        Logout
                     </button>
                  </>
               ) : (
                  <>
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
                  </>
               )}
            </div>
         </div>
      </nav>
   );
};

export default Navbar;
