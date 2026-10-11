import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config.js";

const aiApi = axios.create({
   baseURL: API_BASE_URL,
   withCredentials: true,
 });

export async function queryIncidentCopilot(query, incidentId) {
   const response = await aiApi.post("/ai/query", { query, incidentId });
   return response.data;
}
