import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hook/useAuth';

const AuthRedirect = () => {
   const { user, initialized, isAuthenticated } = useAuth();

   if (!initialized) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div>Loading authentication...</div>
         </div>
      );
   }

   if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
   }

   // Google new user with incomplete profile
   if (user.profileCompleted === false) {
      return <Navigate to="/complete-profile" replace />;
   }

   // Role-based redirection
   if (user.role === 'citizen') {
      return <Navigate to="/citizen" replace />;
   }

   if (user.role === 'dept_staff') {
      if (!user.departmentId) {
         return <Navigate to="/unauthorized" replace />;
      }
      return <Navigate to="/staff" replace />;
   }

   if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
   }

   return <Navigate to="/unauthorized" replace />;
};

export default AuthRedirect;

