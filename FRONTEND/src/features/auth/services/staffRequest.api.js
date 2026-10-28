import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config.js";

const staffRequestApiInstance = axios.create({
   baseURL: API_BASE_URL,
   withCredentials: true,
});

export async function getDepartments() {
   const response = await staffRequestApiInstance.get("/departments");
   return response.data;
}

export async function createStaffRequest({ departmentId }) {
   const response = await staffRequestApiInstance.post("/requests/staff", { departmentId });
   return response.data;
}

export async function getMyStaffRequest() {
   const response = await staffRequestApiInstance.get("/requests/staff/me");
   return response.data;
}
