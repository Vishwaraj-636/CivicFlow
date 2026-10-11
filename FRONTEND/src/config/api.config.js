/**
 * Shared API and Socket configuration for CivicFlow frontend.
 * Provides normalized base URLs with configurable environment overrides.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const API_BASE_URL = String(rawApiUrl).trim().replace(/\/+$/, "");

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
export const SOCKET_URL = String(rawSocketUrl).trim().replace(/\/+$/, "");

export const buildApiUrl = (path = "") => {
   if (!path) return API_BASE_URL;
   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   return `${API_BASE_URL}${cleanPath}`;
};

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/auth/google`;
