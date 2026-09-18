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

async function getAppointmentsForUser(
  authUserId,
) {
  return sql`
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
      ON LOWER(TRIM(doctors.full_name))
       = LOWER(TRIM(appointments.doctor_name))

    WHERE appointments.user_id =
      ${authUserId}

    ORDER BY
      appointments.appointment_date DESC,
      appointments.created_at DESC
  `;
}

async function getAllAppointments() {
  return sql`
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
      ON LOWER(TRIM(doctors.full_name))
       = LOWER(TRIM(appointments.doctor_name))

    ORDER BY
      appointments.appointment_date DESC,
      appointments.created_at DESC
  `;
}

export default async function handler(
  req,
  res,
) {
  try {
    /*
     * Every appointment request requires
     * an authenticated Supabase user.
     */
    const { appUser } =
      await requireUser(req);

    /*
     * =========================
     * GET
     * =========================
     *
     * Normal Dashboard:
     *   only current user's appointments
     *
     * Admin Panel:
     *   /api/appointments?scope=all
     *   returns all appointments
     */
    if (req.method === "GET") {
      const scope =
        req.query?.scope;

      let appointments;

      if (scope === "all") {
        /*
         * Only ADMIN can request
         * all appointments.
         */
        if (appUser.role !== "ADMIN") {
          return res.status(403).json({
            success: false,
            message:
              "Admin access required.",
          });
        }

        appointments =
          await getAllAppointments();
      } else {
        /*
         * IMPORTANT:
         * Even ADMIN users get only their
         * own appointments on the normal
         * dashboard.
         */
        appointments =
          await getAppointmentsForUser(
            appUser.auth_user_id,
          );
      }

      return res.status(200).json({
        success: true,
        data: appointments.map(
          mapAppointment,
        ),
      });
    }

    /*
     * =========================
     * POST
     * =========================
     *
     * Create appointment for the
     * currently authenticated user.
     *
     * user_id is NEVER taken from
     * req.body.
     */
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

      if (
        !id ||
        !patientName ||
        !doctorName ||
        !date ||
        !time ||
        !reason
      ) {
        return res.status(400).json({
          success: false,
          message:
            "id, patientName, doctorName, date, time and reason are required.",
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
       * Verify the selected doctor exists
       * and is ACTIVE.
       *
       * We use the doctor's canonical name
       * from the database for the appointment.
       */
      const doctors = await sql`
        SELECT
          id,
          full_name,
          telehealth_enabled,
          telehealth_url,
          status

        FROM doctors

        WHERE LOWER(TRIM(full_name))
          = LOWER(TRIM(${doctorName}))

        LIMIT 1
      `;

      if (doctors.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Selected doctor was not found.",
        });
      }

      const doctor = doctors[0];

      if (doctor.status !== "ACTIVE") {
        return res.status(400).json({
          success: false,
          message:
            "Selected doctor is currently inactive.",
        });
      }

      /*
       * Insert appointment.
       *
       * user_id comes from the verified
       * Supabase user, not from the client.
       */
      const appointments = await sql`
        INSERT INTO appointments (
          id,
          user_id,
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
          ${appUser.auth_user_id},
          ${patientName.trim()},
          ${doctor.full_name},
          ${date},
          ${time},
          ${reason.trim()},
          ${notes.trim()},
          ${JSON.stringify(
            mediaUrls,
          )}::jsonb
        )

        RETURNING
          id,
          patient_name,
          doctor_name,

          TO_CHAR(
            appointment_date,
            'YYYY-MM-DD'
          ) AS appointment_date,

          appointment_time,
          reason,
          notes,
          media_urls,
          created_at,
          updated_at
      `;

      /*
       * Re-fetch with doctor information
       * so the response contains telehealth data.
       */
      const createdAppointment =
        await sql`
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
            ON LOWER(TRIM(doctors.full_name))
             = LOWER(TRIM(appointments.doctor_name))

          WHERE appointments.id =
            ${appointments[0].id}

          LIMIT 1
        `;

      return res.status(201).json({
        success: true,
        data: mapAppointment(
          createdAppointment[0],
        ),
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

    /*
     * Duplicate appointment ID
     */
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Appointment with this ID already exists.",
      });
    }

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