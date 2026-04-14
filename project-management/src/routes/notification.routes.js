import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notification.controllers.js";

const router = Router();
router.use(verifyJWT); // all notification routes require auth

router.route("/").get(getNotifications);
router.route("/unread-count").get(getUnreadCount);
router.route("/read-all").patch(markAllAsRead);
router.route("/:notificationId/read").patch(markAsRead);
router.route("/:notificationId").delete(deleteNotification);

export default router;