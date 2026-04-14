import { Notification } from "../models/notification.models.js";

/**
 * Create one or more notification documents.
 *
 * Fire-and-forget — always call as:
 *   notifyUsers([...]).catch(() => {});
 *
 * A failed notification write must never crash or roll back
 * the main operation that triggered it.
 *
 * @param {Array<Object>} notifications
 * @param {string}   notifications[].recipientId  - User to notify
 * @param {string}   [notifications[].senderId]   - User who triggered it
 * @param {string}   notifications[].type         - NotificationTypeEnum value
 * @param {string}   notifications[].message      - Human-readable message
 * @param {Object}   [notifications[].link]       - { entityType, entityId, projectId }
 */
export const notifyUsers = async (notifications) => {
    try {
        if (!notifications?.length) return;

        const docs = notifications.map(
            ({ recipientId, senderId, type, message, link }) => ({
                recipient: recipientId,
                sender: senderId ?? null,
                type,
                message,
                link: link ?? {},
            }),
        );

        await Notification.insertMany(docs, { ordered: false });
    } catch (err) {
        console.error("[Notifications] Failed to write notifications:", err.message);
    }
};

/**
 * Parse @username mentions from a string and return the
 * matching User documents. Deduplicates mentions automatically.
 *
 * @param {string} text       - Raw note/comment content
 * @param {Model}  UserModel  - Mongoose User model (passed in to avoid circular imports)
 * @returns {Promise<Array>}  - Array of matched User docs
 */
export const resolveMentions = async (text, UserModel) => {
    try {
        const matches = text.match(/@([a-zA-Z0-9_]+)/g);
        if (!matches?.length) return [];

        const usernames = [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];

        return await UserModel.find(
            { username: { $in: usernames } },
            "_id username fullName",
        );
    } catch (err) {
        console.error("[Notifications] Failed to resolve mentions:", err.message);
        return [];
    }
};