/**
 * Shared API and Socket configuration for CivicFlow frontend.
 * Provides normalized base URLs with configurable environment overrides.
 *
 * In production (single-origin Render deployment):
 * - API defaults to relative "/api"
 * - Socket.IO defaults to current window origin (same-host connection)
 *
 * In development:
 * - API defaults to "http://localhost:3000/api"
 * - Socket.IO defaults to "http://localhost:3000"
 *
 * Explicit VITE_API_URL and VITE_SOCKET_URL environment overrides always take precedence.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000/api");
export const API_BASE_URL = String(rawApiUrl).trim().replace(/\/+$/, "");

const getBrowserOrigin = () => {
   if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
   }
   return "";
};

const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? getBrowserOrigin() : "http://localhost:3000");
export const SOCKET_URL = String(rawSocketUrl).trim().replace(/\/+$/, "");

export const buildApiUrl = (path = "") => {
   if (!path) return API_BASE_URL;
   const cleanPath = path.startsWith("/") ? path : `/${path}`;
   return `${API_BASE_URL}${cleanPath}`;
};

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/auth/google`;
