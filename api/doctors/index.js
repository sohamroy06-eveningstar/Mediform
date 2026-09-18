import sql from "../../src/lib/db.js";
import { requireUser, requireAdmin } from "../_lib/serverAuth.js";

function mapDoctor(doctor) {
  return {
    id: doctor.id,

    fullName: doctor.full_name,
    specialization: doctor.specialization,
    qualification: doctor.qualification,

    experienceYears: doctor.experience_years,
    gender: doctor.gender,

    phone: doctor.phone,
    email: doctor.email,

    hospitalName: doctor.hospital_name,
    department: doctor.department,
    location: doctor.location,

    consultationFee: doctor.consultation_fee,

    languages: doctor.languages || [],

    bio: doctor.bio,

    availableDays: doctor.available_days || [],
    availableFrom: doctor.available_from,
    availableTo: doctor.available_to,

    telehealthEnabled: doctor.telehealth_enabled,

    profileImage: doctor.profile_image,

    status: doctor.status,

    createdAt: doctor.created_at,
    updatedAt: doctor.updated_at,
  };
}

export default async function handler(req, res) {
  try {
    /*
     * GET
     *
     * Any authenticated user can view
     * active doctors.
     *
     * ADMIN can view all doctors.
     */
    if (req.method === "GET") {
      const { appUser } = await requireUser(req);

      const doctors =
        appUser.role === "ADMIN"
          ? await sql`
              SELECT
                id,
                full_name,
                specialization,
                qualification,
                experience_years,
                gender,
                phone,
                email,
                hospital_name,
                department,
                location,
                consultation_fee,
                languages,
                bio,
                available_days,
                available_from,
                available_to,
                telehealth_enabled,
                profile_image,
                status,
                created_at,
                updated_at
              FROM doctors
              ORDER BY created_at DESC
            `
          : await sql`
              SELECT
                id,
                full_name,
                specialization,
                qualification,
                experience_years,
                gender,
                phone,
                email,
                hospital_name,
                department,
                location,
                consultation_fee,
                languages,
                bio,
                available_days,
                available_from,
                available_to,
                telehealth_enabled,
                profile_image,
                status,
                created_at,
                updated_at
              FROM doctors
              WHERE status = 'ACTIVE'
              ORDER BY full_name ASC
            `;

      return res.status(200).json({
        success: true,
        data: doctors.map(mapDoctor),
      });
    }

    /*
     * POST
     *
     * Only ADMIN can create doctors.
     */
    if (req.method === "POST") {
      await requireAdmin(req);

      const {
        id,
        fullName,
        specialization,
        qualification,
        experienceYears = 0,
        gender = "",
        phone = "",
        email = "",
        hospitalName = "",
        department = "",
        location = "",
        consultationFee = null,
        languages = [],
        bio = "",
        availableDays = [],
        availableFrom = "",
        availableTo = "",
        telehealthEnabled = false,
        profileImage = null,
        status = "ACTIVE",
      } = req.body || {};

      /*
       * Required fields
       */
      if (
        !id ||
        !fullName ||
        !specialization ||
        !qualification
      ) {
        return res.status(400).json({
          success: false,
          message:
            "id, fullName, specialization and qualification are required.",
        });
      }

      /*
       * Validate experience
       */
      const parsedExperience = Number(experienceYears);

      if (
        !Number.isInteger(parsedExperience) ||
        parsedExperience < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "experienceYears must be a non-negative integer.",
        });
      }

      /*
       * Validate arrays
       */
      if (!Array.isArray(languages)) {
        return res.status(400).json({
          success: false,
          message: "languages must be an array.",
        });
      }

      if (!Array.isArray(availableDays)) {
        return res.status(400).json({
          success: false,
          message:
            "availableDays must be an array.",
        });
      }

      /*
       * Validate status
       */
      if (!["ACTIVE", "INACTIVE"].includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "status must be ACTIVE or INACTIVE.",
        });
      }

      /*
       * Validate consultation fee
       */
      let parsedFee = null;

      if (
        consultationFee !== null &&
        consultationFee !== ""
      ) {
        parsedFee = Number(consultationFee);

        if (
          Number.isNaN(parsedFee) ||
          parsedFee < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "consultationFee must be a valid non-negative number.",
          });
        }
      }

      /*
       * Insert doctor
       */
      const doctors = await sql`
        INSERT INTO doctors (
          id,
          full_name,
          specialization,
          qualification,
          experience_years,
          gender,
          phone,
          email,
          hospital_name,
          department,
          location,
          consultation_fee,
          languages,
          bio,
          available_days,
          available_from,
          available_to,
          telehealth_enabled,
          profile_image,
          status
        )
        VALUES (
          ${id},
          ${fullName.trim()},
          ${specialization.trim()},
          ${qualification.trim()},
          ${parsedExperience},
          ${gender.trim()},
          ${phone.trim()},
          ${email.trim()},
          ${hospitalName.trim()},
          ${department.trim()},
          ${location.trim()},
          ${parsedFee},
          ${JSON.stringify(languages)}::jsonb,
          ${bio.trim()},
          ${JSON.stringify(availableDays)}::jsonb,
          ${availableFrom},
          ${availableTo},
          ${Boolean(telehealthEnabled)},
          ${
            profileImage
              ? JSON.stringify(profileImage)
              : null
          }::jsonb,
          ${status}
        )
        RETURNING
          id,
          full_name,
          specialization,
          qualification,
          experience_years,
          gender,
          phone,
          email,
          hospital_name,
          department,
          location,
          consultation_fee,
          languages,
          bio,
          available_days,
          available_from,
          available_to,
          telehealth_enabled,
          profile_image,
          status,
          created_at,
          updated_at
      `;

      return res.status(201).json({
        success: true,
        data: mapDoctor(doctors[0]),
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Doctors API error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Doctor with this ID already exists.",
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 401 || error.status === 403
          ? error.message
          : "Failed to process doctor request.",
    });
  }
}