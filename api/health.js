import sql from "../src/lib/db.js";

export default async function handler(req, res) {
  try {
    const result = await sql`
      SELECT 1 AS connected
    `;

    return res.status(200).json({
      success: true,
      message: "Vercel API + Neon connection is working",
      data: result,
    });
  } catch (error) {
    console.error("Neon connection error:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
}