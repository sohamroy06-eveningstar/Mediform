import express from "express";
import upload from "../config/upload.js";
import { uploadMedia } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", upload.single("file"), uploadMedia);

export default router;