import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { APP_NAME, APP_VERSION } from "@repo/constants";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { SettingsModal } from "@/components/layout/settings-modal";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Listen for the custom event to open settings modal
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener("openSettingsModal", handleOpenSettings);
    return () => {
      window.removeEventListener("openSettingsModal", handleOpenSettings);
    };
  }, []);

  // Function to open settings modal
  const openSettings = () => {
    // Dispatch a custom event to open the settings modal
    window.dispatchEvent(new CustomEvent("openSettingsModal"));
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <button
        onClick={openSettings}
        className="p-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container flex justify-between items-center px-4 h-16">
            <h1 className="text-xl font-bold">{APP_NAME}</h1>
            <nav className="flex space-x-4">
              <Link to="/" className="[&.active]:font-bold">
                Home
              </Link>
              <Link to="/main" className="[&.active]:font-bold">
                Main
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              {/* Removed WebSocket connection status display */}
            </div>
          </div>
        </header>
        <main className="container py-8">
          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
            <div className="col-span-1">
              <h2 className="mb-2 text-lg font-semibold">Environment Info</h2>
              <div className="p-4 bg-gray-100 rounded-md dark:bg-gray-800">
                <p>OS: macOS</p>
                <p>App Version: {APP_VERSION}</p>
              </div>
            </div>
            <div className="col-span-2">
              <h2 className="mb-2 text-lg font-semibold">Backend Info</h2>
              <div className="p-4 bg-gray-100 rounded-md dark:bg-gray-800">
                <p>No backend information available.</p>
              </div>
            </div>
          </div>
          <Outlet />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
