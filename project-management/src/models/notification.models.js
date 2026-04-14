import mongoose, { Schema } from "mongoose";
import { availableNotificationTypes } from "../utils/constants.js";

const notificationSchema = new Schema(
    {
        // Who receives this notification
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Who triggered it (null for system-generated)
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        type: {
            type: String,
            enum: availableNotificationTypes,
            required: true,
        },
        // Human-readable message shown in the UI
        message: {
            type: String,
            required: true,
        },
        // Deep-link data so the frontend can navigate to the right place
        link: {
            // e.g. "task" | "note" | "project"
            entityType: { type: String },
            entityId: { type: Schema.Types.ObjectId },
            projectId: { type: Schema.Types.ObjectId },
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

// Most common query: all unread for a user, newest first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);