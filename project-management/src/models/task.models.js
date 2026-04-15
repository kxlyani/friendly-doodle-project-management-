import mongoose, { Schema } from "mongoose";
import {
    availableTaskStatuses,
    availableTaskPriorities,
    TaskStatusEnum,
    TaskPriorityEnum,
} from "../utils/constants.js";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: String,
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: availableTaskStatuses,
            default: TaskStatusEnum.TO_DO,
        },
        priority: {
            type: String,
            enum: availableTaskPriorities,
            default: TaskPriorityEnum.MEDIUM,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        tags: {
            type: [String],
            default: [],
            // Trim each tag and enforce a sensible max count
            validate: {
                validator: (tags) => tags.length <= 10,
                message: "A task cannot have more than 10 tags",
            },
        },
        attachments: {
            type: [
                {
                    url: String,
                    mimetype: String,
                    size: Number,
                },
            ],
            default: [],
        },
        completionRequestedAt: {
            type: Date,
            default: null,
        },
        completionRequestedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        completionReviewedAt: {
            type: Date,
            default: null,
        },
        completionReviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        completionReviewComment: {
            type: String,
            default: "",
            trim: true,
        },
        completionReviewOutcome: {
            type: String,
            enum: ["approved", "rejected", null],
            default: null,
        },
    },
    { timestamps: true },
);

// Index to efficiently query overdue tasks per project
taskSchema.index({ project: 1, dueDate: 1 });

// Index for filtering by priority within a project
taskSchema.index({ project: 1, priority: 1 });

export const Task = mongoose.model("Task", taskSchema);