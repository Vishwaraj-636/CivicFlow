import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config.js";

const incidentApi = axios.create({
   baseURL: API_BASE_URL,
   withCredentials: true,
});

export async function getIncident(incidentId) {
   const response = await incidentApi.get(`/incidents/${incidentId}`);
   return response.data;
}

export async function getIncidentSimilarity(incidentId) {
   const response = await incidentApi.get(`/incidents/${incidentId}/similarity`);
   return response.data;
}

export async function getIncidentMessages(incidentId) {
   const response = await incidentApi.get(`/incidents/${incidentId}/messages`);
   return response.data;
}

export async function updateIncidentStatus(incidentId, status, note = "") {
   const response = await incidentApi.patch(`/incidents/${incidentId}/status`, { status, note });
   return response.data;
}

export async function getDepartments() {
   const response = await incidentApi.get("/departments");
   return response.data;
}

export async function requestIncidentHandoff(incidentId, toDepartmentId, note) {
   const response = await incidentApi.post(`/incidents/${incidentId}/handoff`, { toDepartmentId, note });
   return response.data;
}
