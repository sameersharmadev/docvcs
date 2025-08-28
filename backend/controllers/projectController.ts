import type { Request, Response } from "express";
import supabase from "../config/supabase.ts";

export const createProject = async (req: Request, res: Response) => {
    const { name, description, is_public } = req.body;
    const userId = req.user?.id;

    if (!name || !userId) {
        return res.status(400).json({ message: "Project name and authenticated user required." });
    }

    const { data: project, error } = await supabase
        .from("projects")
        .insert([
            {
                name,
                description,
                is_public: !!is_public,
                owner_id: userId,
            }
        ])
        .select("project_id, name, description, is_public, owner_id, created_at")
        .single();

    if (error) {
        return res.status(500).json({ message: "Error creating project", error });
    }

    await supabase
        .from("project_collaborators")
        .insert([
            {
                project_id: project.project_id,
                user_id: userId,
                role: "owner"
            }
        ]);

    res.status(201).json({ project });
};

export const getProjects = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { data: projects, error } = await supabase
        .from("projects")
        .select("project_id, name, description, is_public, owner_id, created_at")
        .eq("owner_id", userId);

    if (error) {
        return res.status(500).json({ message: "Error fetching projects", error });
    }

    res.status(200).json({ projects });
};
export const getProjectById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { data: project, error } = await supabase
        .from("projects")
        .select("project_id, name, description, is_public, owner_id, created_at")
        .eq("project_id", id)
        .single();

    if (error || !project) {
        return res.status(404).json({ message: "Project not found", error });
    }

    const { data: collaborator, error: collabError } = await supabase
        .from("project_collaborators")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", userId)
        .single();

    if (collabError || !collaborator) {
        return res.status(403).json({ message: "Access denied to this project", collabError });
    }

    res.status(200).json({ project });
};
export const updateProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, is_public } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("project_id", id)
        .single();

    if (projectError || !project) {
        return res.status(404).json({ message: "Project not found", projectError });
    }

    if (project.owner_id !== userId) {
        return res.status(403).json({ message: "Only the project owner can update the project." });
    }

    const { data: updatedProject, error: updateError } = await supabase
        .from("projects")
        .update({ name, description, is_public })
        .eq("project_id", id)
        .select("project_id, name, description, is_public, owner_id, created_at")
        .single();

    if (updateError) {
        return res.status(500).json({ message: "Error updating project", updateError });
    }

    res.status(200).json({ project: updatedProject });
};
export const deleteProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("project_id", id)
        .single();

    if (projectError || !project) {
        return res.status(404).json({ message: "Project not found", projectError });
    }

    if (project.owner_id !== userId) {
        return res.status(403).json({ message: "Only the project owner can delete the project." });
    }

    const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("project_id", id);

    if (deleteError) {
        return res.status(500).json({ message: "Error deleting project", deleteError });
    }

    res.status(204).send();
};