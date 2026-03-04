import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        avatar: {
            url: {
                type: String,
                default: "https://placehold.co/200?text=user&font=oswald",
            },
            localPath: {
                type: String,
                default: "",
            },
        },

        username: {
            type: String,
            unique: true,
            required: true,
            index: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordExpiry: {
            type: Date,
        },
        emailVerificationToken: String,
        emailVerificationExpiry: Date,
    },
    { timestamps: true },
);

// add async await if needed
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// check password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// generate acces and refresh tokens
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
    );
};

// generate temporary token wo data

userSchema.methods.generateTemporaryToken = function () {
    const unhashedToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update(unhashedToken)
        .digest("hex");

    const tokenExpiry = Date.now() + 20 * 60 * 1000;

    return { unhashedToken, hashedToken, tokenExpiry };
};


const User = mongoose.model("User", userSchema);

export default User;
