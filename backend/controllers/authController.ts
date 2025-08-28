import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.ts";
import mailer from "../config/mailer.ts";

const JWT_SECRET = process.env.JWT_SECRET as string;
const EMAIL_SECRET = process.env.EMAIL_SECRET as string;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const { data: users, error } = await supabase
        .from("users")
        .select("user_id, username, email, password_hash, user_avatar, bio, role, is_verified, created_at")
        .eq("email", email)
        .limit(1);

    if (error || !users || users.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.is_verified) {
        return res.status(403).json({ message: "Account not verified. Please verify your email." });
    }

    const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token",token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60*60*1000
    })
    res.json({message: "Login successful"})

}

export const register = async (req: Request, res: Response) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ message: "Email, username, and password are required" });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character." });
    }

    const { data: existingUsers, error: fetchError } = await supabase
        .from("users")
        .select("user_id")
        .or(`email.eq.${email},username.eq.${username}`)
        .limit(1);

    if (fetchError) {
        return res.status(500).json({ message: "Error checking for existing users" });
    }

    if (existingUsers && existingUsers.length > 0) {
        return res.status(409).json({ message: "Email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
            {
                email,
                password_hash: hashedPassword,
                username,
                is_verified: false,
            }
        ])
        .select("user_id, email")
        .single();

    if (insertError) {
        return res.status(500).json({ message: "Error creating user" });
    }

    const emailToken = jwt.sign(
        { id: newUser.user_id, email: newUser.email },
        EMAIL_SECRET,
        { expiresIn: "24h" }
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;
    try {
        await mailer.sendMail({
            from: process.env.EMAIL_USER,
            to: newUser.email,
            subject: "DocVCS: Verify your email",
            html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`
        });
    } catch (error) {
        console.error("Error sending email:", error);
    }

    res.status(201).json({ message: "User registered successfully. Please verify your email." });
}
export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") return res.status(400).json({ message: "Invalid token" });
    try {
        const decoded = jwt.verify(token, EMAIL_SECRET) as { id: string; email: string };
        const userId = decoded.id;

        const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ is_verified: true })
            .eq("user_id", userId)
            .select("user_id, role")
            .single();

        if (updateError) return res.status(500).json({ message: "Error verifying user" });

        const authToken = jwt.sign({ id: updatedUser.user_id, role: updatedUser.role }, JWT_SECRET, {
            expiresIn: "1h",
        });

        res.cookie("token",authToken,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60*60*1000
        })
        res.json({ message: "Email verified successfully!" });
    } catch (err) {
        res.status(400).json({ message: "Invalid or expired token" });
    }
}