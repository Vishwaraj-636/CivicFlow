import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { config, isOriginAllowed } from './config/config.js';
import {
   generalLimiter,
   authLimiter,
   operatorInjectionGuard,
} from './middleware/security.middleware.js';

import authRouter from './routes/auth.routes.js';
import requestRouter from './routes/request.routes.js';
import departmentRouter from "./routes/department.routes.js"
import complaintRouter from "./routes/complaint.routes.js";
import complaintTimelineRouter from "./routes/complaintTimeline.routes.js";
import incidentRouter from "./routes/incident.routes.js";
import aiRouter from "./routes/ai.routes.js";
import chatRouter from "./routes/chat.routes.js";

const app = express();

app.set("trust proxy", Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : 0)));

app.use(helmet({
   crossOriginResourcePolicy: { policy: "cross-origin" },
   contentSecurityPolicy: {
      directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
         fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
         imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://ik.imagekit.io",
            "https://*.tile.jawg.io",
            "https://*.tile.openstreetmap.org",
            "https://placehold.co",
         ],
         mediaSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://ik.imagekit.io",
         ],
         connectSrc: [
            "'self'",
            "ws:",
            "wss:",
            "https://nominatim.openstreetmap.org",
            "https://*.tile.jawg.io",
         ],
         workerSrc: ["'self'", "blob:"],
      },
   },
}));
app.use(generalLimiter);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(operatorInjectionGuard);
app.use(cors({
   origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
   },
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
   credentials: true
}));

app.use(passport.initialize());

passport.use(new GoogleStrategy({
   clientID: process.env.GOOGLE_CLIENT_ID,
   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
   callbackURL: config.GOOGLE_CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
   proxy: process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1",
}, (accessToken, refreshToken, profile, done) => {
   return done(null, profile)
}))

app.get('/health', (req, res) => {
   res.status(200).json({ status: "ok" });
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api', requestRouter);
app.use('/api', departmentRouter);
app.use('/api', complaintRouter);
app.use('/api', complaintTimelineRouter);
app.use('/api', incidentRouter);
app.use('/api', aiRouter);
app.use('/api', chatRouter);

// Return JSON 404 for any unhandled /api route
app.use('/api', (req, res) => {
   res.status(404).json({ error: "API route not found" });
});

// Production Frontend Static File Serving & SPA Fallback
const frontendDist = process.env.FRONTEND_DIST || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../FRONTEND/dist');
const indexHtml = path.join(frontendDist, 'index.html');

if (process.env.NODE_ENV === 'production') {
   if (fs.existsSync(indexHtml)) {
      app.use(express.static(frontendDist));
      app.use((req, res, next) => {
         if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
         }
         if (
            req.path.startsWith('/api') ||
            req.path.startsWith('/socket.io') ||
            req.path === '/health'
         ) {
            return next();
         }
         res.sendFile(indexHtml);
      });
   } else {
      console.warn(`[SPA] Frontend production assets not found at ${frontendDist}. Run 'npm run build' in FRONTEND.`);
      app.get('/', (req, res) => {
         res.status(200).json({ message: "server is running (frontend dist not found)" });
      });
   }
} else {
   app.get('/', (req, res) => {
      res.status(200).json({ message: "server is running" });
   });
}

export default app;
