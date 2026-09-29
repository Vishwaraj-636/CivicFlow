import axios from "axios";

const incidentApi = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

async function getIncidentForComplaint(complaintId) {
   try {
      const response = await incidentApi.get("/incidents", {
         params: { complaintId },
      });

      const payload = response.data;
      if (Array.isArray(payload)) return payload[0] ?? null;
      return payload?.incident ?? payload?.data?.[0] ?? payload?.data ?? payload ?? null;
   } catch (error) {
      if (error.response?.status !== 404) throw error;

      const response = await incidentApi.get(`/incidents/complaint/${complaintId}`);
      return response.data?.incident ?? response.data?.data ?? response.data ?? null;
   }
}

export async function getIncidentById(incidentId) {
   const response = await incidentApi.get(`/incidents/${incidentId}`);
   return response.data?.incident ?? response.data?.data ?? response.data ?? null;
}

export async function getIncidentForComplaintSafe(complaintId) {
   try {
      return await getIncidentForComplaint(complaintId);
   } catch (error) {
      if ([401, 403, 404].includes(error.response?.status)) return null;
      throw error;
   }
}

export async function getIncidentMessages(incidentId) {
   const response = await incidentApi.get(`/incidents/${incidentId}/messages`);
   return response.data?.messages ?? response.data?.data ?? response.data ?? [];
}

export async function sendIncidentMessage(incidentId, message) {
   const response = await incidentApi.post(`/incidents/${incidentId}/messages`, { message });
   return response.data?.message ?? response.data?.data ?? response.data;
}

export async function requestDepartmentHandoff(incidentId, departmentId, reason) {
   const response = await incidentApi.post(`/incidents/${incidentId}/handoff`, {
      departmentId,
      reason,
   });
   return response.data?.incident ?? response.data?.data ?? response.data;
}

export async function getIncidents(params = {}) {
   const response = await incidentApi.get("/incidents", { params });
   const payload = response.data;
   return Array.isArray(payload)
      ? payload
      : payload?.incidents ?? payload?.data ?? [];
}
