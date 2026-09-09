import axios from "axios";

const staffRequestApiInstance = axios.create({
   baseURL: "http://localhost:3000/api",
   withCredentials: true,
});

export async function getDepartments() {
   const response = await staffRequestApiInstance.get("/departments");
   return response.data;
}

export async function createStaffRequest({ departmentId, supportingInfo }) {
   const response = await staffRequestApiInstance.post("/requests/staff", {
      departmentId,
      ...(supportingInfo ? { supportingInfo } : {}),
   });
   return response.data;
}

export async function getMyStaffRequest() {
   const response = await staffRequestApiInstance.get("/requests/staff/me");
   return response.data;
}
