import { Router } from "express";
import {
    validateProjectPermission,
    verifyJWT,
} from "../middlewares/auth.middleware.js";
import {
    addMembersToProject,
    createProject,
    deleteMember,
    deleteProject,
    getProjectById,
    getProjectMembers,
    getProjects,
    updateMemberRole,
    updateProject,
} from "../controllers/project.controllers.js";
import { getActivityLog } from "../controllers/activity.controllers.js";
import {
    addMembertoProjectValidator,
    createProjectValidator,
} from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { availableProjectRoles, ProjectRolesEnum } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(getProjects);
router.route("/").post(createProjectValidator(), validate, createProject);

router
    .route("/:projectId")
    .get(validateProjectPermission(availableProjectRoles), getProjectById)
    .put(validateProjectPermission([ProjectRolesEnum.PROJECT_OWNER]), updateProject)
    .delete(validateProjectPermission([ProjectRolesEnum.PROJECT_OWNER]), deleteProject);

router
    .route("/:projectId/members")
    .get(getProjectMembers)
    .post(addMembertoProjectValidator(), validate, addMembersToProject);

router
    .route("/:projectId/members/:userId")
    .put(validateProjectPermission([ProjectRolesEnum.PROJECT_OWNER]), updateMemberRole)
    .delete(validateProjectPermission([ProjectRolesEnum.PROJECT_OWNER]), deleteMember);

// Activity log — any project member can read
router
    .route("/:projectId/activity")
    .get(validateProjectPermission(availableProjectRoles), getActivityLog);

export default router;