import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { aiHealth, queryAI } from "../controller/ai.controller.js";

const router = express.Router();
router.get("/ai/health", aiHealth);
router.post("/ai/query", authenticate, requireRole("citizen", "dept_staff", "admin"), queryAI);
export default router;