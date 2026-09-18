import { useState } from "react";
import { Bell, LogOut } from "lucide-react";

import { useAuth } from "../context/AuthContext";

function getUserInitials(user) {
  const email = user?.email || "";

  if (!email) {
    return "U";
  }

  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Header() {
  const { user, signOut } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const initials = getUserInitials(user);

  async function handleSignOut() {
    try {
      setIsSigningOut(true);

      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="border-b border-[rgba(14,22,38,0.08)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div>
          <span className="font-[var(--font-brand)] text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Mediform
          </span>
        </div>

        {/* Header Actions */}
        <div className="relative flex items-center gap-3">
          {/* Notification */}
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[rgba(14,22,38,0.04)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            <Bell
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>

          {/* User Profile */}
          <button
            type="button"
            aria-label="Open user profile"
            aria-expanded={isProfileOpen}
            onClick={() =>
              setIsProfileOpen(
                (current) => !current,
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ink)] font-[var(--font-mono)] text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            {initials}
          </button>

          {/* Profile Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-[var(--radius-input)] border border-[rgba(14,22,38,0.08)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-level-2)]">
              {/* User Info */}
              <div className="border-b border-[rgba(14,22,38,0.08)] px-3 py-3">
                <p className="text-xs text-[var(--color-muted)]">
                  Signed in as
                </p>

                <p className="mt-1 truncate text-sm font-medium text-[var(--color-ink)]">
                  {user?.email || "User"}
                </p>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-1 flex w-full items-center gap-3 rounded-[var(--radius-input)] px-3 py-3 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[rgba(14,22,38,0.04)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>
                  {isSigningOut
                    ? "Signing out..."
                    : "Sign out"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;