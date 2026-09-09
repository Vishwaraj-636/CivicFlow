import axios from "axios";

const staffRequestApiInstance = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

export async function getStaffRequests({ status = "pending", departmentId } = {}) {
   const response = await staffRequestApiInstance.get("/admin/requests/staff", {
      params: {
         status,
         ...(departmentId ? { departmentId } : {}),
      },
   });
   return response.data;
}

export async function getStaffRequestById(requestId) {
   const response = await staffRequestApiInstance.get(`/admin/requests/staff/${requestId}`);
   return response.data;
}

export async function approveStaffRequest(requestId) {
   const response = await staffRequestApiInstance.patch(
      `/admin/requests/staff/${requestId}/approve`
   );
   return response.data;
}

export async function rejectStaffRequest(requestId, rejectionReason) {
   const response = await staffRequestApiInstance.patch(
      `/admin/requests/staff/${requestId}/reject`,
      { rejectionReason }
   );
   return response.data;
}
