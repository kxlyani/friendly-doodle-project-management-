import { ActivityLog } from "../models/activitylog.models.js";
import { Project } from "../models/project.models.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import mongoose from "mongoose";

/**
 * GET /api/v1/projects/:projectId/activity
 *
 * Query params:
 *   page       - page number, default 1
 *   limit      - items per page, default 20, max 50
 *   action     - filter by a specific action (e.g. "task_created")
 *   entityType - filter by entity type (e.g. "task", "member")
 *   actorId    - filter by who performed the action
 */
const getActivityLog = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build filter — start with project, then layer optional query params
    const filter = {
        project: new mongoose.Types.ObjectId(projectId),
    };

    if (req.query.action) {
        filter.action = req.query.action;
    }
    if (req.query.entityType) {
        filter["entity.type"] = req.query.entityType;
    }
    if (req.query.actorId) {
        filter.actor = new mongoose.Types.ObjectId(req.query.actorId);
    }

    const [logs, total] = await Promise.all([
        ActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("actor", "username fullName avatar"),
        ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                logs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1,
                },
            },
            "Activity log fetched successfully",
        ),
    );
});

export { getActivityLog };