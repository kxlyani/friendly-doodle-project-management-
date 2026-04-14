import User from "../models/user.models.js";
import asyncHandler from "../utils/async-handler.js";
import ApiError from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import { ProjectMember } from "../models/projectmember.models.js";
import mongoose from "mongoose";
import { SystemRolesEnum } from "../utils/constants.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized ");
    }

    try {
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const authUser = await User.findById(decodedtoken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
        );

        if (!authUser) {
            throw new ApiError(401, "Access token invalid");
        }

        req.user = authUser;
        req.adminUser = null;
        req.adminContext = null;

        // Break-glass impersonation (system_admin only).
        // When active, req.user becomes the impersonated user,
        // while req.adminUser/adminContext preserve the real admin identity.
        const impersonationToken = req.cookies?.impersonationToken;
        if (
            impersonationToken &&
            authUser.systemRole === SystemRolesEnum.SYSTEM_ADMIN
        ) {
            try {
                const imp = jwt.verify(
                    impersonationToken,
                    process.env.ACCESS_TOKEN_SECRET,
                );

                const impersonatedUser = await User.findById(
                    imp?.impersonatedUserId,
                ).select(
                    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
                );

                if (impersonatedUser) {
                    req.adminUser = authUser;
                    req.adminContext = {
                        adminId: String(imp?.adminId),
                        impersonatedUserId: String(imp?.impersonatedUserId),
                        reason: imp?.reason || "",
                        expiresAt: imp?.exp ? new Date(imp.exp * 1000) : null,
                    };
                    req.user = impersonatedUser;
                }
            } catch {
                // Invalid/expired impersonation cookie — ignore.
                req.adminUser = null;
                req.adminContext = null;
            }
        }
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

        // System admins can access any project-scoped route,
        // BUT not while impersonating (then permissions should match impersonated user).
        if (
            !req.adminContext &&
            req.user?.systemRole === SystemRolesEnum.SYSTEM_ADMIN
        ) {
            req.user.projectRole = null;
            return next();
        }

        const projectMember = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id),
        });
        if (!projectMember) {
            throw new ApiError(404, "Project member not found");
        }

        const incomingRole = projectMember?.role;
        req.user.projectRole = incomingRole;

        if (!roles.includes(incomingRole)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }

        next();
    });
};

export const requireSystemRole = (roles = []) => {
    return asyncHandler(async (req, res, next) => {
        if (!roles.length) return next();

        const role = req.adminUser?.systemRole ?? req.user?.systemRole;
        if (!role) {
            throw new ApiError(401, "Unauthorized ");
        }

        if (!roles.includes(role)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
            );
        }

        next();
    });
};
