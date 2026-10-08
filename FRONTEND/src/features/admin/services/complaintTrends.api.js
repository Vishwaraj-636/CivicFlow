import axios from "axios";

const adminApi = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

export async function getAdminComplaintTrends(period) {
   const response = await adminApi.get("/admin/complaints/trends", { params: { period } });
   return response.data;
}
