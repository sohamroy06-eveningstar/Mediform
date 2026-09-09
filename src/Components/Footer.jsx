function Footer() {
  return (
    <footer className="border-t border-[rgba(14,22,38,0.08)] bg-[var(--color-surface)]">
      <div className="mx-auto flex min-h-16 w-full max-w-[1200px] flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          <a
            href="#"
            className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            Privacy Policy
          </a>

          <a
            href="#"
            className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            Terms of Service
          </a>

          <a
            href="#"
            className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            Contact Support
          </a>

          <a
            href="#"
            className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          >
            Help Center
          </a>
        </nav>

        <p className="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
          © 2026 Mediform
        </p>
      </div>
    </footer>
  );
}

export default Footer;