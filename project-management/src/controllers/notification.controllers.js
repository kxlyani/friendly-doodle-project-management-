import { Notification } from "../models/notification.models.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import mongoose from "mongoose";

/**
 * GET /api/v1/notifications
 *
 * Query params:
 *   unreadOnly  - "true" to return only unread (default: false)
 *   page        - page number (default: 1)
 *   limit       - max per page (default: 20, max: 50)
 */
const getNotifications = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === "true";

    const filter = {
        recipient: new mongoose.Types.ObjectId(req.user._id),
        ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("sender", "username fullName avatar"),
        Notification.countDocuments(filter),
        // Always return unread count regardless of the unreadOnly filter
        Notification.countDocuments({
            recipient: new mongoose.Types.ObjectId(req.user._id),
            isRead: false,
        }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                notifications,
                unreadCount,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1,
                },
            },
            "Notifications fetched successfully",
        ),
    );
});

/**
 * GET /api/v1/notifications/unread-count
 * Lightweight endpoint for polling — just the badge number.
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: new mongoose.Types.ObjectId(req.user._id),
        isRead: false,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { count }, "Unread count fetched"));
});

/**
 * PATCH /api/v1/notifications/:notificationId/read
 * Mark a single notification as read.
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(notificationId),
            recipient: new mongoose.Types.ObjectId(req.user._id), // ownership check
        },
        { isRead: true },
        { new: true },
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, notification, "Notification marked as read"));
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all of the current user's notifications as read.
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        {
            recipient: new mongoose.Types.ObjectId(req.user._id),
            isRead: false,
        },
        { isRead: true },
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { updatedCount: result.modifiedCount },
            "All notifications marked as read",
        ),
    );
});

/**
 * DELETE /api/v1/notifications/:notificationId
 * Delete a single notification (user can dismiss it).
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(notificationId),
        recipient: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notification deleted"));
});

export {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};