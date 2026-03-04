import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";

// const healthCheck = (req, res) => {
//     try {
//         res.status(200).json(new ApiResponse(200, null, "API is healthy"));
//     } catch (error) {
//         res.status(500).json(new ApiResponse(500, null, "Internal server error"));
//     }
// }

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, null, "Api is healthy"));
});

export { healthCheck };
