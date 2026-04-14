import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createConversation,
    getConversations,
    getMessages,
    sendMessage,
} from "../controllers/chat.controllers.js";

const router = Router();
router.use(verifyJWT);

router.route("/conversations").get(getConversations).post(createConversation);
router.route("/conversations/:conversationId/messages").get(getMessages).post(sendMessage);

export default router;

