import Header from "./Components/Header";
import Footer from "./Components/Footer";
import AppointmentProvider from "./context/AppointmentProvider";

import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";

import { useAuth } from "./context/AuthContext";

function App() {
  const {
    loading,
    profileLoading,
    isAuthenticated,
    isAdmin,
  } = useAuth();

  if (loading  || (isAuthenticated && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
            aria-label="Loading"
          />

          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const pathname = window.location.pathname;
  const isAdminRoute = pathname === "/admin";

  /*
   * Protected Admin Route
   */
  if (isAdminRoute) {
    if (!isAdmin) {
      return (
        <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
          <Header />

          <main className="flex flex-1 items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <span className="text-2xl">!</span>
              </div>

              <h1 className="mt-5 text-2xl font-bold text-gray-900">
                Access Denied
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                You do not have permission to access
                the admin panel.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="mt-6 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Back to Dashboard
              </button>
            </div>
          </main>

          <Footer />
        </div>
      );
    }

    return (
      <AppointmentProvider>
        <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
          <Header />

          <AdminPanel />

          <Footer />
        </div>
      </AppointmentProvider>
    );
  }

  /*
   * Normal Patient/User Dashboard
   */
  return (
    <AppointmentProvider>
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Header />

        <Dashboard />

        <Footer />
      </div>
    </AppointmentProvider>
  );
}

export default App;