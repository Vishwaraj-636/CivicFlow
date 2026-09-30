import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { decideIncidentHandoff, getIncident, getIncidentCost, getIncidentMessages, getIncidentSimilarity, listIncidents, requestIncidentHandoff, updateIncidentStatus } from "../controller/incident.controller.js";

const router = express.Router();
router.use(authenticate, requireRole("citizen", "dept_staff", "admin"));
router.get("/incidents", listIncidents);
router.get("/incidents/:id", getIncident);
router.patch("/incidents/:id/status", requireRole("dept_staff", "admin"), updateIncidentStatus);
router.get("/incidents/:id/cost", getIncidentCost);
router.get("/incidents/:id/similarity", getIncidentSimilarity);
router.get("/incidents/:id/messages", getIncidentMessages);
router.post("/incidents/:id/handoff", requireRole("dept_staff"), requestIncidentHandoff);
router.patch("/incidents/:id/handoff/:handoffId", requireRole("dept_staff", "admin"), decideIncidentHandoff);

export default router;