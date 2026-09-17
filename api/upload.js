import {
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const {
      pathname,
      contentType,
      size,
    } = req.body || {};

    if (!pathname || !contentType || !size) {
      return res.status(400).json({
        success: false,
        message: "pathname, contentType and size are required.",
      });
    }

    if (!ACCEPTED_TYPES.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type.",
      });
    }

    if (size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: "File size must be 5MB or less.",
      });
    }

    const token = await issueSignedToken({
      pathname,
      operations: ["put"],
      validUntil: Date.now() + 15 * 60 * 1000,
      allowedContentTypes: [contentType],
      maximumSizeInBytes: MAX_FILE_SIZE,
    });

    const { presignedUrl } = await presignUrl(token, {
      pathname,
      operation: "put",
      validUntil: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    return res.status(200).json({
      success: true,
      data: {
        presignedUrl,
        pathname,
        contentType,
      },
    });
  } catch (error) {
    console.error("Blob signed upload error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create upload URL.",
    });
  }
}