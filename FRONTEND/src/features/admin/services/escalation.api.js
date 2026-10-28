import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config.js";

const adminApi = axios.create({
   baseURL: API_BASE_URL,
   withCredentials: true,
});

export async function getEscalatedComplaints() {
   const response = await adminApi.get("/admin/complaints/escalated");
   return response.data;
}

export async function getEscalationSummary() {
   const response = await adminApi.get("/admin/complaints/escalation-summary");
   return response.data;
}
