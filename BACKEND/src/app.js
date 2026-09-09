import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";


import { config } from './config/config.js';
import authRouter from './routes/auth.routes.js';
import requestRouter from './routes/request.routes.js';
import departmentRouter from "./routes/department.routes.js"



const app = express();


app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
   origin: 'http://localhost:5173',
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
   credentials: true
}))

app.use(passport.initialize());

passport.use(new GoogleStrategy({
   clientID: process.env.GOOGLE_CLIENT_ID,
   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
   callbackURL: "/api/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
   return done(null, profile)
}))


app.get('/', (req, res) => {
   res.status(200).json({ message: "server is running" })
})

app.use('/api/auth', authRouter);
app.use('/api', requestRouter);
app.use('/api', departmentRouter);

export default app;

