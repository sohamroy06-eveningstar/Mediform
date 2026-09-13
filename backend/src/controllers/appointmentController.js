import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from "../services/appointmentService.js";
import { mapAppointment } from "../services/appointmentMapper.js";

export async function getAppointments(req, res) {
  try {
    const appointments = await getAllAppointments();

    res.status(200).json({
      success: true,
      data: appointments.map(mapAppointment),
    });
  } catch (error) {
    console.error("Get appointments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments.",
    });
  }
}

export async function getAppointment(req, res) {
  try {
    const { id } = req.params;

    const appointment = await getAppointmentById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    res.status(200).json({
      success: true,
     data: mapAppointment(appointment),
    });
  } catch (error) {
    console.error("Get appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment.",
    });
  }
}

export async function createNewAppointment(req, res) {
  try {
    const appointment = await createAppointment(req.body);

    res.status(201).json({
      success: true,
      message: "Appointment created successfully.",
      data: mapAppointment(appointment),
    });
  } catch (error) {
    console.error("Create appointment error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Appointment ID already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create appointment.",
    });
  }
}

export async function updateExistingAppointment(req, res) {
  try {
    const { id } = req.params;

    const appointment = await updateAppointment(id, req.body);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully.",
   data: mapAppointment(appointment),
    });
  } catch (error) {
    console.error("Update appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update appointment.",
    });
  }
}

export async function deleteExistingAppointment(req, res) {
  try {
    const { id } = req.params;

    const appointment = await deleteAppointment(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully.",
    data: mapAppointment(appointment),
    });
  } catch (error) {
    console.error("Delete appointment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete appointment.",
    });
  }
}