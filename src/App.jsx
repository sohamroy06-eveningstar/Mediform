import Header from "./Components/Header";
import Footer from "./Components/Footer";
import AppointmentProvider from "./context/AppointmentProvider";
import Dashboard from "./pages/Dashboard";

function App() {
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