import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      // removed: unique: true  ← was globally unique, wrong
      trim: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Compound index: name must be unique PER USER, not globally
projectSchema.index({ name: 1, createdBy: 1 }, { unique: true });

export const Project = mongoose.model("Project", projectSchema);