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
  const lastDot = filename.lastIndexOf(".");

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

  /*
   * Doctor profile image
   * ADMIN only.
   */
  if (folder === "doctors") {
    if (appUser.role !== "ADMIN") {
      throw new Error(
        "Only administrators can upload doctor profile images.",
      );
    }

    return;
  }

  /*
   * Medical document
   * Appointment owner OR ADMIN.
   */
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
    /*
     * Vercel Pages-style API handler:
     * req.body is already parsed.
     */
    const {
      resourceId,
      folder = "medical",
      fileName,
      contentType,
      size,
    } = req.body || {};

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

    if (!Number.isFinite(Number(size))) {
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

    if (fileSize > MAX_FILE_SIZE) {
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

    const {appUser} =
      await requireUser(req);

    /*
     * Generate a unique pathname OURSELVES.
     *
     * We are NOT using Vercel's random suffix.
     * Therefore the pathname returned here is
     * exactly the pathname that will exist in Blob.
     */
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

    /*
     * Remove an unnecessary extension duplication
     * only if filename handling changes later.
     */
    if (!extension) {
      console.warn(
        "Upload filename has no extension:",
        fileName,
      );
    }

    await authorizeUpload(
      pathname,
      appUser,
    );

    /*
     * Create a scoped signed PUT token.
     */
    const token =
      await issueSignedToken({
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

    /*
     * Generate the actual presigned PUT URL.
     */
const {
  presignedUrl,
} = await presignUrl(
  token,
  {
    pathname,

    operation: "put",

    validUntil:
      Date.now() +
      15 * 60 * 1000,

    contentType,

    access: "private",

    // IMPORTANT:
    // Do not let Vercel add another suffix.
    addRandomSuffix: false,
  },
);

    return res.status(200).json({
      success: true,

      data: {
        presignedUrl,

        /*
         * THIS is the exact Blob pathname.
         * Save this value to Neon.
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