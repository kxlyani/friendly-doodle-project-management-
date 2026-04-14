import { Router } from "express";
import { verifyJWT, requireSystemRole } from "../middlewares/auth.middleware.js";
import { SystemRolesEnum } from "../utils/constants.js";
import {
    getAdminStats,
    getAllProjectsAdmin,
    getAllUsersAdmin,
    updateUserSystemRoleAdmin,
    getAdminAudit,
    archiveProjectAdmin,
    restoreProjectAdmin,
    transferProjectOwnershipAdmin,
    startImpersonationAdmin,
    stopImpersonationAdmin,
    getImpersonationStatusAdmin,
} from "../controllers/admin.controllers.js";
import ApiError from "../utils/api-error.js";

const router = Router();

router.use(verifyJWT);
router.use(requireSystemRole([SystemRolesEnum.SYSTEM_ADMIN]));

// Avoid performing admin operations while impersonating.
// The only allowed admin calls while impersonating are impersonation status/stop.
router.use((req, res, next) => {
    const isImpersonationRoute = req.path.startsWith("/impersonate");
    if (req.adminContext && !isImpersonationRoute) {
        throw new ApiError(400, "Stop impersonation before using admin endpoints");
    }
    next();
});

router.route("/stats").get(getAdminStats);
router.route("/projects").get(getAllProjectsAdmin);
router.route("/projects/:projectId/archive").patch(archiveProjectAdmin);
router.route("/projects/:projectId/restore").patch(restoreProjectAdmin);
router
    .route("/projects/:projectId/transfer-ownership")
    .patch(transferProjectOwnershipAdmin);
router.route("/users").get(getAllUsersAdmin);
router.route("/audit").get(getAdminAudit);
router.route("/users/:userId/role").patch(updateUserSystemRoleAdmin);

router.route("/impersonate").post(startImpersonationAdmin);
router.route("/impersonate/stop").post(stopImpersonationAdmin);
router.route("/impersonate/status").get(getImpersonationStatusAdmin);

export default router;

