import axios from "axios";

const authApiInstance = axios.create({
   baseURL: "http://localhost:3000/api/auth",
   withCredentials: true,
})

const requestApiInstance = axios.create({
   baseURL: "http://localhost:3000/api/request",
   withCredentials: true,
})

export async function register({ email, contact, password, fullname }) {
   const response = await authApiInstance.post("/register", {
      email,
      contact,
      password,
      fullname
   })
   return response.data;
}

export async function login({ email, password }) {
   const response = await authApiInstance.post("/login", {
      email,
      password
   })
   return response.data;
}

export async function requestDeptStaff({ email, contact, password, fullname, department }) {
   const response = await requestApiInstance.post("/dept-staff", {
      email,
      contact,
      password,
      fullname,
      department
   })
   return response.data;
}

export async function getGoogleAuthUrl() {
   const response = await authApiInstance.get("/google/url");
   return response.data;
}

export async function completeGoogleProfile({ role, contact, department }) {
   const response = await authApiInstance.post("/complete-profile", {
      role,
      contact,
      department
   })
   return response.data;
}

export async function logout() {
   const response = await authApiInstance.post("/logout");
   return response.data;
}

export async function getCurrentUser() {
   const response = await authApiInstance.get("/me");
   return response.data;
}