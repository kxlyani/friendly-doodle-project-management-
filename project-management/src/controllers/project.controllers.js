import asyncHandler from "../utils/async-handler.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Project } from "../models/project.models.js";
import User from "../models/user.models.js";
import mongoose, { mongo } from "mongoose";
import { availableUserRoles, UserRolesEnum } from "../utils/constants.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";

const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },
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
                    {
                        $addFields: {
                            members: {
                                $size: "$projectmembers",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$project",
        },
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1,
                },
                role: 1,
                _id: 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    res.status(200).json(
        new ApiResponse(200, project, "Project returned succesfully"),
    );
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.ADMIN,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { projectId } = req.params;

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description,
        },
        { new: true },
    );
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);
    await ProjectMember.deleteMany({ project: project._id });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    res.status(200).json(
        new ApiResponse(200, project, "Project deleted succesfully"),
    );
});

const addMembersToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { projectId } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // const project = await Project.findById(projectId);
    // if (!project) {
    //     throw new ApiError(404, "Project not found");
    // }

    // await ProjectMember.create({
    //     project,
    //     user,
    //     role,
    // });

    await ProjectMember.findOneAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role,
        },
        {
            upsert: true,
            new: true,
        },
    );

    return res
        .status(201)
        .json(new ApiResponse(201, {}, "Project member added successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                user: {
                    $arrayElemAt: ["$user", 0],
                },
            },
        },
        {
            $project: {
                project: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, projectMembers, "Project members fetched"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const { projectId, userId } = req.params;

    if (!availableUserRoles.includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    const projectMember = await ProjectMember.findOneAndUpdate(
        {
            user: new mongoose.Types.ObjectId(userId),
            project: new mongoose.Types.ObjectId(projectId),
        },
        { role },
        { new: true },
    );

    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, projectMember, "Role updated successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    const projectMember = await ProjectMember.findOneAndDelete({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, projectMember, "Member deleted successfully"),
        );
});

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMembersToProject,
    getProjectMembers,
    updateMemberRole,
    deleteMember,
};
