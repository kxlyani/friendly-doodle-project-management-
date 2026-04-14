import asyncHandler from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import User from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { availableSystemRoles, SystemRolesEnum } from "../utils/constants.js";
import {
    AdminAuditActionEnum,
    AdminAuditLog,
} from "../models/adminauditlog.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { TaskPriorityEnum, TaskStatusEnum } from "../utils/constants.js";

const logAdminAction = async ({ actorId, action, target, metadata = {} }) => {
    try {
        await AdminAuditLog.create({
            actor: actorId,
            action,
            target,
            metadata,
        });
    } catch {
        // Never block the main action if audit logging fails
    }
};

const getAdminActorId = (req) => req.adminUser?._id ?? req.user?._id;

export const getAdminStats = asyncHandler(async (req, res) => {
    const [users, projects, tasks] = await Promise.all([
        User.countDocuments({}),
        Project.countDocuments({}),
        Task.countDocuments({}),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { users, projects, tasks },
            "Admin stats fetched successfully",
        ),
    );
});

export const getAllProjectsAdmin = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const search = typeof q === "string" && q.trim().length ? q.trim() : null;

    const filter = search
        ? {
              $or: [
                  { name: { $regex: search, $options: "i" } },
                  { description: { $regex: search, $options: "i" } },
              ],
          }
        : {};

    const projects = await Project.find(filter)
        .sort({ createdAt: -1 })
        .limit(200);

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

export const archiveProjectAdmin = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select("_id name archivedAt");
    if (!project) throw new ApiError(404, "Project not found");

    if (project.archivedAt) {
        return res
            .status(200)
            .json(new ApiResponse(200, project, "Project already archived"));
    }

    project.archivedAt = new Date();
    project.archivedBy = new mongoose.Types.ObjectId(req.user._id);
    await project.save();

    await logAdminAction({
        actorId: getAdminActorId(req),
        action: AdminAuditActionEnum.PROJECT_ARCHIVED,
        target: { type: "project", id: project._id, label: project.name },
        metadata: { archivedAt: project.archivedAt },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project archived"));
});

export const restoreProjectAdmin = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select("_id name archivedAt");
    if (!project) throw new ApiError(404, "Project not found");

    if (!project.archivedAt) {
        return res
            .status(200)
            .json(new ApiResponse(200, project, "Project is not archived"));
    }

    project.archivedAt = null;
    project.archivedBy = null;
    await project.save();

    await logAdminAction({
        actorId: getAdminActorId(req),
        action: AdminAuditActionEnum.PROJECT_RESTORED,
        target: { type: "project", id: project._id, label: project.name },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project restored"));
});

export const transferProjectOwnershipAdmin = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { newOwnerUserId } = req.body;

    if (!newOwnerUserId) {
        throw new ApiError(400, "newOwnerUserId is required");
    }

    const [project, newOwner] = await Promise.all([
        Project.findById(projectId).select("_id name createdBy"),
        User.findById(newOwnerUserId).select("_id username email"),
    ]);

    if (!project) throw new ApiError(404, "Project not found");
    if (!newOwner) throw new ApiError(404, "New owner user not found");

    const prevOwnerId = project.createdBy;
    project.createdBy = new mongoose.Types.ObjectId(newOwner._id);
    await project.save();

    // Ensure new owner is a member (upsert) — keep existing role if present
    await ProjectMember.findOneAndUpdate(
        {
            user: new mongoose.Types.ObjectId(newOwner._id),
            project: new mongoose.Types.ObjectId(project._id),
        },
        {
            user: new mongoose.Types.ObjectId(newOwner._id),
            project: new mongoose.Types.ObjectId(project._id),
        },
        { upsert: true, new: true },
    );

    await logAdminAction({
        actorId: getAdminActorId(req),
        action: AdminAuditActionEnum.PROJECT_OWNERSHIP_TRANSFERRED,
        target: { type: "project", id: project._id, label: project.name },
        metadata: {
            fromOwnerId: String(prevOwnerId),
            toOwnerId: String(newOwner._id),
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { projectId: project._id, previousOwnerId: prevOwnerId, newOwnerId: newOwner._id },
            "Project ownership transferred",
        ),
    );
});

export const getAllUsersAdmin = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const search = typeof q === "string" && q.trim().length ? q.trim() : null;

    const filter = search
        ? {
              $or: [
                  { username: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                  { fullName: { $regex: search, $options: "i" } },
              ],
          }
        : {};

    const users = await User.find(filter)
        .select("_id username email fullName avatar systemRole createdAt")
        .sort({ createdAt: -1 })
        .limit(200);

    return res
        .status(200)
        .json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const updateUserSystemRoleAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { systemRole } = req.body;

    if (!availableSystemRoles.includes(systemRole)) {
        throw new ApiError(400, "Invalid systemRole");
    }

    const existing = await User.findById(userId).select(
        "_id username email systemRole",
    );
    if (!existing) throw new ApiError(404, "User not found");

    // Prevent locking yourself out accidentally
    if (
        String(req.user._id) === String(userId) &&
        req.user.systemRole === SystemRolesEnum.SYSTEM_ADMIN &&
        systemRole !== SystemRolesEnum.SYSTEM_ADMIN
    ) {
        throw new ApiError(400, "You cannot remove your own system admin role");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { systemRole } },
        { new: true },
    ).select("_id username email fullName avatar systemRole createdAt");

    await logAdminAction({
        actorId: getAdminActorId(req),
        action: AdminAuditActionEnum.USER_SYSTEM_ROLE_CHANGED,
        target: {
            type: "user",
            id: existing._id,
            label: existing.email || existing.username,
        },
        metadata: {
            fromRole: existing.systemRole,
            toRole: systemRole,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User role updated successfully"));
});

export const getAdminAudit = asyncHandler(async (req, res) => {
    const { action, actorId, targetType, targetId, from, to } = req.query;

    const filter = {};

    if (action) filter.action = action;
    if (actorId) filter.actor = actorId;
    if (targetType) filter["target.type"] = targetType;
    if (targetId) filter["target.id"] = targetId;

    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
    }

    const logs = await AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("actor", "_id username email fullName avatar systemRole");

    return res
        .status(200)
        .json(new ApiResponse(200, logs, "Admin audit logs fetched"));
});

export const startImpersonationAdmin = asyncHandler(async (req, res) => {
    const actorId = getAdminActorId(req);
    const { userId, reason = "", ttlMinutes = 30 } = req.body;

    if (!userId) throw new ApiError(400, "userId is required");

    const ttl = Math.max(5, Math.min(Number(ttlMinutes) || 30, 240));

    const impersonated = await User.findById(userId).select(
        "_id username email fullName avatar systemRole",
    );
    if (!impersonated) throw new ApiError(404, "User not found");

    const token = jwt.sign(
        {
            adminId: String(actorId),
            impersonatedUserId: String(impersonated._id),
            reason,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: `${ttl}m` },
    );

    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    await logAdminAction({
        actorId,
        action: AdminAuditActionEnum.IMPERSONATION_STARTED,
        target: {
            type: "impersonation",
            id: impersonated._id,
            label: impersonated.email || impersonated.username,
        },
        metadata: { reason, ttlMinutes: ttl, expiresAt },
    });

    return res
        .status(200)
        .cookie("impersonationToken", token, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    active: true,
                    impersonatedUser: impersonated,
                    expiresAt,
                },
                "Impersonation started",
            ),
        );
});

export const stopImpersonationAdmin = asyncHandler(async (req, res) => {
    const actorId = getAdminActorId(req);

    // Log best-effort: if we know who was impersonated, include it
    const targetLabel =
        req.adminContext?.impersonatedUserId || req.user?._id || "unknown";

    await logAdminAction({
        actorId,
        action: AdminAuditActionEnum.IMPERSONATION_STOPPED,
        target: {
            type: "impersonation",
            id: req.adminContext?.impersonatedUserId || targetLabel,
            label: String(targetLabel),
        },
    });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .clearCookie("impersonationToken", cookieOptions)
        .json(new ApiResponse(200, { active: false }, "Impersonation stopped"));
});

export const getImpersonationStatusAdmin = asyncHandler(async (req, res) => {
    if (!req.adminContext) {
        return res
            .status(200)
            .json(new ApiResponse(200, { active: false }, "No impersonation"));
    }

    const impersonatedUser = await User.findById(
        req.adminContext.impersonatedUserId,
    ).select("_id username email fullName avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                active: true,
                impersonatedUser,
                expiresAt: req.adminContext.expiresAt,
                reason: req.adminContext.reason,
            },
            "Impersonation active",
        ),
    );
});

export const getAdminAnalyticsOverview = asyncHandler(async (req, res) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [tasksByStatusAgg, tasksByPriorityAgg, overdueTasks, projects7d, projects30d] =
        await Promise.all([
            Task.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { _id: 0, status: "$_id", count: 1 } },
            ]),
            Task.aggregate([
                { $group: { _id: "$priority", count: { $sum: 1 } } },
                { $project: { _id: 0, priority: "$_id", count: 1 } },
            ]),
            Task.countDocuments({
                dueDate: { $ne: null, $lt: now },
                status: { $ne: TaskStatusEnum.DONE },
            }),
            Project.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            Project.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        ]);

    const tasksByStatus = Object.fromEntries(
        Object.values(TaskStatusEnum).map((s) => [s, 0]),
    );
    for (const row of tasksByStatusAgg) tasksByStatus[row.status] = row.count;

    const tasksByPriority = Object.fromEntries(
        Object.values(TaskPriorityEnum).map((p) => [p, 0]),
    );
    for (const row of tasksByPriorityAgg) tasksByPriority[row.priority] = row.count;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                tasksByStatus,
                tasksByPriority,
                overdueTasks,
                projectsCreated: {
                    last7d: projects7d,
                    last30d: projects30d,
                },
            },
            "Admin analytics overview fetched",
        ),
    );
});
