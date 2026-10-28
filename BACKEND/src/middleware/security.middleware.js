import rateLimit from "express-rate-limit";

/**
 * Recursively checks if any key in an object, array, or nested structure starts with "$"
 * strictly without mutating any target objects or assigning to req.query.
 * @param {unknown} target
 * @returns {boolean}
 */
export function hasDollarKey(target) {
   if (!target || typeof target !== "object") return false;
   if (Array.isArray(target)) {
      for (const item of target) {
         if (hasDollarKey(item)) return true;
      }
      return false;
   }
   for (const key of Object.keys(target)) {
      if (key.startsWith("$")) return true;
      if (hasDollarKey(target[key])) return true;
   }
   return false;
}

/**
 * Operator-injection guard middleware for Express 5 compatibility.
 * Rejects requests containing keys starting with "$" with 400 Bad Request.
 */
export function operatorInjectionGuard(req, res, next) {
   if (hasDollarKey(req.body) || hasDollarKey(req.params) || hasDollarKey(req.query)) {
      return res.status(400).json({
         message: "Invalid request payload: operator keys starting with $ are not permitted.",
         error: "Operator injection blocked",
      });
   }
   next();
}

/**
 * General rate limiter: 300 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 300,
   standardHeaders: true,
   legacyHeaders: false,
   skip: (req) => {
      if (process.env.RATE_LIMIT_DISABLED === "1") return true;
      if (process.env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMIT_IN_TEST !== "1") return true;
      return false;
   },
   handler: (req, res) => {
      res.status(429).json({
         message: "Too many requests from this IP, please try again after 15 minutes.",
         error: "Rate limit exceeded",
      });
   },
});

/**
 * Auth rate limiter: 20 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 20,
   standardHeaders: true,
   legacyHeaders: false,
   skip: (req) => {
      if (process.env.RATE_LIMIT_DISABLED === "1") return true;
      if (process.env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMIT_IN_TEST !== "1") return true;
      return false;
   },
   handler: (req, res) => {
      res.status(429).json({
         message: "Too many authentication requests from this IP, please try again after 15 minutes.",
         error: "Auth rate limit exceeded",
      });
   },
});
