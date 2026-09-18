import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        const data = await signUp(
          email.trim(),
          password,
        );

        if (!data.session) {
          setSuccess(
            "Account created. Please check your email to confirm your account.",
          );
        } else {
          setSuccess("Account created successfully.");
        }
      }
    } catch (error) {
      console.error("Authentication failed:", error);

      setError(
        error?.message ||
          "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((currentMode) =>
      currentMode === "login"
        ? "signup"
        : "login",
    );

    setError("");
    setSuccess("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <p className="font-[var(--font-brand)] text-2xl font-semibold text-[var(--color-ink)]">
            Mediform
          </p>

          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {isLogin
              ? "Sign in to manage your healthcare appointments."
              : "Create your Mediform account."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-level-1)] sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mediform-mono-label"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                disabled={loading}
                className="mt-2 w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mediform-mono-label"
              >
                Password
              </label>

              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.12)] bg-[var(--color-surface)] px-3 py-3 pr-11 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-[var(--radius-input)] border border-[rgba(255,90,95,0.2)] bg-[rgba(255,90,95,0.06)] px-4 py-3 text-sm text-[var(--color-alert)]"
              >
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                role="status"
                className="rounded-[var(--radius-input)] border border-[rgba(0,200,160,0.2)] bg-[rgba(0,200,160,0.06)] px-4 py-3 text-sm text-[var(--color-ink)]"
              >
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[var(--radius-input)] bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isLogin
                  ? "Signing in..."
                  : "Creating account..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 border-t border-[rgba(14,22,38,0.08)] pt-5 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>

            <button
              type="button"
              onClick={toggleMode}
              className="mt-2 text-sm font-medium text-[var(--color-ink)] underline underline-offset-4"
            >
              {isLogin
                ? "Create an account"
                : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;