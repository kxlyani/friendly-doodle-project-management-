import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rate-limit.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use("/api", globalLimiter);

import healthCheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthCheckRouter);

import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth", authRouter);

import projectRoutes from "./routes/project.routes.js";
app.use("/api/v1/projects", projectRoutes);

import taskRoutes from "./routes/task.routes.js";
app.use("/api/v1/tasks", taskRoutes);

import noteRoutes from "./routes/note.routes.js";
app.use("/api/v1/notes", noteRoutes);

import notificationRoutes from "./routes/notification.routes.js";
app.use("/api/v1/notifications", notificationRoutes);

import adminRoutes from "./routes/admin.routes.js";
app.use("/api/v1/admin", adminRoutes);

import chatRoutes from "./routes/chat.routes.js";
app.use("/api/v1/chat", chatRoutes);

app.use(errorHandler);

export default app;