import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config.js";

const adminApi = axios.create({
   baseURL: API_BASE_URL,
   withCredentials: true,
});

export async function getAdminComplaintTrends(period) {
   const response = await adminApi.get("/admin/complaints/trends", { params: { period } });
   return response.data;
}
