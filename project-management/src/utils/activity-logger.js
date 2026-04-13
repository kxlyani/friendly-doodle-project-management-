import { ActivityLog } from "../models/activitylog.models.js";

/**
 * Write an activity log entry.
 *
 * Designed to be fire-and-forget — a failed log write should never crash
 * or roll back the main operation. Always call without await, or wrap in
 * a non-blocking pattern:
 *
 *   logActivity({ ... }).catch(() => {}); // safe — swallows log errors
 *
 * @param {Object} params
 * @param {string}   params.projectId  - The project this activity belongs to
 * @param {string}   params.actorId    - The user who performed the action
 * @param {string}   params.action     - An ActivityActionEnum value
 * @param {string}   params.entityType - "task" | "project" | "member" | "note" | "subtask"
 * @param {string}   params.entityId   - ObjectId of the affected entity
 * @param {string}   params.entityName - Human-readable name, snapshotted at write time
 * @param {Object}   [params.metadata] - Optional structured diff / extra context
 */
export const logActivity = async ({
    projectId,
    actorId,
    action,
    entityType,
    entityId,
    entityName,
    metadata = {},
}) => {
    try {
        await ActivityLog.create({
            project: projectId,
            actor: actorId,
            action,
            entity: {
                type: entityType,
                id: entityId,
                name: entityName,
            },
            metadata,
        });
    } catch (err) {
        // Log to console but never propagate — the main operation already succeeded
        console.error("[ActivityLog] Failed to write log entry:", err.message);
    }
};