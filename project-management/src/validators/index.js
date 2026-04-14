import { body } from "express-validator";
import { availableProjectRoles, availableTaskStatuses, availableTaskPriorities } from "../utils/constants.js";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be lowercase")
            .isLength({ min: 3 })
            .withMessage("Username must be at least 3 characters"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters"),
    ];
};

const userLoginValidator = () => {
    return [
        body("email").optional().trim().isEmail().withMessage("Invalid email"),
        body("username")
            .optional()
            .trim()
            .isLowercase()
            .withMessage("Username should be lowercase only")
            .isLength({ min: 3 })
            .withMessage("Username should be at least 3 characters long"),
        body("password").trim().notEmpty().withMessage("Password is required"),
    ];
};

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword").notEmpty().withMessage("Old password is required"),
        body("newPassword").notEmpty().withMessage("New password is required"),
    ];
};

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
    ];
};

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword").notEmpty().withMessage("Password is required"),
    ];
};

const createProjectValidator = () => {
    return [
        body("name").notEmpty().withMessage("Name is required"),
        body("description").optional(),
    ];
};

const addMembertoProjectValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("role")
            .notEmpty()
            .withMessage("Role is required")
            .isIn(availableProjectRoles)
            .withMessage("Role is invalid"),
    ];
};

const createTaskValidator = () => {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required")
            .isLength({ max: 200 })
            .withMessage("Title cannot exceed 200 characters"),
        body("description").optional().trim(),
        body("assignedTo")
            .optional()
            .isMongoId()
            .withMessage("assignedTo must be a valid user ID"),
        body("status")
            .optional()
            .isIn(availableTaskStatuses)
            .withMessage(`Status must be one of: ${availableTaskStatuses.join(", ")}`),
        body("priority")
            .optional()
            .isIn(availableTaskPriorities)
            .withMessage(`Priority must be one of: ${availableTaskPriorities.join(", ")}`),
        body("dueDate")
            .optional()
            .isISO8601()
            .withMessage("dueDate must be a valid ISO 8601 date (e.g. 2025-12-31)")
            .toDate(),
        body("tags")
            .optional()
            .isArray({ max: 10 })
            .withMessage("Tags must be an array of at most 10 items"),
        body("tags.*")
            .trim()
            .notEmpty()
            .withMessage("Tags cannot contain empty strings")
            .isLength({ max: 30 })
            .withMessage("Each tag cannot exceed 30 characters"),
    ];
};

const updateTaskValidator = () => {
    return [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty")
            .isLength({ max: 200 })
            .withMessage("Title cannot exceed 200 characters"),
        body("description").optional().trim(),
        body("assignedTo")
            .optional()
            .isMongoId()
            .withMessage("assignedTo must be a valid user ID"),
        body("status")
            .optional()
            .isIn(availableTaskStatuses)
            .withMessage(`Status must be one of: ${availableTaskStatuses.join(", ")}`),
        body("priority")
            .optional()
            .isIn(availableTaskPriorities)
            .withMessage(`Priority must be one of: ${availableTaskPriorities.join(", ")}`),
        body("dueDate")
            .optional({ nullable: true }) // allow explicitly setting dueDate to null to clear it
            .isISO8601()
            .withMessage("dueDate must be a valid ISO 8601 date")
            .toDate(),
        body("tags")
            .optional()
            .isArray({ max: 10 })
            .withMessage("Tags must be an array of at most 10 items"),
        body("tags.*")
            .trim()
            .notEmpty()
            .withMessage("Tags cannot contain empty strings")
            .isLength({ max: 30 })
            .withMessage("Each tag cannot exceed 30 characters"),
    ];
};

const createSubTaskValidator = () => {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required")
            .isLength({ max: 200 })
            .withMessage("Title cannot exceed 200 characters"),
    ];
};

const updateSubTaskValidator = () => {
    return [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty")
            .isLength({ max: 200 })
            .withMessage("Title cannot exceed 200 characters"),
        body("isCompleted")
            .optional()
            .isBoolean()
            .withMessage("isCompleted must be a boolean"),
    ];
};

export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator,
    createProjectValidator,
    addMembertoProjectValidator,
    createTaskValidator,
    updateTaskValidator,
    createSubTaskValidator,
    updateSubTaskValidator,
};