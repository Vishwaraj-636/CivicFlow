import axios from "axios";

const aiApi = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

export async function queryIncidentCopilot(query, incidentId) {
   const response = await aiApi.post("/ai/query", { query, incidentId });
   return response.data;
}
