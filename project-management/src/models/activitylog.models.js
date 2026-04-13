import mongoose, { Schema } from "mongoose";
import { availableActivityActions } from "../utils/constants.js";

const activityLogSchema = new Schema(
    {
        // Which project this activity belongs to
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        // Who performed the action
        actor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // What happened
        action: {
            type: String,
            enum: availableActivityActions,
            required: true,
        },
        // What entity was affected — flexible enough for tasks, members, notes, etc.
        entity: {
            type: {
                type: String, // "task" | "project" | "member" | "note" | "subtask"
                required: true,
            },
            id: {
                type: Schema.Types.ObjectId,
                required: true,
            },
            // Human-readable name snapshotted at log time so it survives deletion
            name: {
                type: String,
                required: true,
            },
        },
        // Optional structured diff — what specifically changed
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    },
);

// Compound index: most common query is "all logs for project, newest first"
activityLogSchema.index({ project: 1, createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);