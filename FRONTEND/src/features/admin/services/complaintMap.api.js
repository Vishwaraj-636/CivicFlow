import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config.js";

const adminApi = axios.create({
   baseURL: API_BASE_URL,
   withCredentials: true,
});

export async function getAdminComplaintMapData() {
   const response = await adminApi.get("/admin/complaints/map");
   return response.data;
}
