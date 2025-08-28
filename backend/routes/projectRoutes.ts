import express from "express";
import {createProject,getProjects,getProjectById,updateProject,deleteProject,} from "../controllers/projectController.ts";
import { authenticateToken } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/", authenticateToken, createProject);
router.get("/", authenticateToken, getProjects);
router.get("/:id", authenticateToken, getProjectById);
router.put("/:id", authenticateToken, updateProject);
router.delete("/:id", authenticateToken, deleteProject);

export default router;