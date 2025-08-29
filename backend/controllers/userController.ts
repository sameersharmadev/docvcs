import type { Request, Response } from "express";
import supabase from '../config/supabase.ts';
export const me = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const getUserByUsername = async (req: Request, res: Response) => {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }
    const {data: user, error} = await supabase
        .from('users')
        .select('user_id, username, user_avatar, bio, created_at, last_login')
        .eq('username', username)
        .single();
    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
    res.json(user);
};

export const updateProfile = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { username, bio, user_avatar } = req.body;
    const { data, error } = await supabase
        .from('users')
        .update({ username, bio, user_avatar })
        .eq('user_id', user.id);
    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
    res.json(data);
}

export const getUserProjects = async (req: Request, res: Response) => {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }
    const {data: user, error: userError} = await supabase
        .from('users')
        .select('user_id')
        .eq('username', username)
        .single();
    if (userError) {
        console.error(userError);
        return res.status(500).json({ message: 'Internal server error' });
    }
    const { data: projects, error } = await supabase
        .from('projects')
        .select('project_id, name, description, is_public, created_at')
        .eq('owner_id', user.user_id)
        .eq('is_public', true);
    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
    res.json(projects);
}