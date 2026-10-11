import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hook/useAuth';

const ProtectedRoute = ({ children }) => {
   const { initialized, isAuthenticated, user } = useAuth();
   const [showColdStartNotice, setShowColdStartNotice] = useState(false);

   useEffect(() => {
      if (initialized) return;
      const timer = setTimeout(() => setShowColdStartNotice(true), 8000);
      return () => clearTimeout(timer);
   }, [initialized]);

   if (!initialized) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-4 text-center">
            <div className="text-sm font-medium text-[#173B5E]">Loading authentication…</div>
            {showColdStartNotice && (
               <div className="max-w-sm text-xs text-[#52606D] bg-[#F0F4F8] border border-[#D0DBE5] rounded-lg p-3">
                  The server is waking up. This can take a minute on the free plan.
               </div>
            )}
         </div>
      );
   }

   if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
   }

   if (user?.profileCompleted === false) {
      return <Navigate to="/complete-profile" replace />;
   }

   return children ? children : <Outlet />;
};

export default ProtectedRoute;
