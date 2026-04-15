import asyncHandler from "../utils/async-handler.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Project } from "../models/project.models.js";
import User from "../models/user.models.js";
import { Task } from "../models/task.models.js";
import mongoose from "mongoose";
import { availableProjectRoles, ProjectRolesEnum, ActivityActionEnum, TaskStatusEnum } from "../utils/constants.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import { logActivity } from "../utils/activity-logger.js";

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value)));

const attachProjectProgress = async (projects) => {
    if (!projects.length) return projects;

    const projectIds = projects
        .map((entry) => entry.project?._id || entry._id)
        .filter(Boolean)
        .map((id) => new mongoose.Types.ObjectId(id));

    const counts = await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
            $group: {
                _id: "$project",
                totalTasks: { $sum: 1 },
                doneTasks: {
                    $sum: {
                        $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0],
                    },
                },
            },
        },
    ]);

    const countMap = new Map(counts.map((entry) => [String(entry._id), entry]));

    return projects.map((entry) => {
        const target = entry.project || entry;
        const projectId = String(target._id);
        const record = countMap.get(projectId) || { totalTasks: 0, doneTasks: 0 };
        const autoProgress = record.totalTasks
            ? clampPercent((record.doneTasks / record.totalTasks) * 100)
            : 0;
        const progress = target.progressMode === "manual" && typeof target.manualProgressPercent === "number"
            ? clampPercent(target.manualProgressPercent)
            : autoProgress;

        const mergedProject = {
            ...target,
            progress,
            autoProgress,
            totalTasks: record.totalTasks,
            doneTasks: record.doneTasks,
        };

        return entry.project ? { ...entry, project: mergedProject } : mergedProject;
    });
};

const getProjects = asyncHandler(async (req, res) => {
    const projectsRaw = await ProjectMember.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "project",
                            as: "projectmembers",
                        },
                    },
                    { $addFields: { members: { $size: "$projectmembers" } } },
                ],
            },
        },
        { $unwind: "$project" },
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1,
                    progressMode: 1,
                    manualProgressPercent: 1,
                    requireTaskCompletionApproval: 1,
                },
                role: 1,
                _id: 0,
            },
        },
    ]);
    const projects = await attachProjectProgress(projectsRaw);

    return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const rawProject = await Project.findById(projectId).lean();
    const [project] = await attachProjectProgress(rawProject ? [rawProject] : []);
    if (!project) throw new ApiError(404, "Project not found");
    res.status(200).json(new ApiResponse(200, project, "Project returned successfully"));
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const existing = await Project.findOne({ name: name.trim(), createdBy: req.user._id });
    if (existing) throw new ApiError(409, "You already have a project with this name");

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: ProjectRolesEnum.PROJECT_OWNER,
    });

    logActivity({
        projectId: project._id,
        actorId: req.user._id,
        action: ActivityActionEnum.PROJECT_CREATED,
        entityType: "project",
        entityId: project._id,
        entityName: project.name,
    }).catch(() => {});

    return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { projectId } = req.params;

    if (name) {
        const existing = await Project.findOne({
            name: name.trim(),
            createdBy: req.user._id,
            _id: { $ne: new mongoose.Types.ObjectId(projectId) },
        });
        if (existing) throw new ApiError(409, "You already have a project with this name");
    }

    const project = await Project.findByIdAndUpdate(
        projectId,
        { name, description },
        { new: true },
    );
    if (!project) throw new ApiError(404, "Project not found");

    logActivity({
        projectId: project._id,
        actorId: req.user._id,
        action: ActivityActionEnum.PROJECT_UPDATED,
        entityType: "project",
        entityId: project._id,
        entityName: project.name,
        metadata: { updatedFields: Object.keys(req.body) },
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, project, "Project updated successfully"));
});

const updateProjectSettings = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { progressMode, manualProgressPercent, requireTaskCompletionApproval } = req.body;

    const updatePayload = {};
    if (progressMode !== undefined) updatePayload.progressMode = progressMode;
    if (manualProgressPercent !== undefined) {
        updatePayload.manualProgressPercent = manualProgressPercent === null ? null : Number(manualProgressPercent);
    }
    if (requireTaskCompletionApproval !== undefined) {
        updatePayload.requireTaskCompletionApproval = requireTaskCompletionApproval;
    }

    if (!Object.keys(updatePayload).length) {
        throw new ApiError(400, "No settings provided");
    }

    if (updatePayload.progressMode === "auto" && manualProgressPercent === undefined) {
        updatePayload.manualProgressPercent = null;
    }

    const project = await Project.findByIdAndUpdate(
        projectId,
        { $set: updatePayload },
        { new: true },
    ).lean();
    if (!project) throw new ApiError(404, "Project not found");

    logActivity({
        projectId,
        actorId: req.user._id,
        action: ActivityActionEnum.PROJECT_UPDATED,
        entityType: "project",
        entityId: projectId,
        entityName: project.name,
        metadata: { updatedFields: Object.keys(updatePayload) },
    }).catch(() => {});

    const [withProgress] = await attachProjectProgress([project]);
    return res.status(200).json(new ApiResponse(200, withProgress, "Project settings updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    await ProjectMember.deleteMany({ project: project._id });

    logActivity({
        projectId: project._id,
        actorId: req.user._id,
        action: ActivityActionEnum.PROJECT_DELETED,
        entityType: "project",
        entityId: project._id,
        entityName: project.name,
    }).catch(() => {});

    res.status(200).json(new ApiResponse(200, project, "Project deleted successfully"));
});

const addMembersToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { projectId } = req.params;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    await ProjectMember.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(user._id), project: new mongoose.Types.ObjectId(projectId) },
        { user: new mongoose.Types.ObjectId(user._id), project: new mongoose.Types.ObjectId(projectId), role },
        { upsert: true, new: true },
    );

    logActivity({
        projectId,
        actorId: req.user._id,
        action: ActivityActionEnum.MEMBER_ADDED,
        entityType: "member",
        entityId: user._id,
        entityName: user.username,
        metadata: { role },
    }).catch(() => {});

    return res.status(201).json(new ApiResponse(201, {}, "Project member added successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const projectMembers = await ProjectMember.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId) } },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }],
            },
        },
        { $addFields: { user: { $arrayElemAt: ["$user", 0] } } },
        { $project: { project: 1, user: 1, role: 1, createdAt: 1, updatedAt: 1, _id: 0 } },
    ]);

    return res.status(200).json(new ApiResponse(200, projectMembers, "Project members fetched"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const { projectId, userId } = req.params;

    if (!availableProjectRoles.includes(role)) throw new ApiError(400, "Invalid role");

    const projectMember = await ProjectMember.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId), project: new mongoose.Types.ObjectId(projectId) },
        { role },
        { new: true },
    );
    if (!projectMember) throw new ApiError(404, "Project member not found");

    const user = await User.findById(userId).select("username");

    logActivity({
        projectId,
        actorId: req.user._id,
        action: ActivityActionEnum.MEMBER_ROLE_UPDATED,
        entityType: "member",
        entityId: userId,
        entityName: user?.username ?? userId,
        metadata: { newRole: role },
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, projectMember, "Role updated successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    const projectMember = await ProjectMember.findOneAndDelete({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId),
    });
    if (!projectMember) throw new ApiError(404, "Project member not found");

    const user = await User.findById(userId).select("username");

    logActivity({
        projectId,
        actorId: req.user._id,
        action: ActivityActionEnum.MEMBER_REMOVED,
        entityType: "member",
        entityId: userId,
        entityName: user?.username ?? userId,
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, projectMember, "Member deleted successfully"));
});

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMembersToProject,
    updateProjectSettings,
    getProjectMembers,
    updateMemberRole,
    deleteMember,
};