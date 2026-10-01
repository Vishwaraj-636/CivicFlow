import IncidentCluster from "../model/incidentCluster.model.js";
import Complaint from "../model/complaint.model.js";
import { analyzeIncident } from "../service/incidentIntelligence.service.js";
import IncidentMessage from "../model/incidentMessage.model.js";
import IncidentHandoff from "../model/incidentHandoff.model.js";

const canAccessIncident = (incident, user) => {
   if (user.role === "admin") return true;
   if (user.role === "citizen") {
      return incident.complaintIds.some((complaint) => String(complaint.citizenId?._id ?? complaint.citizenId) === String(user._id));
   }
   return incident.departmentIds.some((department) => String(department?._id ?? department) === String(user.departmentId));
};

const loadIncident = (id) => IncidentCluster.findById(id)
   .populate({
      path: "complaintIds",
      select: "complaintId title description category location createdAt status priority assignedDepartment assignedStaff",
      populate: [
         { path: "assignedDepartment", select: "fullname code" },
         { path: "assignedStaff", select: "fullname" },
      ],
   })
   .populate("departmentIds", "fullname code");

export const listIncidents = async (req, res) => {
   try {
      const filter = req.user.role === "admin"
         ? {}
         : req.user.role === "citizen"
            ? { complaintIds: { $in: await Complaint.find({ citizenId: req.user._id }).distinct("_id") } }
            : { departmentIds: req.user.departmentId };
      const incidents = await IncidentCluster.find(filter).sort({ priorityScore: -1, updatedAt: -1 }).limit(100);
      return res.status(200).json(incidents);
   } catch (error) {
      console.error("Error listing incidents:", error);
      return res.status(500).json({ error: "Unable to load incidents" });
   }
};

export const getIncident = async (req, res) => {
   try {
      const incident = await loadIncident(req.params.id);
      if (!incident || !canAccessIncident(incident, req.user)) {
         return res.status(404).json({ error: "Incident not found" });
      }
      return res.status(200).json(incident);
   } catch (error) {
      if (error.name === "CastError") return res.status(400).json({ error: "Invalid incident ID" });
      return res.status(500).json({ error: "Unable to load incident" });
   }
};

const incidentTransitions = {
   open: ["in_progress"],
   in_progress: ["resolved"],
   resolved: ["closed"],
   closed: [],
};

export const updateIncidentStatus = async (req, res) => {
   try {
      const incident = await IncidentCluster.findById(req.params.id);
      if (!incident || !canAccessIncident(incident, req.user)) {
         return res.status(404).json({ error: "Incident not found" });
      }

      const { status, note } = req.body;
      if (!Object.hasOwn(incidentTransitions, status)) {
         return res.status(400).json({ error: "Invalid incident status" });
      }
      if (!incidentTransitions[incident.status].includes(status)) {
         return res.status(409).json({ error: `Incident cannot transition from ${incident.status} to ${status}` });
      }

      const previousStatus = incident.status;
      incident.status = status;
      await incident.save();
      await IncidentMessage.create({
         incidentId: incident._id,
         senderId: req.user._id,
         senderDepartmentId: req.user.departmentId ?? null,
         message: note?.trim() || `Incident status changed from ${previousStatus} to ${status}`,
         messageType: "status_update",
      });
      return res.status(200).json(incident);
   } catch (error) {
      if (error.name === "CastError") return res.status(400).json({ error: "Invalid incident ID" });
      return res.status(500).json({ error: "Unable to update incident status" });
   }
};

export const getIncidentSimilarity = async (req, res) => {
   try {
      const incident = await loadIncident(req.params.id);
      if (!incident || !canAccessIncident(incident, req.user)) {
         return res.status(404).json({ error: "Incident not found" });
      }
      const primary = incident.complaintIds.find((complaint) => String(complaint._id) === String(incident.primaryComplaint))
         ?? incident.complaintIds[0];
      const matches = primary ? await analyzeIncident(primary) : [];
      const incidentMatches = matches.filter((match) => incident.complaintIds.some((complaint) => String(complaint._id) === String(match.complaint._id)));
      const strongestMatch = incidentMatches[0];
      const signalNames = { geographic: "Location", category: "Category", lexical: "Description", semantic: "Similar issue", temporal: "Time" };
      const signals = Object.entries(strongestMatch?.features ?? {}).map(([key, value]) => ({
         key,
         label: signalNames[key] ?? key,
         score: Math.round(value * 100),
         meaning: key === "geographic" ? "Reports are in the same area" : key === "category" ? "Reports use compatible civic categories" : key === "lexical" ? "Descriptions share important terms" : key === "semantic" ? "The issues describe a similar real-world problem" : "Reports were submitted within a similar period",
      }));
      const classification = strongestMatch?.classification ?? "related";
      return res.status(200).json({
         algorithm: "HISC v1",
         baseline: "category + geographic proximity + lexical Jaccard",
         proposed: "candidate retrieval + spatio-semantic-temporal ranking",
         clusterConfidence: incident.similarityConfidence,
         classification,
         signals,
         explanation: classification === "duplicate"
            ? "CivicFlow considers these reports likely to describe the same real-world incident."
            : "CivicFlow considers these reports related enough to coordinate, but not necessarily the exact same issue.",
         recommendedAction: classification === "duplicate"
            ? "Review the existing incident and coordinate the involved departments before creating separate field work."
            : "Coordinate the involved departments and confirm whether the reports require one shared response or separate work orders.",
         matches: incidentMatches,
      });
   } catch (error) {
      return res.status(500).json({ error: "Unable to explain incident similarity" });
   }
};

export const getIncidentMessages = async (req, res) => {
   try {
      const incident = await loadIncident(req.params.id);
      if (!incident || !canAccessIncident(incident, req.user)) return res.status(404).json({ error: "Incident not found" });
      const messages = await IncidentMessage.find({ incidentId: incident._id })
         .populate("senderId", "fullname role").populate("senderDepartmentId", "fullname code").sort({ createdAt: 1 });
      return res.status(200).json(messages);
   } catch (error) {
      return res.status(500).json({ error: "Unable to load incident messages" });
   }
};

export const requestIncidentHandoff = async (req, res) => {
   try {
      const incident = await loadIncident(req.params.id);
      if (!incident || req.user.role !== "dept_staff" || !canAccessIncident(incident, req.user)) {
         return res.status(403).json({ error: "You cannot request this handoff" });
      }
      const { toDepartmentId, note } = req.body;
      if (!toDepartmentId || String(toDepartmentId) === String(req.user.departmentId)) {
         return res.status(400).json({ error: "A different destination department is required" });
      }
      const handoff = await IncidentHandoff.create({ incidentId: incident._id, fromDepartmentId: req.user.departmentId, toDepartmentId, requestedBy: req.user._id, note });
      await IncidentMessage.create({ incidentId: incident._id, senderId: req.user._id, senderDepartmentId: req.user.departmentId, message: note || "Department assistance requested", messageType: "handoff", mentions: [toDepartmentId] });
      return res.status(201).json(handoff);
   } catch (error) {
      if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: "Unable to request handoff" });
   }
};

export const decideIncidentHandoff = async (req, res) => {
   try {
      const handoff = await IncidentHandoff.findById(req.params.handoffId);
      if (!handoff || (req.user.role !== "admin" && String(handoff.toDepartmentId) !== String(req.user.departmentId))) return res.status(404).json({ error: "Handoff not found" });
      if (!["accepted", "rejected"].includes(req.body.status)) return res.status(400).json({ error: "Status must be accepted or rejected" });
      handoff.status = req.body.status;
      handoff.decidedBy = req.user._id;
      handoff.decidedAt = new Date();
      await handoff.save();
      if (handoff.status === "accepted") {
         await IncidentCluster.findByIdAndUpdate(handoff.incidentId, { $addToSet: { departmentIds: handoff.toDepartmentId } });
      }
      return res.status(200).json(handoff);
   } catch (error) {
      return res.status(500).json({ error: "Unable to update handoff" });
   }
};