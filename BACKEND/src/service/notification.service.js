import Notification from "../model/notification.model.js";

export const createNotification = async ({ recipientId, complaintId, type, title, message, io }) => {
   const notification = await Notification.create({ recipientId, complaintId, type, title, message });
   const populated = await notification.populate("complaintId", "complaintId title status resolutionVerificationStatus");
   io?.to(`user:${recipientId}`).emit("notification:new", populated);
   return populated;
};
