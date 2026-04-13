import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import mongoose from "mongoose";
import { ActivityActionEnum } from "../utils/constants.js";
import { logActivity } from "../utils/activity-logger.js";

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const tasks = await Task.find({
        project: new mongoose.Types.ObjectId(projectId),
    }).populate("assignedTo", "avatar username fullName");

    return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const files = req.files || [];
    const attachments = files.map((file) => ({
        url: `${process.env.SERVER_URL}/images/${file.originalname}`,
        mimetype: file.mimetype,
        size: file.size,
    }));

    const normalisedTags = tags
        ? [...new Set(tags.map((t) => t.toLowerCase().trim()))]
        : [];

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
        status,
        priority,
        dueDate: dueDate || null,
        tags: normalisedTags,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments,
    });

    logActivity({
        projectId,
        actorId: req.user._id,
        action: ActivityActionEnum.TASK_CREATED,
        entityType: "task",
        entityId: task._id,
        entityName: task.title,
        metadata: { status: task.status, priority: task.priority },
    }).catch(() => {});

    if (assignedTo) {
        logActivity({
            projectId,
            actorId: req.user._id,
            action: ActivityActionEnum.TASK_ASSIGNED,
            entityType: "task",
            entityId: task._id,
            entityName: task.title,
            metadata: { assignedTo },
        }).catch(() => {});
    }

    return res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(taskId) } },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedBy",
                foreignField: "_id",
                as: "assignedBy",
                pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }],
            },
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }],
                        },
                    },
                    { $addFields: { createdBy: { $arrayElemAt: ["$createdBy", 0] } } },
                ],
            },
        },
        {
            $addFields: {
                assignedTo: { $arrayElemAt: ["$assignedTo", 0] },
                assignedBy: { $arrayElemAt: ["$assignedBy", 0] },
                isOverdue: {
                    $and: [
                        { $ne: ["$dueDate", null] },
                        { $lt: ["$dueDate", new Date()] },
                        { $ne: ["$status", "done"] },
                    ],
                },
            },
        },
    ]);

    if (!task || task.length === 0) throw new ApiError(404, "Task not found");

    return res.status(200).json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    const before = await Task.findById(taskId);
    if (!before) throw new ApiError(404, "Task not found");

    const normalisedTags = tags
        ? [...new Set(tags.map((t) => t.toLowerCase().trim()))]
        : undefined;

    const updatePayload = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(assignedTo !== undefined && {
            assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null,
        }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate || null }),
        ...(normalisedTags !== undefined && { tags: normalisedTags }),
    };

    const task = await Task.findByIdAndUpdate(taskId, { $set: updatePayload }, { new: true });

    logActivity({
        projectId: task.project,
        actorId: req.user._id,
        action: ActivityActionEnum.TASK_UPDATED,
        entityType: "task",
        entityId: task._id,
        entityName: task.title,
        metadata: { updatedFields: Object.keys(updatePayload) },
    }).catch(() => {});

    if (status && status !== before.status) {
        logActivity({
            projectId: task.project,
            actorId: req.user._id,
            action: ActivityActionEnum.TASK_STATUS_CHANGED,
            entityType: "task",
            entityId: task._id,
            entityName: task.title,
            metadata: { from: before.status, to: status },
        }).catch(() => {});
    }

    if (assignedTo && String(before.assignedTo) !== String(assignedTo)) {
        logActivity({
            projectId: task.project,
            actorId: req.user._id,
            action: ActivityActionEnum.TASK_ASSIGNED,
            entityType: "task",
            entityId: task._id,
            entityName: task.title,
            metadata: { assignedTo },
        }).catch(() => {});
    }

    return res.status(200).json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);
    if (!task) throw new ApiError(404, "Task not found");

    await Subtask.deleteMany({ task: task._id });

    logActivity({
        projectId: task.project,
        actorId: req.user._id,
        action: ActivityActionEnum.TASK_DELETED,
        entityType: "task",
        entityId: task._id,
        entityName: task.title,
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, task, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found");

    const subtask = await Subtask.create({
        title,
        task: new mongoose.Types.ObjectId(taskId),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    logActivity({
        projectId: task.project,
        actorId: req.user._id,
        action: ActivityActionEnum.SUBTASK_CREATED,
        entityType: "subtask",
        entityId: subtask._id,
        entityName: subtask.title,
        metadata: { parentTaskId: taskId, parentTaskTitle: task.title },
    }).catch(() => {});

    return res.status(201).json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;
    const { title, isCompleted } = req.body;

    const subtask = await Subtask.findByIdAndUpdate(
        subTaskId,
        { $set: { title, isCompleted } },
        { new: true },
    );
    if (!subtask) throw new ApiError(404, "Subtask not found");

    const task = await Task.findById(subtask.task).select("project title");

    logActivity({
        projectId: task?.project,
        actorId: req.user._id,
        action: ActivityActionEnum.SUBTASK_UPDATED,
        entityType: "subtask",
        entityId: subtask._id,
        entityName: subtask.title,
        metadata: {
            parentTaskTitle: task?.title,
            ...(isCompleted !== undefined && { isCompleted }),
        },
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;

    const subtask = await Subtask.findByIdAndDelete(subTaskId);
    if (!subtask) throw new ApiError(404, "Subtask not found");

    const task = await Task.findById(subtask.task).select("project title");

    logActivity({
        projectId: task?.project,
        actorId: req.user._id,
        action: ActivityActionEnum.SUBTASK_DELETED,
        entityType: "subtask",
        entityId: subtask._id,
        entityName: subtask.title,
        metadata: { parentTaskTitle: task?.title },
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, subtask, "Subtask deleted successfully"));
});

export {
    createSubTask,
    createTask,
    deleteTask,
    deleteSubTask,
    getTaskById,
    getTasks,
    updateSubTask,
    updateTask,
};