import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hook/useAuth';

const RoleRoute = ({ allowedRoles, children }) => {
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

   // Ensure Google new users complete their profile
   if (user?.profileCompleted === false) {
      return <Navigate to="/complete-profile" replace />;
   }

   const hasRequiredRole = Array.isArray(allowedRoles)
      ? allowedRoles.includes(user?.role)
      : allowedRoles === user?.role;

   if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
   }

   return children ? children : <Outlet />;
};

export default RoleRoute;

