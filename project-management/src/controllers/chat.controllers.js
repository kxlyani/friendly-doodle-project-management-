import asyncHandler from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import mongoose from "mongoose";
import { ChatConversation } from "../models/chatconversation.models.js";
import { ChatMessage } from "../models/chatmessage.models.js";

const ensureObjectId = (id, name) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, `${name} is invalid`);
    }
    return new mongoose.Types.ObjectId(id);
};

export const getConversations = asyncHandler(async (req, res) => {
    const me = new mongoose.Types.ObjectId(req.user._id);

    const conversations = await ChatConversation.find({
        participants: me,
    })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .limit(100)
        .populate("participants", "_id username email fullName avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, conversations, "Conversations fetched"));
});

export const createConversation = asyncHandler(async (req, res) => {
    const { participantIds = [], projectId = null } = req.body;

    if (!Array.isArray(participantIds) || participantIds.length < 1) {
        throw new ApiError(400, "participantIds is required");
    }

    const me = String(req.user._id);
    const unique = Array.from(new Set([me, ...participantIds.map(String)]));
    if (unique.length < 2) {
        throw new ApiError(400, "At least 2 unique participants required");
    }

    const participants = unique.map((id) => ensureObjectId(id, "participantId"));

    const project = projectId ? ensureObjectId(projectId, "projectId") : null;

    // Reuse existing conversation with exact same participant set (+ same project)
    const existing = await ChatConversation.findOne({
        project,
        participants: { $all: participants, $size: participants.length },
    }).populate("participants", "_id username email fullName avatar");

    if (existing) {
        return res
            .status(200)
            .json(new ApiResponse(200, existing, "Conversation exists"));
    }

    const convo = await ChatConversation.create({
        participants,
        project,
        lastMessageAt: null,
    });

    const populated = await ChatConversation.findById(convo._id).populate(
        "participants",
        "_id username email fullName avatar",
    );

    return res
        .status(201)
        .json(new ApiResponse(201, populated, "Conversation created"));
});

export const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const limitRaw = Number(req.query.limit ?? 30);
    const limit = Math.max(1, Math.min(limitRaw || 30, 100));
    const before = req.query.before ? new Date(req.query.before) : null;

    const convoObjectId = ensureObjectId(conversationId, "conversationId");
    const me = new mongoose.Types.ObjectId(req.user._id);

    const convo = await ChatConversation.findById(convoObjectId).select(
        "_id participants",
    );
    if (!convo) throw new ApiError(404, "Conversation not found");

    if (!convo.participants.some((p) => String(p) === String(me))) {
        throw new ApiError(403, "You do not have access to this conversation");
    }

    const filter = { conversation: convoObjectId };
    if (before) filter.createdAt = { $lt: before };

    const messages = await ChatMessage.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sender", "_id username email fullName avatar");

    // Return oldest-first for easier UI rendering
    const ordered = [...messages].reverse();

    return res
        .status(200)
        .json(new ApiResponse(200, { messages: ordered }, "Messages fetched"));
});

export const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
        throw new ApiError(400, "text is required");
    }

    const convoObjectId = ensureObjectId(conversationId, "conversationId");
    const me = new mongoose.Types.ObjectId(req.user._id);

    const convo = await ChatConversation.findById(convoObjectId).select(
        "_id participants",
    );
    if (!convo) throw new ApiError(404, "Conversation not found");

    if (!convo.participants.some((p) => String(p) === String(me))) {
        throw new ApiError(403, "You do not have access to this conversation");
    }

    const message = await ChatMessage.create({
        conversation: convoObjectId,
        sender: me,
        text: text.trim(),
    });

    await ChatConversation.findByIdAndUpdate(convoObjectId, {
        $set: { lastMessageAt: new Date() },
    });

    const populated = await ChatMessage.findById(message._id).populate(
        "sender",
        "_id username email fullName avatar",
    );

    return res
        .status(201)
        .json(new ApiResponse(201, populated, "Message sent"));
});

