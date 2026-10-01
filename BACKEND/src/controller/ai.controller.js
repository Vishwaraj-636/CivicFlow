import IncidentCluster from "../model/incidentCluster.model.js";
import Complaint from "../model/complaint.model.js";
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
      const asksForComplaintRecords = /\b(my|i|we|our)\b.*\b(complaint|report|request)\b|\b(complaint|report|request)\b.*\b(posted|submitted|filed|progress|status|track)\b/i.test(query);
      if (asksForComplaintRecords && !req.body.incidentId) {
         const filter = req.user.role === "citizen"
            ? { citizenId: req.user._id, status: { $ne: "deleted" } }
            : req.user.role === "dept_staff"
               ? { assignedDepartment: req.user.departmentId, status: { $ne: "deleted" } }
               : { status: { $ne: "deleted" } };
         const complaints = await Complaint.find(filter)
            .populate("assignedDepartment", "fullname code")
            .populate("assignedStaff", "fullname")
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();
         if (complaints.length > 0) {
            const lines = complaints.map((complaint, index) => `${index + 1}. ${complaint.complaintId}: ${complaint.title} | status: ${complaint.status.replaceAll("_", " ")} | priority: ${complaint.priority} | department: ${complaint.assignedDepartment?.fullname ?? "Pending assignment"}${complaint.assignedStaff?.fullname ? ` | staff: ${complaint.assignedStaff.fullname}` : ""}`);
            return res.status(200).json({
               answer: `Here are the complaint records available to you:\n\n${lines.join("\n")}\n\nOpen My Complaints or the complaint detail page to view the full timeline and resolution notes.`,
               sources: ["live complaint records"],
               provider: "complaint-records",
            });
         }
         return res.status(200).json({ answer: "There are no complaint records available for your account yet. You can submit a complaint from the Report Complaint page.", sources: ["live complaint records"], provider: "complaint-records" });
      }
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
      let documents = [];
      try {
         documents = await retrieveKnowledge(query);
      } catch (knowledgeError) {
         console.error("Knowledge retrieval failed:", knowledgeError.message);
      }
      return res.status(200).json(await answerWithKnowledge({ query, incidentContext, documents }));
   } catch (error) {
      console.error("AI query failed:", error.message);
      return res.status(200).json({ answer: "CivicFlow Assistant could not complete that request. Live complaint operations remain available; please contact the responsible department for confirmation.", sources: [], provider: "error-fallback" });
   }
};