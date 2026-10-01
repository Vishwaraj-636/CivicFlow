import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { getChatUsers, getConversation, sendDirectMessage } from "../controller/chat.controller.js";

const router = express.Router();
router.use(authenticate, requireRole("citizen", "dept_staff", "admin"));
router.get("/chat/users", getChatUsers);
router.get("/chat/conversations/:userId", getConversation);
router.post("/chat/conversations/:userId/messages", sendDirectMessage);
export default router;