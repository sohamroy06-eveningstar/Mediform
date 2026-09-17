import {
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const { pathname } = req.query;

    if (!pathname || typeof pathname !== "string") {
      return res.status(400).json({
        success: false,
        message: "pathname is required.",
      });
    }

    const token = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil: Date.now() + 5 * 60 * 1000,
    });

    const { presignedUrl } = await presignUrl(token, {
      pathname,
      operation: "get",
      access: "private",
      validUntil: Date.now() + 5 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: {
        url: presignedUrl,
      },
    });
  } catch (error) {
    console.error("Blob signed GET error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate media URL.",
    });
  }
}