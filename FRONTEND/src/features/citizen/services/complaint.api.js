import axios from "axios";

const complaintApiInstance = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

function normalizeComplaintData(complaintData) {
   if (!complaintData?.location?.lat && complaintData?.location?.lat !== 0) {
      return complaintData;
   }

   return {
      ...complaintData,
      location: {
         type: "Point",
         coordinates: [complaintData.location.lng, complaintData.location.lat],
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

export async function updateComplaintStatus(complaintId, status, options = {}) {
   const response = await complaintApiInstance.patch(`/staff/complaints/${complaintId}/status`, {
      status,
      ...options,
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
