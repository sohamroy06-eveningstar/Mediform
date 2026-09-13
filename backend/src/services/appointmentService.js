import pool from "../db/db.js";

export async function getAllAppointments() {
  const result = await pool.query(`
    SELECT
      id,
      patient_name,
      doctor_name,
      appointment_date,
      appointment_time,
      reason,
      notes,
      media_urls,
      created_at,
      updated_at
    FROM appointments
    ORDER BY appointment_date DESC
  `);

  return result.rows;
}

export async function getAppointmentById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        patient_name,
        doctor_name,
        appointment_date,
        appointment_time,
        reason,
        notes,
        media_urls,
        created_at,
        updated_at
      FROM appointments
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0];
}


export async function createAppointment(appointment) {
  const {
    id,
    patientName,
    doctorName,
    date,
    time,
    reason,
    notes = null,
    mediaUrls = [],
  } = appointment;

  const result = await pool.query(
    `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING
        id,
        patient_name,
        doctor_name,
        appointment_date,
        appointment_time,
        reason,
        notes,
        media_urls,
        created_at,
        updated_at
    `,
    [
      id,
      patientName,
      doctorName,
      date,
      time,
      reason,
      notes,
      JSON.stringify(mediaUrls),
    ],
  );

  return result.rows[0];
}

export async function updateAppointment(id, appointment) {
  const {
    patientName,
    doctorName,
    date,
    time,
    reason,
    notes = null,
    mediaUrls = [],
  } = appointment;

  const result = await pool.query(
    `
      UPDATE appointments
      SET
        patient_name = $1,
        doctor_name = $2,
        appointment_date = $3,
        appointment_time = $4,
        reason = $5,
        notes = $6,
        media_urls = $7::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING
        id,
        patient_name,
        doctor_name,
        appointment_date,
        appointment_time,
        reason,
        notes,
        media_urls,
        created_at,
        updated_at
    `,
    [
      patientName,
      doctorName,
      date,
      time,
      reason,
      notes,
      JSON.stringify(mediaUrls),
      id,
    ],
  );

  return result.rows[0];
}

export async function deleteAppointment(id) {
  const result = await pool.query(
    `
      DELETE FROM appointments
      WHERE id = $1
      RETURNING id
    `,
    [id],
  );

  return result.rows[0];
}