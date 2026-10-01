import Conversation from "../model/conversation.model.js";
import DirectMessage from "../model/directMessage.model.js";
import User from "../model/user.model.js";
import Complaint from "../model/complaint.model.js";

export const getChatUsers = async (req, res) => {
   let filter = { isActive: true, _id: { $ne: req.user._id } };
   if (req.user.role === "dept_staff") {
      const citizenIds = await Complaint.find({ assignedDepartment: req.user.departmentId }).distinct("citizenId");
      filter = { ...filter, $or: [{ role: "dept_staff", departmentId: req.user.departmentId }, { role: "citizen", _id: { $in: citizenIds } }] };
   } else if (req.user.role === "citizen") {
      filter = { ...filter, role: "dept_staff" };
   }
   const users = await User.find(filter).select("fullname email role departmentId profileImage").sort({ fullname: 1 });
   return res.status(200).json(users);
};

export const getConversation = async (req, res) => {
   const conversation = await Conversation.findOne({ participants: { $all: [req.user._id, req.params.userId] }, kind: "direct" }).populate("participants", "fullname role departmentId profileImage");
   if (!conversation) return res.status(200).json({ conversation: null, messages: [] });
   const messages = await DirectMessage.find({ conversationId: conversation._id }).populate("senderId", "fullname role").sort({ createdAt: 1 }).limit(200);
   return res.status(200).json({ conversation, messages });
};

export const sendDirectMessage = async (req, res) => {
   const message = String(req.body.message || "").trim();
   if (!message) return res.status(400).json({ error: "Message is required" });
   const recipient = await User.findOne({ _id: req.params.userId, isActive: true });
   if (!recipient) return res.status(404).json({ error: "Recipient not found" });
   let conversation = await Conversation.findOne({ participants: { $all: [req.user._id, recipient._id] }, kind: "direct" });
   if (!conversation) conversation = await Conversation.create({ participants: [req.user._id, recipient._id] });
   const saved = await DirectMessage.create({ conversationId: conversation._id, senderId: req.user._id, recipientId: recipient._id, message });
   return res.status(201).json({ conversation, message: await saved.populate("senderId", "fullname role") });
};
