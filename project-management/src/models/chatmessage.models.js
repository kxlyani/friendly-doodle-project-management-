import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: "ChatConversation",
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000,
        },
    },
    { timestamps: true },
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

