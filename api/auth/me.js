import { requireUser } from "../_lib/serverAuth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const { authUser, appUser } = await requireUser(req);

    return res.status(200).json({
      success: true,
      data: {
        authUser: {
          id: authUser.id,
          email: authUser.email,
        },
        user: appUser,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 401 || error.status === 403
          ? error.message
          : "Failed to load authenticated user.",
    });
  }
}