import { Readable } from "node:stream";
import { get } from "@vercel/blob";

import sql from "../../src/lib/db.js";
import { requireUser } from "../_lib/serverAuth.js";

function isValidPathname(pathname) {
  if (!pathname) {
    return false;
  }

  if (
    pathname.includes("..") ||
    pathname.includes("\\") ||
    pathname.startsWith("/")
  ) {
    return false;
  }

  return (
    pathname.startsWith("doctors/") ||
    pathname.startsWith("medical/")
  );
}

function getAppointmentIdFromPath(
  pathname,
) {
  const parts = pathname.split("/");

  if (
    parts.length < 3 ||
    parts[0] !== "medical"
  ) {
    return null;
  }

  return parts[1];
}

async function canAccessMedia(
  pathname,
  appUser,
) {
  /*
   * Doctor profile images:
   * authenticated users may view them.
   */
  if (pathname.startsWith("doctors/")) {
    return true;
  }

  /*
   * Medical media:
   * admin OR appointment owner only.
   */
  if (pathname.startsWith("medical/")) {
    const appointmentId =
      getAppointmentIdFromPath(
        pathname,
      );

    if (!appointmentId) {
      return false;
    }

    const appointments = await sql`
      SELECT user_id
      FROM appointments
      WHERE id = ${appointmentId}
      LIMIT 1
    `;

    if (
      appointments.length ===
      0
    ) {
      return false;
    }

    /*
     * Admin can access every medical file.
     */
    if (appUser.role === "ADMIN") {
      return true;
    }

    /*
     * Patient can only access their
     * own appointment media.
     */
    return (
      appointments[0].user_id ===
      appUser.auth_user_id
    );
  }

  return false;
}

export default async function handler(
  req,
  res,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const pathname =
      typeof req.query?.pathname ===
      "string"
        ? req.query.pathname
        : "";

    /*
     * Validate pathname.
     */
    if (!isValidPathname(pathname)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid media pathname.",
      });
    }

    /*
     * Authenticate.
     */
    const { appUser } =
      await requireUser(req);

    /*
     * Authorize.
     */
    const allowed =
      await canAccessMedia(
        pathname,
        appUser,
      );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this media.",
      });
    }

    /*
     * Get private Blob server-side.
     */
    const result = await get(
      pathname,
      {
        access: "private",
      },
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Media not found.",
      });
    }

    const {
      stream,
      blob,
    } = result;

    /*
     * Do not cache private medical media
     * in shared browser/proxy caches.
     */
    res.setHeader(
      "Cache-Control",
      "private, no-store, max-age=0",
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff",
    );

    res.setHeader(
      "Content-Type",
      blob.contentType ||
        "application/octet-stream",
    );

    /*
     * Images and PDFs should render
     * in the browser.
     */
    res.setHeader(
      "Content-Disposition",
      "inline",
    );

    if (blob.size) {
      res.setHeader(
        "Content-Length",
        String(blob.size),
      );
    }

    /*
     * Stream the private Blob file
     * directly to the browser.
     */
    Readable.fromWeb(stream).pipe(res);
  } catch (error) {
    console.error(
      "Protected media API error:",
      error,
    );

    if (
      error.status === 401 ||
      error.status === 403
    ) {
      return res.status(
        error.status,
      ).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to load media.",
    });
  }
}