import { createClient } from "@supabase/supabase-js";
import sql from "../../src/lib/db.js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function requireUser(req) {
  const token = getBearerToken(req);

  if (!token) {
    throw httpError(401, "Authentication required.");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw httpError(401, "Invalid or expired authentication token.");
  }

  const email = user.email || "";

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split("@")[0] ||
    "User";

  const result = await sql`
    INSERT INTO app_users (
      auth_user_id,
      email,
      name
    )
    VALUES (
      ${user.id},
      ${email},
      ${name}
    )
    ON CONFLICT (auth_user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, app_users.name),
      updated_at = CURRENT_TIMESTAMP
    RETURNING
      id,
      auth_user_id,
      email,
      name,
      role,
      created_at,
      updated_at
  `;

  return {
    authUser: user,
    appUser: result[0],
  };
}

export async function requireAdmin(req) {
  const auth = await requireUser(req);

  if (auth.appUser.role !== "ADMIN") {
    throw httpError(403, "Admin access required.");
  }

  return auth;
}