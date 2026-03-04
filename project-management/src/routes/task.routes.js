import { Router } from "express";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import {
    getTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
} from "../controllers/task.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
// import {
//     createTaskValidator,
//     createSubTaskValidator,
//     updateSubTaskValidator,
// } from "../validators/index.js";
import { UserRolesEnum, availableUserRoles } from "../utils/constants.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

const adminAndProjectAdmin = [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN];

// Task routes
router
    .route("/:projectId")
    .get(validateProjectPermission(availableUserRoles), getTasks)
    .post(
        validateProjectPermission(adminAndProjectAdmin),
        upload.array("attachments"),
        createTask
    );

router
    .route("/:projectId/t/:taskId")
    .get(validateProjectPermission(availableUserRoles), getTaskById)
    .put(validateProjectPermission(adminAndProjectAdmin), updateTask)
    .delete(validateProjectPermission(adminAndProjectAdmin), deleteTask);

// Subtask routes
router
    .route("/:projectId/t/:taskId/subtasks")
    .post(
        validateProjectPermission(adminAndProjectAdmin),
        createSubTask
    );

router
    .route("/:projectId/st/:subTaskId")
    .put(validateProjectPermission(availableUserRoles), updateSubTask)
    .delete(validateProjectPermission(adminAndProjectAdmin), deleteSubTask);

export default router;