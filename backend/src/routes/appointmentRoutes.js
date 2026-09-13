import express from "express";

import {
  getAppointments,
  getAppointment,
createNewAppointment,
 updateExistingAppointment,
  deleteExistingAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

router.get("/", getAppointments);
router.get("/:id", getAppointment);
router.post("/", createNewAppointment);
router.put("/:id", updateExistingAppointment);
router.delete("/:id", deleteExistingAppointment);

export default router;