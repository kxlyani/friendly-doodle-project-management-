import { Router } from "express";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import {
    getNotes,
    createNote,
    getNoteById,
    updateNote,
    deleteNote,
} from "../controllers/note.controllers.js";
import { ProjectRolesEnum, availableProjectRoles } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

const ownersAndManagers = [
    ProjectRolesEnum.PROJECT_OWNER,
    ProjectRolesEnum.PROJECT_MANAGER,
];

router
    .route("/:projectId")
    .get(validateProjectPermission(availableProjectRoles), getNotes)
    .post(validateProjectPermission(ownersAndManagers), createNote);

router
    .route("/:projectId/n/:noteId")
    .get(validateProjectPermission(availableProjectRoles), getNoteById)
    .put(validateProjectPermission(ownersAndManagers), updateNote)
    .delete(validateProjectPermission(ownersAndManagers), deleteNote);

export default router;