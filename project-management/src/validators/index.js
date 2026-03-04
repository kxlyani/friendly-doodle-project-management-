import { body } from "express-validator";
import { availableUserRoles } from "../utils/constants.js";

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
        body("email")
            .optional()
            .trim()
            .isEmail()
            .withMessage("Invalid email"),
        body("username")
            .optional()
            .trim()
            .isLowercase()
            .withMessage("Username should be lowercase only")
            .isLength({ min: 3 })
            .withMessage("Username should be at least 3 characters long"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required"),
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
  return [body("newPassword").notEmpty().withMessage("Password is required")];
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
      .isIn(availableUserRoles)
      .withMessage("Role is invalid"),
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
};
