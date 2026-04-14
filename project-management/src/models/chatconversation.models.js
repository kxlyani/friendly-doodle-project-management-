import mongoose, { Schema } from "mongoose";

const chatConversationSchema = new Schema(
    {
        participants: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            required: true,
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length >= 2,
                message: "A conversation must have at least 2 participants",
            },
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        lastMessageAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: true },
);

chatConversationSchema.index({ participants: 1 });
chatConversationSchema.index({ project: 1, lastMessageAt: -1 });

export const ChatConversation = mongoose.model(
    "ChatConversation",
    chatConversationSchema,
);

