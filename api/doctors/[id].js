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

function validateDoctorBody(body) {
  const {
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
  } = body || {};

  if (
    !fullName ||
    !specialization ||
    !qualification
  ) {
    return {
      valid: false,
      message:
        "fullName, specialization and qualification are required.",
    };
  }

  const parsedExperience = Number(experienceYears);

  if (
    !Number.isInteger(parsedExperience) ||
    parsedExperience < 0
  ) {
    return {
      valid: false,
      message:
        "experienceYears must be a non-negative integer.",
    };
  }

  if (!Array.isArray(languages)) {
    return {
      valid: false,
      message: "languages must be an array.",
    };
  }

  if (!Array.isArray(availableDays)) {
    return {
      valid: false,
      message:
        "availableDays must be an array.",
    };
  }

  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    return {
      valid: false,
      message:
        "status must be ACTIVE or INACTIVE.",
    };
  }

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
      return {
        valid: false,
        message:
          "consultationFee must be a valid non-negative number.",
      };
    }
  }

  return {
    valid: true,
    data: {
      fullName: fullName.trim(),
      specialization: specialization.trim(),
      qualification: qualification.trim(),

      experienceYears: parsedExperience,
      gender: String(gender).trim(),

      phone: String(phone).trim(),
      email: String(email).trim(),

      hospitalName: String(hospitalName).trim(),
      department: String(department).trim(),
      location: String(location).trim(),

      consultationFee: parsedFee,

      languages,
      bio: String(bio).trim(),

      availableDays,
      availableFrom,
      availableTo,

      telehealthEnabled: Boolean(
        telehealthEnabled,
      ),

      profileImage,
      status,
    },
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required.",
      });
    }

    /*
     * GET
     *
     * Authenticated users can view a doctor.
     * PATIENT -> only ACTIVE doctors
     * ADMIN   -> ACTIVE + INACTIVE doctors
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
              WHERE id = ${id}
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
              WHERE id = ${id}
                AND status = 'ACTIVE'
            `;

      if (doctors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: mapDoctor(doctors[0]),
      });
    }

    /*
     * PUT
     *
     * Only ADMIN can edit a doctor.
     */
    if (req.method === "PUT") {
      await requireAdmin(req);

      const validation =
        validateDoctorBody(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      const doctor = validation.data;

      const doctors = await sql`
        UPDATE doctors
        SET
          full_name = ${doctor.fullName},
          specialization = ${doctor.specialization},
          qualification = ${doctor.qualification},
          experience_years = ${doctor.experienceYears},
          gender = ${doctor.gender},
          phone = ${doctor.phone},
          email = ${doctor.email},
          hospital_name = ${doctor.hospitalName},
          department = ${doctor.department},
          location = ${doctor.location},
          consultation_fee = ${doctor.consultationFee},
          languages = ${JSON.stringify(
            doctor.languages,
          )}::jsonb,
          bio = ${doctor.bio},
          available_days = ${JSON.stringify(
            doctor.availableDays,
          )}::jsonb,
          available_from = ${doctor.availableFrom},
          available_to = ${doctor.availableTo},
          telehealth_enabled = ${doctor.telehealthEnabled},
          profile_image = ${
            doctor.profileImage
              ? JSON.stringify(
                  doctor.profileImage,
                )
              : null
          }::jsonb,
          status = ${doctor.status},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
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

      if (doctors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: mapDoctor(doctors[0]),
      });
    }

    /*
     * DELETE
     *
     * Only ADMIN can delete a doctor.
     */
    if (req.method === "DELETE") {
      await requireAdmin(req);

      const doctors = await sql`
        DELETE FROM doctors
        WHERE id = ${id}
        RETURNING id
      `;

      if (doctors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Doctor deleted successfully.",
        data: {
          id: doctors[0].id,
        },
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Doctor API error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 401 ||
        error.status === 403
          ? error.message
          : "Failed to process doctor request.",
    });
  }
}