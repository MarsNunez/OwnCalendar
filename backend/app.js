import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import projectsRouter from "./routes/projects.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/projects", projectsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

export default app;
