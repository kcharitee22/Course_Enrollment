import "dotenv/config.js";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import authRouter from "./router/auth.route.js";
import courseRouter from "./router/course.route.js";
import lessonRouter from "./router/lesson.route.js";
import moduleRouter from "./router/module.route.js";
import enrollmentRouter from "./router/enrollment.route.js";
import progressRouter from "./router/progress.route.js"
const app = express();

// Allow requests from our React frontend
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  }),
);

// Read JSON data sent by the frontend
app.use(express.json());

// Configure session management
app.use(
  session({
    name: "classEnroll.sid", // Name of the cookie (the wristband's label)
    secret: process.env.SESSION_SECRET, // Secret key used to sign the cookie so it can't be faked
    resave: false, // Don't re-save the session if nothing changed
    saveUninitialized: false, // Don't create a session for visitors who haven't logged in

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI1, // Which MongoDB database to use
      collectionName: "sessions", // The folder (collection) where sessions are saved
      ttl: 14 * 24 * 60 * 60,  // Session expires after 14 days (in SECONDS)
    }),

    cookie: {
      httpOnly: true, // JavaScript in the browser can't read this cookie
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS when live
      sameSite: "lax", // Limits sending the cookie from other websites
      maxAge: 14 * 24 * 60 * 60 * 1000,  // Cookie lives 14 days (in MILLISECONDS)
    },
  }),
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/courses",courseRouter);
app.use("/api/modules",moduleRouter);
app.use("/api/lessons",lessonRouter);
app.use("/api/enrollments",enrollmentRouter);
app.use("/api/progress", progressRouter);

export default app;
