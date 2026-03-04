import { validationResult } from "express-validator";
import ApiError from "../utils/api-error.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = errors.array().map((err) => ({
    [err.path]: err.msg,
  }));
  
  // console.log("Extracted Errors:", extractedErrors); // Debug log
  
  const error = new ApiError(422, "User validation failed", extractedErrors);
  // console.log("ApiError errors:", error.errors); // Debug log
  
  return next(error);
};