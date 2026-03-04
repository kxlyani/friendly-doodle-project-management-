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

const router = Router();

// unsecure routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router
    .route("/forgot-password")
    .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
    .route("/reset-password/:resetToken")
    .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
    .route("/change-password")
    .post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changePassword);
router
    .route("/resend-email-verification")
    .get(verifyJWT, resendEmailVerfication);

export default router;
