import axios from "axios";

const staffApiInstance = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

export async function getStaffComplaints() {
   const response = await staffApiInstance.get("/staff/complaints");
   return response.data;
}

export async function getAssignedComplaints() {
   const response = await staffApiInstance.get("/staff/complaints/assigned");
   return response.data;
}

export async function getComplaintById(complaintId) {
   const response = await staffApiInstance.get(`/staff/complaints/${complaintId}`);
   return response.data;
}

export async function acceptComplaint(complaintId) {
   const response = await staffApiInstance.patch(`/staff/complaints/${complaintId}/accept`);
   return response.data;
}

export async function rejectComplaint(complaintId, reason) {
   const response = await staffApiInstance.patch(`/staff/complaints/${complaintId}/reject`, { reason });
   return response.data;
}

export async function updateComplaintStatus(complaintId, newStatus, options = {}) {
   const response = await staffApiInstance.patch(`/staff/complaints/${complaintId}/status`, {
      newStatus,
      ...options,
   });
   return response.data;
}

export async function resolveComplaint(complaintId, resolutionDescription, resolutionMedia = []) {
   const response = await staffApiInstance.patch(`/staff/complaints/${complaintId}/resolve`, {
      resolutionDescription,
      resolutionMedia,
   });
   return response.data;
}

export async function getComplaintTimeline(complaintId) {
   const response = await staffApiInstance.get(`/complaints/${complaintId}/timeline`);
   return response.data;
}
