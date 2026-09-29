import IncidentCluster from "../model/incidentCluster.model.js";
import { answerWithKnowledge, retrieveKnowledge } from "../ai/rag/rag.chain.js";

export const aiHealth = (req, res) => res.status(200).json({
   enabled: Boolean(process.env.LLM_API_KEY),
   provider: process.env.LLM_PROVIDER || "grounded-fallback",
   rag: true,
});

export const queryAI = async (req, res) => {
   try {
      const query = String(req.body.query || "").trim();
      if (!query) return res.status(400).json({ error: "A query is required" });
      let incidentContext = "";
      if (req.body.incidentId) {
         const incident = await IncidentCluster.findById(req.body.incidentId)
            .populate("departmentIds", "fullname code")
            .populate("complaintIds", "citizenId");
         const authorized = incident && (req.user.role === "admin"
            || (req.user.role === "dept_staff" && incident.departmentIds.some((department) => String(department._id) === String(req.user.departmentId)))
            || (req.user.role === "citizen" && incident.complaintIds.some((complaint) => String(complaint.citizenId) === String(req.user._id))));
         if (!authorized) return res.status(404).json({ error: "Incident not found" });
         incidentContext = `Incident ${incident.clusterId}: ${incident.complaintCount} reports, category ${incident.category}, confidence ${incident.similarityConfidence}, departments ${incident.departmentIds.map((department) => department.fullname).join(", ")}`;
      }
      const documents = await retrieveKnowledge(query);
      return res.status(200).json(await answerWithKnowledge({ query, incidentContext, documents }));
   } catch (error) {
      console.error("AI query failed:", error.message);
      return res.status(200).json({ answer: "The copilot is unavailable. Live CivicFlow operations can continue without it.", sources: [], provider: "error-fallback" });
   }
};