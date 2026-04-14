import asyncHandler from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import User from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { availableSystemRoles, SystemRolesEnum } from "../utils/constants.js";

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

    if (!user) throw new ApiError(404, "User not found");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User role updated successfully"));
});

