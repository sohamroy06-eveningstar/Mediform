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
ORDER BY appointment_date DESC
      `;

      return res.status(200).json({
        success: true,
        data: appointments.map(mapAppointment),
      });
    }

    if (req.method === "POST") {
      const {
        id,
        patientName,
        doctorName,
        date,
        time,
        reason,
        notes = "",
        mediaUrls = [],
      } = req.body || {};

      if (!id || !patientName || !doctorName || !date || !time || !reason) {
        return res.status(400).json({
          success: false,
          message:
            "id, patientName, doctorName, date, time and reason are required.",
        });
      }

      const appointments = await sql`
        INSERT INTO appointments (
          id,
          patient_name,
          doctor_name,
          appointment_date,
          appointment_time,
          reason,
          notes,
          media_urls
        )
        VALUES (
          ${id},
          ${patientName},
          ${doctorName},
          ${date},
          ${time},
          ${reason},
          ${notes},
          ${JSON.stringify(mediaUrls)}::jsonb
        )
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

      return res.status(201).json({
        success: true,
        data: mapAppointment(appointments[0]),
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Appointment API error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Appointment with this ID already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to process appointment request.",
    });
  }
}
