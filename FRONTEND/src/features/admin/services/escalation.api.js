import axios from "axios";

const adminApi = axios.create({
   baseURL: "http://localhost:3000/api",
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
