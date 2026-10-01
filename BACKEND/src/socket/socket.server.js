import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { config } from "../config/config.js";
import User from "../model/user.model.js";
import IncidentCluster from "../model/incidentCluster.model.js";
import IncidentMessage from "../model/incidentMessage.model.js";
import Conversation from "../model/conversation.model.js";
import DirectMessage from "../model/directMessage.model.js";

const canAccess = (incident, user) => user.role === "admin"
   || (user.role === "dept_staff" && incident.departmentIds.some((id) => String(id?._id ?? id) === String(user.departmentId)))
   || (user.role === "citizen" && incident.complaintIds.some((complaint) => String(complaint.citizenId) === String(user._id)));

const loadAuthorizedIncident = async (incidentId, user) => {
   const incident = await IncidentCluster.findById(incidentId).populate("complaintIds", "citizenId");
   return incident && canAccess(incident, user) ? incident : null;
};

const tokenFromCookie = (cookieHeader = "") => cookieHeader.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith("token="))?.slice(6);

export const attachSocketServer = (httpServer) => {
   const io = new Server(httpServer, { cors: { origin: "http://localhost:5173", credentials: true } });
   io.use(async (socket, next) => {
      try {
         const token = socket.handshake.auth?.token
            || socket.handshake.headers.authorization?.split(" ")[1]
            || tokenFromCookie(socket.handshake.headers.cookie);
         const decoded = jwt.verify(token, config.JWT_SECRET);
         const user = await User.findById(decoded.id);
         if (!user?.isActive) return next(new Error("Unauthorized"));
         socket.user = user;
         return next();
      } catch {
         return next(new Error("Unauthorized"));
      }
   });

   io.on("connection", (socket) => {
      socket.join(`user:${socket.user._id}`);
      socket.on("incident:join", async (incidentId, callback = () => { }) => {
         const incident = await loadAuthorizedIncident(incidentId, socket.user);
         if (!incident) return callback({ error: "Incident not found" });
         socket.join(`incident:${incidentId}`);
         callback({ ok: true });
      });
      socket.on("incident:leave", (incidentId) => socket.leave(`incident:${incidentId}`));
      socket.on("message:send", async ({ incidentId, message, messageType = "message" }, callback = () => { }) => {
         const incident = await loadAuthorizedIncident(incidentId, socket.user);
         if (!incident || !message?.trim()) return callback({ error: "Message not allowed" });
         const saved = await IncidentMessage.create({ incidentId, senderId: socket.user._id, senderDepartmentId: socket.user.departmentId, message: message.trim(), messageType });
         const populated = await saved.populate("senderId", "fullname role");
         io.to(`incident:${incidentId}`).emit("message:new", populated);
         callback({ ok: true, message: populated });
      });
      socket.on("direct:join", async (userId, callback = () => { }) => {
         const otherUser = await User.findOne({ _id: userId, isActive: true });
         if (!otherUser) return callback({ error: "User not found" });
         socket.join(`direct:${[String(socket.user._id), String(userId)].sort().join(":")}`);
         callback({ ok: true });
      });
      socket.on("direct:send", async ({ recipientId, message }, callback = () => { }) => {
         const cleanMessage = String(message || "").trim();
         const recipient = await User.findOne({ _id: recipientId, isActive: true });
         if (!recipient || !cleanMessage) return callback({ error: "Message not allowed" });
         let conversation = await Conversation.findOne({ participants: { $all: [socket.user._id, recipient._id] }, kind: "direct" });
         if (!conversation) conversation = await Conversation.create({ participants: [socket.user._id, recipient._id] });
         const saved = await DirectMessage.create({ conversationId: conversation._id, senderId: socket.user._id, recipientId: recipient._id, message: cleanMessage });
         const populated = await saved.populate("senderId", "fullname role");
         const room = `direct:${[String(socket.user._id), String(recipient._id)].sort().join(":")}`;
         io.to(room).emit("direct:new", populated);
         callback({ ok: true, message: populated });
      });
   });
   return io;
};