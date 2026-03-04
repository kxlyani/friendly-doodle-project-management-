class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],     // ✅ Move errors to 3rd position
    stack = "",      // ✅ Move stack to 4th position
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;