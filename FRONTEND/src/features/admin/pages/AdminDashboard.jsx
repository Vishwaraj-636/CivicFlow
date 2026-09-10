import { Outlet } from "react-router";

const AdminDashboard = () => (
   <div className="p-8 text-center">
      <h1 className="text-3xl font-light">Admin Dashboard</h1>
      <Outlet />
   </div>
);

export default AdminDashboard;