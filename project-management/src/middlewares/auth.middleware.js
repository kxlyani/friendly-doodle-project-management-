import User from "../models/user.models.js";
import asyncHandler from "../utils/async-handler.js";
import ApiError from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import { ProjectMember } from "../models/projectmember.models.js";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized ");
    }

    try {
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedtoken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
        );

        if (!user) {
            throw new ApiError(401, "Access token invalid");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized error", error);
    }
});

export const validateProjectPermission = (roles = []) => {
    return asyncHandler(async (req, res, next) => {
        const { projectId } = req.params;
        if (!projectId) {
            throw new ApiError(400, "ProjectId is missing");
        }   

        const projectMember = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id),
        });
        if (!projectMember) {
            throw new ApiError(404, "Project member not found");
        }

        const incomingRole = projectMember?.role;
        req.user.role = incomingRole;

        if (!roles.includes(incomingRole)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }

        next();
    });
};
