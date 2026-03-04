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
import { UserRolesEnum, availableUserRoles } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

const adminOnly = [UserRolesEnum.ADMIN];

router
    .route("/:projectId")
    .get(validateProjectPermission(availableUserRoles), getNotes)
    .post(validateProjectPermission(adminOnly), createNote);

router
    .route("/:projectId/n/:noteId")
    .get(validateProjectPermission(availableUserRoles), getNoteById)
    .put(validateProjectPermission(adminOnly), updateNote)
    .delete(validateProjectPermission(adminOnly), deleteNote);

export default router;