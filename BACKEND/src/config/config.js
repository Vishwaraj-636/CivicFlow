import dotenv from "dotenv";
dotenv.config();


if (!process.env.MONGO_URI) {
   throw new Error("MONGO_URI is not defined in the environment variables");
}

if (!process.env.JWT_SECRET) {
   throw new Error("JWT_SECRET is not defined in the environment variables");
}

if (!process.env.GOOGLE_CLIENT_ID) {
   throw new Error("GOOGLE_CLIENT_ID is not defined in the environment variables");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
   throw new Error("GOOGLE_CLIENT_SECRET is not defined in the environment variables");
}

if (!process.env.NODE_ENV) {
   throw new Error("NODE_ENV is not defined in the environment variables");
}

if (!process.env.IMAGE_KIT_PRIVATE_KEY) {
   throw new Error("IMAGE_KIT_PRIVATE_KEY is not defined in the environment variables");
}


export const parseAllowedOrigins = (raw = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL) => {
   const input = (raw && String(raw).trim()) ? raw : "http://localhost:5173";
   return input
      .split(",")
      .map((item) => item.trim().replace(/\/+$/, ""))
      .filter(Boolean);
};

export const resolveCookieOptions = (env = process.env) => {
   const isProd = env.NODE_ENV === "production";
   const rawSameSite = (env.COOKIE_SAME_SITE || "").toLowerCase().trim();

   let sameSite = "lax";
   if (rawSameSite === "none") {
      sameSite = "none";
   } else if (rawSameSite === "strict") {
      sameSite = "strict";
   } else {
      sameSite = "lax";
   }

   const secure = sameSite === "none" ? true : isProd;

   return {
      httpOnly: true,
      sameSite,
      secure,
      path: "/",
   };
};

export const config = {
   MONGO_URI: process.env.MONGO_URI,
   JWT_SECRET: process.env.JWT_SECRET,
   GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
   GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
   NODE_ENV: process.env.NODE_ENV,
   IMAGE_KIT_PRIVATE_KEY: process.env.IMAGE_KIT_PRIVATE_KEY,
   CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
   ALLOWED_ORIGINS: parseAllowedOrigins(),
   GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
   COOKIE_OPTIONS: resolveCookieOptions(),
};

export const isOriginAllowed = (origin, allowedOrigins = null) => {
   if (!origin) return true; // Requests without origin header (e.g. mobile apps, curl, server-to-server health checks)
   const normalized = origin.trim().replace(/\/+$/, "");
   const currentAllowed = allowedOrigins || parseAllowedOrigins();
   return currentAllowed.includes(normalized);
};