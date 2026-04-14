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
import {
    createTaskValidator,
    updateTaskValidator,
    createSubTaskValidator,
    updateSubTaskValidator,
} from "../validators/index.js";
import { ProjectRolesEnum, availableProjectRoles } from "../utils/constants.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

const ownersAndManagers = [
    ProjectRolesEnum.PROJECT_OWNER,
    ProjectRolesEnum.PROJECT_MANAGER,
];

// Task routes
router
    .route("/:projectId")
    .get(validateProjectPermission(availableProjectRoles), getTasks)
    .post(
        validateProjectPermission(ownersAndManagers),
        upload.array("attachments"),
        createTaskValidator(),
        validate,
        createTask,
    );

router
    .route("/:projectId/t/:taskId")
    .get(validateProjectPermission(availableProjectRoles), getTaskById)
    .put(
        validateProjectPermission(ownersAndManagers),
        updateTaskValidator(),
        validate,
        updateTask,
    )
    .delete(validateProjectPermission(ownersAndManagers), deleteTask);

// Subtask routes
router
    .route("/:projectId/t/:taskId/subtasks")
    .post(
        validateProjectPermission(ownersAndManagers),
        createSubTaskValidator(),
        validate,
        createSubTask,
    );

router
    .route("/:projectId/st/:subTaskId")
    .put(
        validateProjectPermission(availableProjectRoles),
        updateSubTaskValidator(),
        validate,
        updateSubTask,
    )
    .delete(validateProjectPermission(ownersAndManagers), deleteSubTask);

export default router;