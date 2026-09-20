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

function getExtension(filename) {
  const lastDot =
    filename.lastIndexOf(".");

  if (
    lastDot === -1 ||
    lastDot === filename.length - 1
  ) {
    return "";
  }

  return filename
    .slice(lastDot + 1)
    .toLowerCase();
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
     DOCTOR PROFILE IMAGE
     ADMIN ONLY
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
     APPOINTMENT OWNER OR ADMIN
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
       REQUEST BODY
    ===================================================== */

    const {
      resourceId,
      folder = "medical",
      fileName,
      contentType,
      size,
    } = req.body || {};

    /* =====================================================
       BASIC VALIDATION
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
       AUTHENTICATION
    ===================================================== */

    const { appUser } =
      await requireUser(req);

    /* =====================================================
       CREATE UNIQUE PATHNAME
    ===================================================== */

    const safeName =
      sanitizeFilename(fileName);

    const extension =
      getExtension(safeName);

    const uniqueId =
      crypto.randomUUID();

    const timestamp =
      Date.now();

    const pathname =
      `${folder}/${resourceId}/${timestamp}-${uniqueId}-${safeName}`;

    if (!extension) {
      console.warn(
        "Upload filename has no extension:",
        fileName,
      );
    }

    /* =====================================================
       AUTHORIZATION
    ===================================================== */

    await authorizeUpload(
      pathname,
      appUser,
    );

    /* =====================================================
       BLOB CREDENTIAL
    ===================================================== */

    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN is missing in the Vercel environment.",
      );
    }

    /* =====================================================
       ISSUE SIGNED TOKEN
       
       IMPORTANT:
       Explicit token is passed here.
    ===================================================== */

    const signedToken =
      await issueSignedToken({
        token: blobToken,

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

    /* =====================================================
       CREATE PRESIGNED PUT URL
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
       SUCCESS
    ===================================================== */

    return res.status(200).json({
      success: true,

      data: {
        presignedUrl,

        /*
         * Exact pathname that will be
         * stored in Blob.
         */
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