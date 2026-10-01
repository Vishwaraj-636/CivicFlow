import IncidentCluster from "../model/incidentCluster.model.js";
import Complaint from "../model/complaint.model.js";
import { answerWithKnowledge, retrieveKnowledge } from "../ai/rag/rag.chain.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ignoredQueryTerms = new Set(["what", "which", "where", "when", "does", "this", "that", "show", "tell", "about", "with", "from", "have", "will", "can", "please"]);

const authorizedComplaintFilter = async (user) => {
   if (user.role === "citizen") return { citizenId: user._id, status: { $ne: "deleted" } };
   if (user.role === "dept_staff") return { assignedDepartment: user.departmentId, status: { $ne: "deleted" } };
   return { status: { $ne: "deleted" } };
};

const findLiveContext = async (query, user) => {
   if (!/complaint|report|incident|progress|status|assigned|department|priority|pothole|road|drain|street|waste|flood/i.test(query)) return "";
   const terms = String(query).toLowerCase().split(/\W+/).filter((term) => term.length > 3 && !ignoredQueryTerms.has(term)).slice(0, 8);
   const complaintFilter = await authorizedComplaintFilter(user);
   const searchFilter = terms.length > 0 ? {
      ...complaintFilter,
      $or: terms.flatMap((term) => {
         const expression = new RegExp(escapeRegex(term), "i");
         return [{ complaintId: expression }, { title: expression }, { description: expression }, { category: expression }, { address: expression }];
      }),
   } : complaintFilter;
   let complaints = await Complaint.find(searchFilter)
      .populate("assignedDepartment", "fullname code")
      .populate("assignedStaff", "fullname")
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean();
   if (complaints.length === 0 && terms.length > 0) {
      complaints = await Complaint.find(complaintFilter)
         .populate("assignedDepartment", "fullname code")
         .populate("assignedStaff", "fullname")
         .sort({ updatedAt: -1 })
         .limit(5)
         .lean();
   }
   if (complaints.length === 0) return "";
   const complaintIds = complaints.map((complaint) => complaint._id);
   const incidentFilter = user.role === "admin"
      ? { complaintIds: { $in: complaintIds } }
      : user.role === "dept_staff"
         ? { departmentIds: user.departmentId, complaintIds: { $in: complaintIds } }
         : { complaintIds: { $in: complaintIds } };
   const incidents = await IncidentCluster.find(incidentFilter).populate("departmentIds", "fullname code").sort({ updatedAt: -1 }).limit(5).lean();
   const complaintLines = complaints.map((complaint) => `${complaint.complaintId}: title=${complaint.title}; status=${complaint.status}; priority=${complaint.priority}; category=${complaint.category}; department=${complaint.assignedDepartment?.fullname ?? "pending"}; assignedStaff=${complaint.assignedStaff?.fullname ?? "unassigned"}; updated=${complaint.updatedAt}`);
   const incidentLines = incidents.map((incident) => `${incident.clusterId}: status=${incident.status}; reports=${incident.complaintCount}; confidence=${Math.round((incident.similarityConfidence ?? 0) * 100)}%; departments=${incident.departmentIds.map((department) => department.fullname).join(", ")}; updated=${incident.updatedAt}`);
   return `AUTHORIZED LIVE CIVICFLOW DATA\nComplaints:\n${complaintLines.join("\n")}\nIncidents:\n${incidentLines.join("\n")}`;
};

export const aiHealth = (req, res) => res.status(200).json({
   enabled: Boolean(process.env.LLM_API_KEY),
   provider: process.env.LLM_PROVIDER || "grounded-fallback",
   rag: true,
});

export const queryAI = async (req, res) => {
   try {
      const query = String(req.body.query || "").trim();
      if (!query) return res.status(400).json({ error: "A query is required" });
      const asksForIncidentProgress = /incident|real[- ]?time|live.*progress|progress.*live/i.test(query);
      if (asksForIncidentProgress && !req.body.incidentId) {
         const incidentFilter = req.user.role === "admin"
            ? {}
            : req.user.role === "dept_staff"
               ? { departmentIds: req.user.departmentId }
               : { complaintIds: { $in: await Complaint.find({ citizenId: req.user._id }).distinct("_id") } };
         const incidents = await IncidentCluster.find(incidentFilter)
            .populate("departmentIds", "fullname code")
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();
         if (incidents.length > 0) {
            const lines = incidents.map((incident, index) => `${index + 1}. ${incident.clusterId}: ${incident.status.replaceAll("_", " ")} | ${incident.complaintCount} reports | departments: ${incident.departmentIds.map((department) => department.fullname).join(", ") || "Pending assignment"} | confidence: ${Math.round((incident.similarityConfidence ?? 0) * 100)}% | updated: ${new Date(incident.updatedAt).toLocaleString("en-IN")}`);
            return res.status(200).json({
               answer: `Here is the latest live incident progress available to you:\n\n${lines.join("\n")}\n\nOpen an incident to view its timeline, grouped reports, map, and department coordination messages.`,
               sources: ["live incident records"],
               provider: "incident-records",
            });
         }
         return res.status(200).json({ answer: "There are no live incidents available for your account yet.", sources: ["live incident records"], provider: "incident-records" });
      }
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
      const liveContext = await findLiveContext(query, req.user);
      if (liveContext) incidentContext = [incidentContext, liveContext].filter(Boolean).join("\n\n");
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