import User from "../models/user.models.js";
import ApiResponse from "../utils/api-response.js";
import ApiError from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import { VerificationEmail, sendEmail } from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, `Error generating tokens: ${error}`);
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // 1. get data
    const { username, email, password, role } = req.body;

    // 2. validate
    const registeredUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    // 3. check if user exists in db
    if (registeredUser) {
        throw new ApiError(409, "User already exists");
    }

    // 4. save user
    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false,
    });

    // 4.1 generate tokens
    const { unhashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    // generateTokens();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: VerificationEmail(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`,
        ),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering a user",
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { user: createdUser },
                "User registered successfully and verification email has been sent on your email",
            ),
        );
});

const loginUser = asyncHandler(async (req, res) => {
    //get and validate credentials
    const { username, email, password } = req.body;

    if (!email && !username) {
        throw new ApiError(404, "Username or email does not exist");
    }

    const user = await User.findOne({ username });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (!(await user.isPasswordCorrect(password))) {
        throw new ApiError(400, "Password id incorrect");
    }

    // generate acces and refresh tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // sameSite: "strict",
    };

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in succesfully",
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: null },
        },
        { new: true },
    );
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // sameSite: "strict",
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User found and returned succesfully"),
        );
    // return res.status(200, req.user, "User found and returned succesfully");
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;

    if (!verificationToken) {
        throw new ApiError(400, "Email verification failed, token is missing");
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired token");
    }

    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;

    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isEmailVerified: true,
            },
            "User verified successfully",
        ),
    );
});

const resendEmailVerfication = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found / User is not logged in");
    }

    if (user.isEmailVerified) {
        throw new ApiError(409, "Eail is already verified");
    }

    // 4.1 generate tokens
    const { unhashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    // generateTokens();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: VerificationEmail(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`,
        ),
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                username: user.username,
                email: user.email,
            },
            "Verification email resent",
        ),
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    try {
        const decodedtoken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedtoken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(
            user._id,
        );

        user.refreshToken = newRefreshToken;
        await user.save();

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, {
                    accessToken,
                    refreshToken: newRefreshToken,
                }),
            );
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token", error);
    }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const { unhashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.sendEmail({
        email: user?.email,
        subject: "Password reset request",
        mailgenContent: ForgotPasswordEmail(
            user.username,
            `${process.env.FORGOT_PASSWORD_URL}/${unhashedToken}`,
        ),
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset mail has been sent"));
});

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) {
        throw new ApiError(490, "Token is invalid or expired");
    }

    user.forgotPasswordExpiry = null;
    user.forgotPasswordToken = null;

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { username: user.username },
                "Password has been reset",
            ),
        );
});

const changePassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    const decodedtoken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedtoken?._id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired");
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset succesfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerfication,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changePassword
};
