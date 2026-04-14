import mongoose, { Schema } from "mongoose";

export const AdminAuditActionEnum = {
    USER_SYSTEM_ROLE_CHANGED: "user_system_role_changed",
    PROJECT_ARCHIVED: "project_archived",
    PROJECT_RESTORED: "project_restored",
    PROJECT_OWNERSHIP_TRANSFERRED: "project_ownership_transferred",
    IMPERSONATION_STARTED: "impersonation_started",
    IMPERSONATION_STOPPED: "impersonation_stopped",
};

export const availableAdminAuditActions = Object.values(AdminAuditActionEnum);

const adminAuditLogSchema = new Schema(
    {
        actor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: availableAdminAuditActions,
            required: true,
            index: true,
        },
        target: {
            type: {
                type: String, // "user" | "project" | "impersonation"
                required: true,
                index: true,
            },
            id: {
                type: Schema.Types.Mixed, // ObjectId or string (future-proof)
                required: true,
            },
            label: {
                type: String,
                required: true,
            },
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true },
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ actor: 1, createdAt: -1 });
adminAuditLogSchema.index({ "target.type": 1, "target.id": 1, createdAt: -1 });

export const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);

