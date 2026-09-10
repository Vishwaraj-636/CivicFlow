import axios from "axios";

const complaintApiInstance = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

function normalizeComplaintData(complaintData) {
   const latitude = complaintData?.location?.latitude ?? complaintData?.location?.lat;
   const longitude = complaintData?.location?.longitude ?? complaintData?.location?.lng;

   if (typeof latitude !== "number" || typeof longitude !== "number") {
      return complaintData;
   }

   return {
      ...complaintData,
      location: {
         type: "Point",
         coordinates: [longitude, latitude],
      },
   };
}

export async function createComplaint(complaintData) {
   const response = await complaintApiInstance.post("/complaints", normalizeComplaintData(complaintData));
   return response.data;
}

export async function uploadComplaintMedia(files) {
   const formData = new FormData();
   files.forEach((file) => formData.append("files", file));
   const response = await complaintApiInstance.post("/complaints/media", formData);
   return response.data;
}

export async function getMyComplaints() {
   const response = await complaintApiInstance.get("/complaints/my");
   return response.data;
}

export async function getComplaintById(complaintId) {
   const response = await complaintApiInstance.get(`/complaints/${complaintId}`);
   return response.data;
}

export async function updateComplaint(complaintId, complaintData) {
   const response = await complaintApiInstance.patch(
      `/complaints/${complaintId}`,
      normalizeComplaintData(complaintData)
   );
   return response.data;
}

export async function getStaffComplaints() {
   const response = await complaintApiInstance.get("/staff/complaints");
   return response.data;
}

export async function getAssignedComplaints() {
   const response = await complaintApiInstance.get("/staff/complaints/assigned");
   return response.data;
}

export async function getStaffComplaintById(complaintId) {
   const response = await complaintApiInstance.get(`/staff/complaints/${complaintId}`);
   return response.data;
}

export async function updateComplaintStatus(complaintId, status, options = {}) {
   const response = await complaintApiInstance.patch(`/staff/complaints/${complaintId}/status`, {
      newStatus: status,
      ...options,
   });
   return response.data;
}

export async function acceptComplaint(complaintId) {
   const response = await complaintApiInstance.patch(`/staff/complaints/${complaintId}/accept`);
   return response.data;
}

export async function rejectComplaint(complaintId, reason) {
   const response = await complaintApiInstance.patch(`/staff/complaints/${complaintId}/reject`, { reason });
   return response.data;
}

export async function resolveComplaint(complaintId, resolutionDescription, resolutionMedia = []) {
   const response = await complaintApiInstance.patch(`/staff/complaints/${complaintId}/resolve`, {
      resolutionDescription,
      resolutionMedia,
   });
   return response.data;
}

export async function assignComplaint(complaintId, assignedDepartment, assignedStaff, remark) {
   const response = await complaintApiInstance.patch(`/staff/complaints/${complaintId}/assign`, {
      assignedDepartment,
      ...(assignedStaff ? { assignedStaff } : {}),
      ...(remark ? { remark } : {}),
   });
   return response.data;
}

export async function deleteComplaint(complaintId) {
   const response = await complaintApiInstance.delete(`/complaints/${complaintId}`);
   return response.data;
}

export async function getComplaintTimeline(complaintId) {
   const response = await complaintApiInstance.get(`/complaints/${complaintId}/timeline`);
   return response.data;
}
