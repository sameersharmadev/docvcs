import express from "express";
import {addProjectCollaborator,removeProjectCollaborator,listProjectCollaborators, updateProjectCollaboratorRole} from "../controllers/collabController.ts";
import { authenticateToken } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/", authenticateToken, addProjectCollaborator);
router.delete("/", authenticateToken, removeProjectCollaborator);
router.get("/:project_id", authenticateToken, listProjectCollaborators);
router.put("/", authenticateToken, updateProjectCollaboratorRole);

export default router;