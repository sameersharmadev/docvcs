import type { Request, Response } from "express";
import supabase from "../config/supabase.ts";

export const addProjectCollaborator = async (req: Request, res: Response) => {
    const { project_id, user_id, role } = req.body;
    const validRoles = ["owner", "editor", "viewer"];
    const requesterId = req.user?.id;

    if (!project_id || !user_id || !validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const { data: ownerData, error: ownerError } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", project_id)
        .eq("user_id", requesterId)
        .single();

    if (ownerError || !ownerData || ownerData.role !== "owner") {
        return res.status(403).json({ message: "Only owners can add collaborators." });
    }

    const { error } = await supabase
        .from("project_collaborators")
        .insert([{ project_id, user_id, role }]);
    if (error) {
        return res.status(500).json({ message: "Error adding collaborator", error });
    }
    res.status(201).json({ message: "Collaborator added" });
};

export const removeProjectCollaborator = async (req: Request, res: Response) => {
    const { project_id, user_id } = req.body;
    const requesterId = req.user?.id;

    if (!project_id || !user_id) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const { data: ownerData, error: ownerError } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", project_id)
        .eq("user_id", requesterId)
        .single();

    if (ownerError || !ownerData || ownerData.role !== "owner") {
        return res.status(403).json({ message: "Only owners can remove collaborators." });
    }

    const { error } = await supabase
        .from("project_collaborators")
        .delete()
        .eq("project_id", project_id)
        .eq("user_id", user_id);
    if (error) {
        return res.status(500).json({ message: "Error removing collaborator", error });
    }
    res.status(200).json({ message: "Collaborator removed" });
};

export const listProjectCollaborators = async (req: Request, res: Response) => {
    const { project_id } = req.params;
    if (!project_id) {
        return res.status(400).json({ message: "Project ID required" });
    }
    const { data, error } = await supabase
        .from("project_collaborators")
        .select("user_id, role, added_at")
        .eq("project_id", project_id);
    if (error) {
        return res.status(500).json({ message: "Error fetching collaborators", error });
    }
    res.status(200).json({ collaborators: data });
};

export const updateProjectCollaboratorRole = async (req: Request, res: Response) => {
    const { project_id, user_id, role } = req.body;
    const validRoles = ["owner", "editor", "viewer"];
    const requesterId = req.user?.id;

    if (!project_id || !user_id || !validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const { data: ownerData, error: ownerError } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", project_id)
        .eq("user_id", requesterId)
        .single();

    if (ownerError || !ownerData || ownerData.role !== "owner") {
        return res.status(403).json({ message: "Only owners can update collaborator roles." });
    }

    const { error } = await supabase
        .from("project_collaborators")
        .update({ role })
        .eq("project_id", project_id)
        .eq("user_id", user_id);

    if (error) {
        return res.status(500).json({ message: "Error updating collaborator role", error });
    }
    res.status(200).json({ message: "Collaborator role updated" });
};

