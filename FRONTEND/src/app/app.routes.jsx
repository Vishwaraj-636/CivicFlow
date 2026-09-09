import { createBrowserRouter, Outlet } from "react-router";
import Register from "../features/auth/pages/register";
import Login from "../features/auth/pages/Login";
import DeptStaffRequest from "../features/auth/pages/DeptStaffRequest";
import RootLayout from "../components/layout/RootLayout";
import AuthRedirect from "../components/auth/AuthRedirect";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import CompleteGoogleProfile from "../features/auth/pages/CompleteGoogleProfile";
import RoleRoute from "../components/auth/RoleRoute";
import Unauthorized from "../features/auth/pages/Unauthorized";
import StaffRequests from "../features/admin/pages/StaffRequests";


// Placeholder Dashboards
const CitizenDashboard = () => <div className="p-8 text-center"><h1 className="text-3xl font-light">Citizen Dashboard</h1></div>;
const StaffDashboard = () => <div className="p-8 text-center"><h1 className="text-3xl font-light">Staff Dashboard</h1></div>;
const AdminDashboard = () => (
   <div className="p-8 text-center">
      <h1 className="text-3xl font-light">Admin Dashboard</h1>
      <Outlet />
   </div>
);

export const routes = createBrowserRouter([
   {
      path: "/",
      element: <RootLayout />,
      children: [
         {
            index: true,
            element: <div className="p-8 text-center"><h1 className="text-3xl font-light">Welcome to CivicFlow</h1><p className="text-secondary-text mt-2">Manage your complaints seamlessly.</p></div>
         },
         {
            path: "dashboard",
            element: <AuthRedirect />
         },
         {
            path: "register",
            element: <Register />
         },
         {
            path: "login",
            element: <Login />
         },
         {
            path: "request-dept-staff",
            element: (
               <ProtectedRoute>
                  <DeptStaffRequest />
               </ProtectedRoute>
            )
         },
         {
            path: "complete-profile",
            element: <CompleteGoogleProfile />
         },
         {
            path: "unauthorized",
            element: <Unauthorized />
         },
         {
            path: "citizen",
            element: (
               <RoleRoute allowedRoles="citizen">
                  <CitizenDashboard />
               </RoleRoute>
            )
         },
         {
            path: "staff",
            element: (
               <RoleRoute allowedRoles="dept_staff">
                  <StaffDashboard />
               </RoleRoute>
            )
         },
         {
            path: "admin",
            element: (
               <RoleRoute allowedRoles="admin">
                  <AdminDashboard />
               </RoleRoute>
            ),
            children: [
               {
                  path: "staff-requests",
                  element: <StaffRequests />
               }
            ]
         }
      ]
   }
]);