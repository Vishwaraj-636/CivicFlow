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
import CitizenDashboard from "../features/citizen/pages/CitizenDashboard";
import MyComplaints from "../features/citizen/pages/MyComplaints";
import ComplaintReport from "../features/citizen/pages/ComplaintReport";
import ComplaintDetails from "../features/citizen/pages/ComplaintDetails";
import TrackComplaint from "../features/citizen/pages/TrackComplaint";
import Profile from "../features/citizen/pages/Profile";


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
            element: <AuthRedirect />
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
            element: <RoleRoute allowedRoles="citizen" />,
            children: [
               {
                  index: true,
                  element: <CitizenDashboard />
               },
               {
                  path: "complaints",
                  element: <MyComplaints />
               },
               {
                  path: "complaints/report",
                  element: <ComplaintReport />
               },
               {
                  path: "complaints/:id",
                  element: <ComplaintDetails />
               },
               {
                  path: "complaints/:id/track",
                  element: <TrackComplaint />
               },
               {
                  path: "profile",
                  element: <Profile />
               }
            ]
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