import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";

import authRoutes from "./routes/authRoutes.ts";
import projectRoutes from "./routes/projectRoutes.ts"
import collabRoutes from "./routes/collabRoutes.ts"
import userRoutes from "./routes/userRoutes.ts"

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("DocVCS backend is up and running"));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/collaborators", collabRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
