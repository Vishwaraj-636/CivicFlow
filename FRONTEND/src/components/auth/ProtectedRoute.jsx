import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hook/useAuth';

const ProtectedRoute = ({ children }) => {
   const { initialized, isAuthenticated, user } = useAuth();

   if (!initialized) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div>Loading authentication...</div>
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
