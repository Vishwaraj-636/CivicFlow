import axios from "axios";

const adminApi = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

export async function getAdminComplaintMapData() {
   const response = await adminApi.get("/admin/complaints/map");
   return response.data;
}
