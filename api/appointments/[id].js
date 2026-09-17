import sql from "../../src/lib/db.js";

function mapAppointment(appointment) {
  return {
    id: appointment.id,
    patientName: appointment.patient_name,
    doctorName: appointment.doctor_name,
    date: appointment.appointment_date,
    time: appointment.appointment_time,
    reason: appointment.reason,
    notes: appointment.notes,
    mediaUrls: appointment.media_urls,
    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at,
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === "GET") {
      const appointments = await sql`
        SELECT
          id,
          patient_name,
          doctor_name,
          TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
          appointment_time,
          reason,
          notes,
          media_urls,
          created_at,
          updated_at
        FROM appointments
        WHERE id = ${id}
      `;

      if (appointments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: mapAppointment(appointments[0]),
      });
    }

    if (req.method === "PUT") {
      const {
        patientName,
        doctorName,
        date,
        time,
        reason,
        notes = "",
        mediaUrls = [],
      } = req.body || {};

      if (!patientName || !doctorName || !date || !time || !reason) {
        return res.status(400).json({
          success: false,
          message:
            "patientName, doctorName, date, time and reason are required.",
        });
      }

      const appointments = await sql`
        UPDATE appointments
        SET
          patient_name = ${patientName},
          doctor_name = ${doctorName},
          appointment_date = ${date},
          appointment_time = ${time},
          reason = ${reason},
          notes = ${notes},
          media_urls = ${JSON.stringify(mediaUrls)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING
          id,
          patient_name,
          doctor_name,
          TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
          appointment_time,
          reason,
          notes,
          media_urls,
          created_at,
          updated_at
      `;

      if (appointments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: mapAppointment(appointments[0]),
      });
    }

    if (req.method === "DELETE") {
      const appointments = await sql`
        DELETE FROM appointments
        WHERE id = ${id}
        RETURNING id
      `;

      if (appointments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Appointment deleted successfully.",
        data: {
          id: appointments[0].id,
        },
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Appointment API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process appointment request.",
    });
  }
}