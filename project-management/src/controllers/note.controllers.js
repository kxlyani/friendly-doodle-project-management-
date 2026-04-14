import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import User from "../models/user.models.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import mongoose from "mongoose";
import { NotificationTypeEnum } from "../utils/constants.js";
import { notifyUsers, resolveMentions } from "../utils/notification-helper.js";

const getNotes = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const notes = await ProjectNote.find({
        project: new mongoose.Types.ObjectId(projectId),
    }).populate("createdBy", "username fullName avatar");

    return res.status(200).json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (!title || !content) throw new ApiError(400, "Title and content are required");

    const note = await ProjectNote.create({
        title,
        content,
        project: new mongoose.Types.ObjectId(projectId),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    // Parse @mentions and notify mentioned users (excluding the author)
    const mentionedUsers = await resolveMentions(content, User);

    if (mentionedUsers.length) {
        const mentionNotifications = mentionedUsers
            .filter((u) => String(u._id) !== String(req.user._id)) // skip self-mentions
            .map((u) => ({
                recipientId: u._id,
                senderId: req.user._id,
                type: NotificationTypeEnum.MENTION,
                message: `${req.user.fullName || req.user.username} mentioned you in a note`,
                link: {
                    entityType: "note",
                    entityId: note._id,
                    projectId,
                },
            }));

        if (mentionNotifications.length) {
            notifyUsers(mentionNotifications).catch(() => {});
        }
    }

    return res.status(201).json(new ApiResponse(201, note, "Note created successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await ProjectNote.findById(noteId).populate(
        "createdBy",
        "username fullName avatar",
    );
    if (!note) throw new ApiError(404, "Note not found");

    return res.status(200).json(new ApiResponse(200, note, "Note fetched successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const { noteId } = req.params;

    const before = await ProjectNote.findById(noteId);
    if (!before) throw new ApiError(404, "Note not found");

    const note = await ProjectNote.findByIdAndUpdate(
        noteId,
        { title, content },
        { new: true, runValidators: true },
    );

    // Notify newly mentioned users — users already mentioned in the previous
    // version don't get a duplicate notification
    if (content && content !== before.content) {
        const [previousMentions, currentMentions] = await Promise.all([
            resolveMentions(before.content, User),
            resolveMentions(content, User),
        ]);

        const previousIds = new Set(previousMentions.map((u) => String(u._id)));

        const newlyMentioned = currentMentions.filter(
            (u) =>
                !previousIds.has(String(u._id)) &&
                String(u._id) !== String(req.user._id),
        );

        if (newlyMentioned.length) {
            notifyUsers(
                newlyMentioned.map((u) => ({
                    recipientId: u._id,
                    senderId: req.user._id,
                    type: NotificationTypeEnum.MENTION,
                    message: `${req.user.fullName || req.user.username} mentioned you in a note`,
                    link: {
                        entityType: "note",
                        entityId: note._id,
                        projectId: note.project,
                    },
                })),
            ).catch(() => {});
        }
    }

    return res.status(200).json(new ApiResponse(200, note, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await ProjectNote.findByIdAndDelete(noteId);
    if (!note) throw new ApiError(404, "Note not found");

    return res.status(200).json(new ApiResponse(200, {}, "Note deleted successfully"));
});

export { getNotes, createNote, getNoteById, updateNote, deleteNote };