import express from "express";
import {me, getUserByUsername, updateProfile} from "../controllers/userController.ts";
import { authenticateToken } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/me", authenticateToken, me);
router.get("/:username", getUserByUsername);
router.put("/me", authenticateToken, updateProfile);

export default router;