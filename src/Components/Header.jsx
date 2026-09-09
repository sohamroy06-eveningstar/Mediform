import { Bell } from "lucide-react";

function Header() {
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
        <div className="flex items-center gap-3">

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
            aria-label="User profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ink)] font-[var(--font-mono)] text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            MR
          </button>

        </div>
      </div>
    </header>
  );
}

export default Header;