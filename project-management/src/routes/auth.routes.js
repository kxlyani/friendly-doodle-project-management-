import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerfication,
    refreshAccessToken,
    forgotPasswordRequest,
    changePassword,
    resetForgotPassword,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    authLimiter,
    resendLimiter,
} from "../middlewares/rate-limit.middleware.js";

const router = Router();

// unsecure routes — strict rate limiting on all brute-force targets
router
    .route("/register")
    .post(authLimiter, userRegisterValidator(), validate, registerUser);

router
    .route("/login")
    .post(authLimiter, userLoginValidator(), validate, loginUser);

router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/refresh-token").post(verifyJWT, refreshAccessToken);

router
    .route("/forgot-password")
    .post(authLimiter, userForgotPasswordValidator(), validate, forgotPasswordRequest);

router
    .route("/reset-password/:resetToken")
    .post(authLimiter, userResetForgotPasswordValidator(), validate, resetForgotPassword);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router
    .route("/change-password")
    .post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changePassword);

router
    .route("/resend-email-verification")
    .get(verifyJWT, resendLimiter, resendEmailVerfication);

export default router;