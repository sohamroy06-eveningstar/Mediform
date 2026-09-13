import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db/db.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import path from "path";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.resolve("uploads")),
);

app.use("/api/uploads", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mediform API is running",
  });
});

app.use("/api/appointments", appointmentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Mediform API running on port ${PORT}`);
});
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.status(200).json({
      success: true,
      message: "PostgreSQL connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "PostgreSQL connection failed",
    });
  }
});