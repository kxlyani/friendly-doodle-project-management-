import { Router } from "express";
import { verifyJWT, requireSystemRole } from "../middlewares/auth.middleware.js";
import { SystemRolesEnum } from "../utils/constants.js";
import {
    getAdminStats,
    getAllProjectsAdmin,
    getAllUsersAdmin,
    updateUserSystemRoleAdmin,
} from "../controllers/admin.controllers.js";

const router = Router();

router.use(verifyJWT);
router.use(requireSystemRole([SystemRolesEnum.SYSTEM_ADMIN]));

router.route("/stats").get(getAdminStats);
router.route("/projects").get(getAllProjectsAdmin);
router.route("/users").get(getAllUsersAdmin);
router.route("/users/:userId/role").patch(updateUserSystemRoleAdmin);

export default router;

