import { rateLimit } from "express-rate-limit";

/**
 * Formats rate limit errors to match the project's ApiError response shape
 * so the client always gets { success, message, errors } regardless of which
 * limiter fires.
 */
const rateLimitHandler = (req, res) => {
    res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        errors: [],
    });
};

/**
 * Global limiter — applied to every /api/v1/* route.
 * A generous ceiling to catch runaway clients and scrapers,
 * not to restrict normal usage.
 *
 * 300 requests / 15 min per IP
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7", // Return RateLimit-* headers (RFC draft 7)
    legacyHeaders: false,        // Disable X-RateLimit-* legacy headers
    handler: rateLimitHandler,
});

/**
 * Auth limiter — applied to login, register, forgot-password, reset-password.
 * Tight window to block brute-force and credential stuffing attacks.
 *
 * 10 attempts / 15 min per IP
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message:
                "Too many attempts. Please wait 15 minutes before trying again.",
            errors: [],
        });
    },
});

/**
 * Resend limiter — applied to email verification resend.
 * Prevents using the endpoint to spam inboxes.
 *
 * 3 requests / 60 min per IP
 */
export const resendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message:
                "Verification email already sent. Please wait an hour before requesting again.",
            errors: [],
        });
    },
});