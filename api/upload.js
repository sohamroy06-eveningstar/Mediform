import crypto from "node:crypto";

import {
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";

import { requireUser } from "./_lib/serverAuth.js";
import sql from "../src/lib/db.js";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* =========================================================
   HELPERS
========================================================= */

function isValidFilename(filename) {
  return (
    typeof filename === "string" &&
    filename.trim().length > 0
  );
}

function sanitizeFilename(filename) {
  return filename
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

/* =========================================================
   AUTHORIZE UPLOAD
========================================================= */

async function authorizeUpload(
  pathname,
  appUser,
) {
  const parts = pathname.split("/");

  if (parts.length < 3) {
    throw new Error(
      "Invalid upload pathname.",
    );
  }

  const folder = parts[0];
  const resourceId = parts[1];

  /* =======================================================
     DOCTOR IMAGE
  ======================================================= */

  if (folder === "doctors") {
    if (appUser.role !== "ADMIN") {
      throw new Error(
        "Only administrators can upload doctor profile images.",
      );
    }

    return;
  }

  /* =======================================================
     MEDICAL DOCUMENT
  ======================================================= */

  if (folder === "medical") {
    const rows = await sql`
      SELECT user_id
      FROM appointments
      WHERE id = ${resourceId}
      LIMIT 1
    `;

    if (!rows.length) {
      throw new Error(
        "Appointment not found.",
      );
    }

    if (appUser.role === "ADMIN") {
      return;
    }

    if (
      rows[0].user_id !==
      appUser.auth_user_id
    ) {
      throw new Error(
        "You are not allowed to upload this medical file.",
      );
    }

    return;
  }

  throw new Error(
    "Invalid upload folder.",
  );
}

/* =========================================================
   HANDLER
========================================================= */

export default async function handler(
  req,
  res,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    /* =====================================================
       BODY
    ===================================================== */

    const {
      resourceId,
      folder = "medical",
      fileName,
      contentType,
      size,
    } = req.body || {};

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message:
          "resourceId is required.",
      });
    }

    if (!isValidFilename(fileName)) {
      return res.status(400).json({
        success: false,
        message:
          "fileName is required.",
      });
    }

    if (!contentType) {
      return res.status(400).json({
        success: false,
        message:
          "contentType is required.",
      });
    }

    if (
      !Number.isFinite(Number(size))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "File size is required.",
      });
    }

    const fileSize = Number(size);

    if (fileSize <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "File size must be greater than 0.",
      });
    }

    if (
      fileSize > MAX_FILE_SIZE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "File size must be 5MB or less.",
      });
    }

    if (
      !ACCEPTED_TYPES.includes(
        contentType,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported file type.",
      });
    }

    if (
      !["doctors", "medical"].includes(
        folder,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid upload folder.",
      });
    }

    /* =====================================================
       AUTHENTICATE USER
    ===================================================== */

    const { appUser } =
      await requireUser(req);

    /* =====================================================
       PATHNAME
    ===================================================== */

    const safeName =
      sanitizeFilename(fileName);

    const pathname =
      `${folder}/${resourceId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    /* =====================================================
       AUTHORIZATION
    ===================================================== */

    await authorizeUpload(
      pathname,
      appUser,
    );

    /* =====================================================
       VERCEL BLOB AUTH
       
       PRIMARY:
       OIDC + storeId
       
       FALLBACK:
       BLOB_READ_WRITE_TOKEN
    ===================================================== */

    const oidcToken =
      process.env.VERCEL_OIDC_TOKEN;

    const storeId =
      process.env.BLOB_1_STORE_ID ||
      process.env.BLOB_STORE_ID;

    const readWriteToken =
      process.env.BLOB_READ_WRITE_TOKEN;

    let signedToken;

    /* =====================================================
       OIDC
    ===================================================== */

    if (oidcToken && storeId) {
      console.log(
        "[Blob] Using Vercel OIDC authentication",
      );

      signedToken =
        await issueSignedToken({
          oidcToken,

          storeId,

          pathname,

          operations: ["put"],

          validUntil:
            Date.now() +
            15 * 60 * 1000,

          allowedContentTypes: [
            contentType,
          ],

          maximumSizeInBytes:
            MAX_FILE_SIZE,
        });
    }

    /* =====================================================
       STATIC TOKEN FALLBACK
    ===================================================== */

    else if (readWriteToken) {
      console.log(
        "[Blob] Using BLOB_READ_WRITE_TOKEN",
      );

      signedToken =
        await issueSignedToken({
          token:
            readWriteToken,

          pathname,

          operations: ["put"],

          validUntil:
            Date.now() +
            15 * 60 * 1000,

          allowedContentTypes: [
            contentType,
          ],

          maximumSizeInBytes:
            MAX_FILE_SIZE,
        });
    }

    /* =====================================================
       NO CREDENTIAL
    ===================================================== */

    else {
      throw new Error(
        "Vercel Blob credentials are missing. Configure Vercel OIDC with BLOB_1_STORE_ID or set BLOB_READ_WRITE_TOKEN.",
      );
    }

    /* =====================================================
       PRESIGNED URL
    ===================================================== */

    const {
      presignedUrl,
    } = await presignUrl(
      signedToken,
      {
        pathname,

        operation: "put",

        validUntil:
          Date.now() +
          15 * 60 * 1000,

        allowedContentTypes: [
          contentType,
        ],

        maximumSizeInBytes:
          MAX_FILE_SIZE,

        access: "private",
      },
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,

      data: {
        presignedUrl,

        pathname,

        name: fileName,

        contentType,

        size: fileSize,
      },
    });
  } catch (error) {
    console.error(
      "Blob signed upload error:",
      error,
    );

    return res.status(400).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Failed to create upload URL.",
    });
  }
}