import ApiError from "../utils/api-error.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || []);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors, // Always include errors, even if empty
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;