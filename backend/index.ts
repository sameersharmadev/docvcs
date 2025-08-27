import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";

import authRoutes from "./routes/authRoutes.ts";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("NoteVCS backend is up and running"));
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
