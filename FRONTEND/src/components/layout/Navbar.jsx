import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hook/useAuth';

const Navbar = () => {
   const { isAuthenticated, user, handleLogout } = useAuth();
   const location = useLocation();
   const navigate = useNavigate();

   const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
   const linkClass = (path) => `text-xs font-semibold transition-colors ${isActive(path) ? 'text-[#173B5E]' : 'text-[#52606D] hover:text-[#17202A]'}`;

   const onLogout = async () => {
      await handleLogout();
      navigate('/login');
   };

   return (
      <nav className="sticky top-0 z-50 w-full border-b border-[#E2E6E4] bg-white">
         <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2 group">
               <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#173B5E]">
                  <span className="text-sm font-bold tracking-wider text-white">CF</span>
               </div>
               <span className="text-lg font-bold tracking-tight text-[#17202A] transition-colors group-hover:text-[#173B5E]">
                  CivicFlow
               </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-5">
               {isAuthenticated ? (
                  <>
                     {user?.role === "citizen" && (
                        <div className="hidden items-center gap-5 border-r border-[#E2E6E4] pr-5 md:flex">
                           <Link to="/citizen" className={linkClass('/citizen')}>
                              Dashboard
                           </Link>
                           <Link to="/citizen/complaints/report" className={linkClass('/citizen/complaints/report')}>
                              Report Complaint
                           </Link>
                           <Link to="/citizen/complaints" className={linkClass('/citizen/complaints')}>
                              My Complaints
                           </Link>
                           <Link to="/citizen/profile" className={linkClass('/citizen/profile')}>
                              Profile
                           </Link>
                        </div>
                     )}
                     {user?.role === "dept_staff" && (
                        <div className="hidden items-center gap-5 border-r border-[#E2E6E4] pr-5 md:flex">
                           <Link to="/staff" className={linkClass('/staff')}>
                              Dashboard
                           </Link>
                           <Link to="/staff/complaints" className={linkClass('/staff/complaints')}>
                              Complaint Queue
                           </Link>
                           <Link to="/staff/complaints/assigned" className={linkClass('/staff/complaints/assigned')}>
                              Assigned Complaints
                           </Link>
                           <Link to="/profile" className={linkClass('/profile')}>
                              Profile
                           </Link>
                        </div>
                     )}
                     {user?.role === "admin" && (
                        <div className="hidden items-center gap-5 border-r border-[#E2E6E4] pr-5 md:flex">
                           <Link to="/admin" className={linkClass('/admin')}>
                              Administration
                           </Link>
                           <Link to="/admin/staff-requests" className={linkClass('/admin/staff-requests')}>
                              Staff Requests
                           </Link>
                           <Link to="/profile" className={linkClass('/profile')}>
                              Profile
                           </Link>
                        </div>
                     )}
                     <span className="hidden max-w-40 truncate text-xs font-semibold text-[#52606D] sm:inline" title={user?.fullname || user?.email}>
                        {user?.fullname || user?.email}
                     </span>
                     <button
                        onClick={onLogout}
                        className="min-h-10 rounded-lg bg-[#173B5E] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 cursor-pointer"
                     >
                        Logout
                     </button>
                  </>
               ) : (
                  <>
                     <Link
                        to="/login"
                        className="text-xs font-semibold text-[#52606D] transition-colors hover:text-[#17202A]"
                     >
                        Sign In
                     </Link>
                     <Link
                        to="/register"
                        className="min-h-10 rounded-lg bg-[#173B5E] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-[#122E4A]"
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
