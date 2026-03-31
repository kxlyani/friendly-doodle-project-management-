import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rate-limit.middleware.js";

const app = express();

// basic configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Apply global rate limiter to all API routes
app.use("/api/", globalLimiter);

// import routes
import healthCheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck/", healthCheckRouter);

import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth/", authRouter);

import projectRoutes from "./routes/project.routes.js";
app.use("/api/v1/projects/", projectRoutes);

import taskRoutes from "./routes/task.routes.js";
app.use("/api/v1/tasks/", taskRoutes);

import noteRoutes from "./routes/note.routes.js";
app.use("/api/v1/notes/", noteRoutes);

// error handler
app.use(errorHandler);

export default app;