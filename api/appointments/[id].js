import sql from "../../src/lib/db.js";
import { requireUser } from "../_lib/serverAuth.js";

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

    telehealthEnabled:
      appointment.telehealth_enabled || false,

    telehealthUrl:
      appointment.telehealth_url || "",

    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at,
  };
}

async function getAppointmentById(
  id,
  appUser,
) {
  const isAdmin =
    appUser.role === "ADMIN";

  const appointments = isAdmin
    ? await sql`
        SELECT
          appointments.id,
          appointments.patient_name,
          appointments.doctor_name,

          TO_CHAR(
            appointments.appointment_date,
            'YYYY-MM-DD'
          ) AS appointment_date,

          appointments.appointment_time,
          appointments.reason,
          appointments.notes,
          appointments.media_urls,
          appointments.created_at,
          appointments.updated_at,

          doctors.telehealth_enabled,
          doctors.telehealth_url

        FROM appointments

        LEFT JOIN doctors
          ON doctors.full_name =
             appointments.doctor_name

        WHERE appointments.id = ${id}
      `
    : await sql`
        SELECT
          appointments.id,
          appointments.patient_name,
          appointments.doctor_name,

          TO_CHAR(
            appointments.appointment_date,
            'YYYY-MM-DD'
          ) AS appointment_date,

          appointments.appointment_time,
          appointments.reason,
          appointments.notes,
          appointments.media_urls,
          appointments.created_at,
          appointments.updated_at,

          doctors.telehealth_enabled,
          doctors.telehealth_url

        FROM appointments

        LEFT JOIN doctors
          ON doctors.full_name =
             appointments.doctor_name

        WHERE appointments.id = ${id}
          AND appointments.user_id = ${appUser.auth_user_id}
      `;

  return appointments;
}

export default async function handler(
  req,
  res,
) {
  const { id } = req.query;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "Appointment ID is required.",
      });
    }

    /*
     * Verify authentication
     */
    const { appUser } =
      await requireUser(req);

    const isAdmin =
      appUser.role === "ADMIN";

    /*
     * =========================
     * GET APPOINTMENT
     * =========================
     */
    if (req.method === "GET") {
      const appointments =
        await getAppointmentById(
          id,
          appUser,
        );

      if (appointments.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: mapAppointment(
          appointments[0],
        ),
      });
    }

    /*
     * =========================
     * UPDATE APPOINTMENT
     * =========================
     */
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

      if (
        !patientName ||
        !doctorName ||
        !date ||
        !time ||
        !reason
      ) {
        return res.status(400).json({
          success: false,
          message:
            "patientName, doctorName, date, time and reason are required.",
        });
      }

      if (!Array.isArray(mediaUrls)) {
        return res.status(400).json({
          success: false,
          message:
            "mediaUrls must be an array.",
        });
      }

      /*
       * Update only the appointment
       * owned by the current user,
       * unless the user is ADMIN.
       */
      const updatedRows = isAdmin
        ? await sql`
            UPDATE appointments
            SET
              patient_name =
                ${patientName.trim()},

              doctor_name =
                ${doctorName.trim()},

              appointment_date =
                ${date},

              appointment_time =
                ${time},

              reason =
                ${reason.trim()},

              notes =
                ${notes.trim()},

              media_urls =
                ${JSON.stringify(
                  mediaUrls,
                )}::jsonb,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = ${id}

            RETURNING id
          `
        : await sql`
            UPDATE appointments
            SET
              patient_name =
                ${patientName.trim()},

              doctor_name =
                ${doctorName.trim()},

              appointment_date =
                ${date},

              appointment_time =
                ${time},

              reason =
                ${reason.trim()},

              notes =
                ${notes.trim()},

              media_urls =
                ${JSON.stringify(
                  mediaUrls,
                )}::jsonb,

              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = ${id}
              AND user_id =
                ${appUser.auth_user_id}

            RETURNING id
          `;

      if (updatedRows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found.",
        });
      }

      /*
       * Fetch the updated appointment
       * again with doctor telehealth data.
       */
      const appointments =
        await getAppointmentById(
          id,
          appUser,
        );

      return res.status(200).json({
        success: true,
        data: mapAppointment(
          appointments[0],
        ),
      });
    }

    /*
     * =========================
     * DELETE APPOINTMENT
     * =========================
     */
    if (req.method === "DELETE") {
      const appointments = isAdmin
        ? await sql`
            DELETE FROM appointments
            WHERE id = ${id}
            RETURNING id
          `
        : await sql`
            DELETE FROM appointments
            WHERE id = ${id}
              AND user_id =
                ${appUser.auth_user_id}
            RETURNING id
          `;

      if (appointments.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Appointment deleted successfully.",
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
    console.error(
      "Appointment API error:",
      error,
    );

    return res.status(
      error.status || 500,
    ).json({
      success: false,
      message:
        error.status === 401 ||
        error.status === 403
          ? error.message
          : "Failed to process appointment request.",
    });
  }
}