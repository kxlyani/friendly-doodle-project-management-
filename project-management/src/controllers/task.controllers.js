import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import mongoose from "mongoose";
import { ActivityActionEnum, NotificationTypeEnum, ProjectRolesEnum, TaskStatusEnum } from "../utils/constants.js";
import { logActivity } from "../utils/activity-logger.js";
import { notifyUsers } from "../utils/notification-helper.js";

const parseCsvParam = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
};

const parseBoolean = (value) => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
};

const parseDate = (value, fallback) => {
    if (!value) return fallback;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const getAccessibleProjectIds = async (userId) => {
    const [ownedProjects, membershipProjects] = await Promise.all([
        Project.find({ createdBy: userId }).select("_id").lean(),
        ProjectMember.find({ user: userId }).select("project").lean(),
    ]);

    const allIds = new Set([
        ...ownedProjects.map((p) => String(p._id)),
        ...membershipProjects.map((m) => String(m.project)),
    ]);

    return [...allIds].map((id) => new mongoose.Types.ObjectId(id));
};

const buildTaskFilter = (query, extra = {}) => {
    const {
        status,
        priority,
        assignedTo,
        from,
        to,
        overdue,
        search,
        tags,
    } = query;

    const filter = { ...extra };
    const statusList = parseCsvParam(status);
    const priorityList = parseCsvParam(priority);
    const assigneeList = parseCsvParam(assignedTo);
    const tagList = parseCsvParam(tags).map((tag) => tag.toLowerCase());

    if (statusList.length) filter.status = { $in: statusList };
    if (priorityList.length) filter.priority = { $in: priorityList };
    if (assigneeList.length) {
        const assigneeIds = assigneeList
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
        if (assigneeIds.length) filter.assignedTo = { $in: assigneeIds };
    }
    if (tagList.length) filter.tags = { $in: tagList };
    if (search) filter.title = { $regex: search.trim(), $options: "i" };

    const dateFrom = parseDate(from, null);
    const dateTo = parseDate(to, null);
    if (dateFrom || dateTo) {
        filter.dueDate = {};
        if (dateFrom) filter.dueDate.$gte = dateFrom;
        if (dateTo) filter.dueDate.$lte = dateTo;
    }

    if (parseBoolean(overdue) === true) {
        filter.dueDate = { ...(filter.dueDate || {}), $lt: new Date() };
        filter.status = {
            ...(filter.status || {}),
            ...(filter.status?.$in
                ? { $in: filter.status.$in.filter((item) => item !== "done") }
                : { $ne: "done" }),
        };
    }

    return filter;
};

const buildSort = (query) => {
    const allowedSortBy = new Set(["createdAt", "updatedAt", "dueDate", "priority", "status", "title"]);
    const sortBy = allowedSortBy.has(query.sortBy) ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    return { [sortBy]: sortOrder };
};

const managerRoles = [ProjectRolesEnum.PROJECT_OWNER, ProjectRolesEnum.PROJECT_MANAGER];

const getProjectManagers = async (projectId) => {
    const members = await ProjectMember.find({
        project: projectId,
        role: { $in: managerRoles },
    }).select("user role").lean();
    return members.map((entry) => entry.user).filter(Boolean);
};

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { page, limit } = req.query;
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");
    const filter = buildTaskFilter(req.query, { project: new mongoose.Types.ObjectId(projectId) });
    const sort = buildSort(req.query);

    const tasksQuery = Task.find(filter)
        .populate("assignedTo", "avatar username fullName");

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const usePagination = Number.isInteger(parsedPage) && Number.isInteger(parsedLimit) && parsedPage > 0 && parsedLimit > 0;

    if (!usePagination) {
        const tasks = await tasksQuery.sort(sort);
        return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
    }

    const safeLimit = Math.min(parsedLimit, 100);
    const skip = (parsedPage - 1) * safeLimit;
    const [tasks, total] = await Promise.all([
        tasksQuery.sort(sort).skip(skip).limit(safeLimit),
        Task.countDocuments(filter),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        tasks,
        pagination: {
            page: parsedPage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit) || 1,
        },
    }, "Tasks fetched successfully"));
});

const getMyDashboard = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const accessibleProjectIds = await getAccessibleProjectIds(userId);
    if (!accessibleProjectIds.length) {
        return res.status(200).json(new ApiResponse(200, {
            tasks: [],
            stats: {
                total: 0,
                to_do: 0,
                in_progress: 0,
                done: 0,
                overdueCount: 0,
                dueTodayCount: 0,
                byPriority: {},
            },
        }, "Dashboard fetched successfully"));
    }

    const projectFilter = parseCsvParam(req.query.projectIds)
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    const selectedProjects = projectFilter.length ? projectFilter : accessibleProjectIds;

    const rawFilter = buildTaskFilter(req.query, { project: { $in: selectedProjects } });
    if (parseBoolean(req.query.onlyMine) === true) rawFilter.assignedTo = userId;

    const sort = buildSort(req.query);
    const tasks = await Task.find(rawFilter)
        .populate("assignedTo", "avatar username fullName")
        .populate("project", "name")
        .sort(sort)
        .lean();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const stats = {
        total: tasks.length,
        to_do: tasks.filter((task) => task.status === "to_do").length,
        in_progress: tasks.filter((task) => task.status === "in_progress").length,
        done: tasks.filter((task) => task.status === "done").length,
        overdueCount: tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done").length,
        dueTodayCount: tasks.filter((task) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= todayStart && dueDate < todayEnd;
        }).length,
        byPriority: tasks.reduce((acc, task) => {
            if (!task.priority) return acc;
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {}),
    };

    const transformed = tasks.map((task) => ({
        ...task,
        projectId: task.project?._id || task.project,
        projectName: task.project?.name,
    }));

    return res.status(200).json(new ApiResponse(200, {
        tasks: transformed,
        stats,
    }, "Dashboard fetched successfully"));
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

    const normalisedTags = tags ? [...new Set(tags.map((t) => t.toLowerCase().trim()))] : [];

    const task = await Task.create({
        title, description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
        status, priority,
        dueDate: dueDate || null,
        tags: normalisedTags,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments,
    });

    logActivity({ projectId, actorId: req.user._id, action: ActivityActionEnum.TASK_CREATED,
        entityType: "task", entityId: task._id, entityName: task.title,
        metadata: { status: task.status, priority: task.priority },
    }).catch(() => {});

    // Notify assignee — skip if assigning to yourself
    if (assignedTo && String(assignedTo) !== String(req.user._id)) {
        logActivity({ projectId, actorId: req.user._id, action: ActivityActionEnum.TASK_ASSIGNED,
            entityType: "task", entityId: task._id, entityName: task.title,
            metadata: { assignedTo },
        }).catch(() => {});

        notifyUsers([{
            recipientId: assignedTo,
            senderId: req.user._id,
            type: NotificationTypeEnum.TASK_ASSIGNED,
            message: `${req.user.fullName || req.user.username} assigned you "${task.title}"`,
            link: { entityType: "task", entityId: task._id, projectId },
        }]).catch(() => {});
    }

    return res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId, projectId } = req.params;
    const task = await Task.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(taskId), project: new mongoose.Types.ObjectId(projectId) } },
        { $lookup: { from: "users", localField: "assignedTo", foreignField: "_id", as: "assignedTo",
            pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }] } },
        { $lookup: { from: "users", localField: "assignedBy", foreignField: "_id", as: "assignedBy",
            pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }] } },
        { $lookup: { from: "subtasks", localField: "_id", foreignField: "task", as: "subtasks",
            pipeline: [
                { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "createdBy",
                    pipeline: [{ $project: { _id: 1, username: 1, fullName: 1, avatar: 1 } }] } },
                { $addFields: { createdBy: { $arrayElemAt: ["$createdBy", 0] } } },
            ] } },
        { $addFields: {
            assignedTo: { $arrayElemAt: ["$assignedTo", 0] },
            assignedBy: { $arrayElemAt: ["$assignedBy", 0] },
            isOverdue: { $and: [
                { $ne: ["$dueDate", null] },
                { $lt: ["$dueDate", new Date()] },
                { $ne: ["$status", "done"] },
            ]},
        }},
    ]);
    if (!task || task.length === 0) throw new ApiError(404, "Task not found");
    return res.status(200).json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId, projectId } = req.params;
    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    const before = await Task.findOne({ _id: taskId, project: projectId });
    if (!before) throw new ApiError(404, "Task not found");

    const normalisedTags = tags ? [...new Set(tags.map((t) => t.toLowerCase().trim()))] : undefined;

    const updatePayload = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate || null }),
        ...(normalisedTags !== undefined && { tags: normalisedTags }),
    };

    const task = await Task.findOneAndUpdate({ _id: taskId, project: projectId }, { $set: updatePayload }, { new: true });

    logActivity({ projectId: task.project, actorId: req.user._id, action: ActivityActionEnum.TASK_UPDATED,
        entityType: "task", entityId: task._id, entityName: task.title,
        metadata: { updatedFields: Object.keys(updatePayload) },
    }).catch(() => {});

    const prevAssignee = before.assignedTo ? String(before.assignedTo) : null;
    const nextAssignee = assignedTo ? String(assignedTo) : null;
    const actorId = String(req.user._id);

    // Status change notification → current assignee
    if (status && status !== before.status) {
        logActivity({ projectId: task.project, actorId: req.user._id, action: ActivityActionEnum.TASK_STATUS_CHANGED,
            entityType: "task", entityId: task._id, entityName: task.title,
            metadata: { from: before.status, to: status },
        }).catch(() => {});

        if (task.assignedTo && String(task.assignedTo) !== actorId) {
            notifyUsers([{
                recipientId: task.assignedTo,
                senderId: req.user._id,
                type: NotificationTypeEnum.TASK_STATUS_CHANGED,
                message: `"${task.title}" was moved to ${status.replace(/_/g, " ")} by ${req.user.fullName || req.user.username}`,
                link: { entityType: "task", entityId: task._id, projectId: task.project },
            }]).catch(() => {});
        }
    }

    // Reassignment notifications
    if (assignedTo !== undefined && nextAssignee !== prevAssignee) {
        logActivity({ projectId: task.project, actorId: req.user._id, action: ActivityActionEnum.TASK_ASSIGNED,
            entityType: "task", entityId: task._id, entityName: task.title,
            metadata: { from: prevAssignee, to: nextAssignee },
        }).catch(() => {});

        const toSend = [];

        if (nextAssignee && nextAssignee !== actorId) {
            toSend.push({
                recipientId: nextAssignee, senderId: req.user._id,
                type: NotificationTypeEnum.TASK_ASSIGNED,
                message: `${req.user.fullName || req.user.username} assigned you "${task.title}"`,
                link: { entityType: "task", entityId: task._id, projectId: task.project },
            });
        }

        if (prevAssignee && prevAssignee !== actorId && prevAssignee !== nextAssignee) {
            toSend.push({
                recipientId: prevAssignee, senderId: req.user._id,
                type: NotificationTypeEnum.TASK_UNASSIGNED,
                message: `You were unassigned from "${task.title}" by ${req.user.fullName || req.user.username}`,
                link: { entityType: "task", entityId: task._id, projectId: task.project },
            });
        }

        if (toSend.length) notifyUsers(toSend).catch(() => {});
    }

    return res.status(200).json(new ApiResponse(200, task, "Task updated successfully"));
});

const requestTaskCompletion = asyncHandler(async (req, res) => {
    const { taskId, projectId } = req.params;
    const actorId = String(req.user._id);

    const [task, project] = await Promise.all([
        Task.findOne({ _id: taskId, project: projectId }),
        Project.findById(projectId).select("requireTaskCompletionApproval"),
    ]);
    if (!task) throw new ApiError(404, "Task not found");
    if (!project) throw new ApiError(404, "Project not found");

    const assignedToId = task.assignedTo ? String(task.assignedTo) : null;
    const isManager = managerRoles.includes(req.user.projectRole);
    if (!isManager && assignedToId && assignedToId !== actorId) {
        throw new ApiError(403, "Only the assignee can request completion");
    }

    if (task.status === TaskStatusEnum.DONE) {
        return res.status(200).json(new ApiResponse(200, task, "Task is already done"));
    }

    const requiresReview = Boolean(project.requireTaskCompletionApproval);
    const previousStatus = task.status;
    const nextStatus = requiresReview ? TaskStatusEnum.COMPLETION_REQUESTED : TaskStatusEnum.DONE;
    task.status = nextStatus;
    task.completionRequestedAt = new Date();
    task.completionRequestedBy = new mongoose.Types.ObjectId(req.user._id);
    task.completionReviewedAt = null;
    task.completionReviewedBy = null;
    task.completionReviewComment = "";
    task.completionReviewOutcome = null;
    await task.save();

    const statusAction = requiresReview
        ? ActivityActionEnum.TASK_COMPLETION_REQUESTED
        : ActivityActionEnum.TASK_STATUS_CHANGED;
    logActivity({
        projectId,
        actorId: req.user._id,
        action: statusAction,
        entityType: "task",
        entityId: task._id,
        entityName: task.title,
        metadata: requiresReview
            ? { requestedBy: req.user._id }
            : { from: previousStatus, to: TaskStatusEnum.DONE },
    }).catch(() => {});

    if (requiresReview) {
        const managerIds = await getProjectManagers(new mongoose.Types.ObjectId(projectId));
        const recipientIds = [...new Set(managerIds.map((id) => String(id)).filter((id) => id !== actorId))];

        if (recipientIds.length) {
            notifyUsers(
                recipientIds.map((recipientId) => ({
                    recipientId,
                    senderId: req.user._id,
                    type: NotificationTypeEnum.TASK_COMPLETION_REQUESTED,
                    message: `${req.user.fullName || req.user.username} requested completion review for "${task.title}"`,
                    link: { entityType: "task", entityId: task._id, projectId },
                })),
            ).catch(() => {});
        }
    } else if (task.assignedTo && String(task.assignedTo) !== actorId) {
        notifyUsers([{
            recipientId: task.assignedTo,
            senderId: req.user._id,
            type: NotificationTypeEnum.TASK_STATUS_CHANGED,
            message: `"${task.title}" was moved to done by ${req.user.fullName || req.user.username}`,
            link: { entityType: "task", entityId: task._id, projectId },
        }]).catch(() => {});
    }

    return res.status(200).json(new ApiResponse(200, task, requiresReview ? "Completion request sent" : "Task marked as done"));
});

const reviewTaskCompletion = asyncHandler(async (req, res) => {
    const { taskId, projectId } = req.params;
    const { decision, comment } = req.body;
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) throw new ApiError(404, "Task not found");

    if (task.status !== TaskStatusEnum.COMPLETION_REQUESTED) {
        throw new ApiError(400, "Task is not pending completion review");
    }

    const approved = decision === "approved";
    const previousStatus = task.status;
    task.status = approved ? TaskStatusEnum.DONE : TaskStatusEnum.IN_PROGRESS;
    task.completionReviewedAt = new Date();
    task.completionReviewedBy = new mongoose.Types.ObjectId(req.user._id);
    task.completionReviewComment = comment || "";
    task.completionReviewOutcome = approved ? "approved" : "rejected";
    await task.save();

    logActivity({
        projectId,
        actorId: req.user._id,
        action: approved
            ? ActivityActionEnum.TASK_COMPLETION_APPROVED
            : ActivityActionEnum.TASK_COMPLETION_REJECTED,
        entityType: "task",
        entityId: task._id,
        entityName: task.title,
        metadata: {
            from: previousStatus,
            to: task.status,
            ...(comment ? { comment } : {}),
        },
    }).catch(() => {});

    const notifyRecipients = new Set();
    if (task.completionRequestedBy) notifyRecipients.add(String(task.completionRequestedBy));
    if (task.assignedTo) notifyRecipients.add(String(task.assignedTo));
    notifyRecipients.delete(String(req.user._id));

    if (notifyRecipients.size) {
        const verb = approved ? "approved" : "rejected";
        notifyUsers(
            [...notifyRecipients].map((recipientId) => ({
                recipientId,
                senderId: req.user._id,
                type: approved
                    ? NotificationTypeEnum.TASK_COMPLETION_APPROVED
                    : NotificationTypeEnum.TASK_COMPLETION_REJECTED,
                message: `${req.user.fullName || req.user.username} ${verb} completion for "${task.title}"`,
                link: { entityType: "task", entityId: task._id, projectId },
            })),
        ).catch(() => {});
    }

    return res.status(200).json(new ApiResponse(200, task, `Completion ${decision}`));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId, projectId } = req.params;
    const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });
    if (!task) throw new ApiError(404, "Task not found");
    await Subtask.deleteMany({ task: task._id });
    logActivity({ projectId: task.project, actorId: req.user._id, action: ActivityActionEnum.TASK_DELETED,
        entityType: "task", entityId: task._id, entityName: task.title,
    }).catch(() => {});
    return res.status(200).json(new ApiResponse(200, task, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
    const { taskId, projectId } = req.params;
    const { title } = req.body;
    const task = await Task.findOne({ _id: taskId, project: projectId });
    if (!task) throw new ApiError(404, "Task not found");
    const subtask = await Subtask.create({ title, task: new mongoose.Types.ObjectId(taskId),
        createdBy: new mongoose.Types.ObjectId(req.user._id) });
    logActivity({ projectId: task.project, actorId: req.user._id, action: ActivityActionEnum.SUBTASK_CREATED,
        entityType: "subtask", entityId: subtask._id, entityName: subtask.title,
        metadata: { parentTaskId: taskId, parentTaskTitle: task.title },
    }).catch(() => {});
    return res.status(201).json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { subTaskId, projectId } = req.params;
    const { title, isCompleted } = req.body;
    const currentSubtask = await Subtask.findById(subTaskId);
    if (!currentSubtask) throw new ApiError(404, "Subtask not found");

    const parentTask = await Task.findOne({ _id: currentSubtask.task, project: projectId }).select("project title");
    if (!parentTask) throw new ApiError(404, "Subtask not found");

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (isCompleted !== undefined) updatePayload.isCompleted = isCompleted;

    const subtask = await Subtask.findByIdAndUpdate(subTaskId, { $set: updatePayload }, { new: true });
    if (!subtask) throw new ApiError(404, "Subtask not found");
    logActivity({ projectId: parentTask?.project, actorId: req.user._id, action: ActivityActionEnum.SUBTASK_UPDATED,
        entityType: "subtask", entityId: subtask._id, entityName: subtask.title,
        metadata: { parentTaskTitle: parentTask?.title, ...(isCompleted !== undefined && { isCompleted }) },
    }).catch(() => {});
    return res.status(200).json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { subTaskId, projectId } = req.params;
    const existingSubtask = await Subtask.findById(subTaskId);
    if (!existingSubtask) throw new ApiError(404, "Subtask not found");

    const parentTask = await Task.findOne({ _id: existingSubtask.task, project: projectId }).select("project title");
    if (!parentTask) throw new ApiError(404, "Subtask not found");

    const subtask = await Subtask.findByIdAndDelete(subTaskId);
    if (!subtask) throw new ApiError(404, "Subtask not found");
    logActivity({ projectId: parentTask?.project, actorId: req.user._id, action: ActivityActionEnum.SUBTASK_DELETED,
        entityType: "subtask", entityId: subtask._id, entityName: subtask.title,
        metadata: { parentTaskTitle: parentTask?.title },
    }).catch(() => {});
    return res.status(200).json(new ApiResponse(200, subtask, "Subtask deleted successfully"));
});

export {
    createSubTask,
    createTask,
    deleteTask,
    deleteSubTask,
    getMyDashboard,
    getTaskById,
    getTasks,
    requestTaskCompletion,
    reviewTaskCompletion,
    updateSubTask,
    updateTask,
};