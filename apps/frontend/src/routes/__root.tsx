import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { realtimeManager } from "@/lib/realtime-utils";
import { useErrorToast } from "@/lib/error-utils";
import { InteractionLogger } from "@/lib/interaction-logger";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [realtimeMessage, setRealtimeMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(
    realtimeManager.getIsConnected()
  );
  const { showErrorToast } = useErrorToast();

  useEffect(() => {
    // Log page view
    InteractionLogger.pageView("RootComponent");

    // Example: Listen for a 'statusUpdate' event
    const handleStatusUpdate = (message: any) => {
      setRealtimeMessage(`Realtime Update: ${JSON.stringify(message.payload)}`);
    };

    realtimeManager.on("statusUpdate", handleStatusUpdate);

    const handleConnectionStatusChange = (status: boolean) => {
      setIsConnected(status);
    };
    realtimeManager.onConnectionStatusChange(handleConnectionStatusChange);

    // Set the error callback for RealtimeManager
    realtimeManager.setOnErrorCallback(showErrorToast);

    return () => {
      realtimeManager.off("statusUpdate", handleStatusUpdate);
      realtimeManager.offConnectionStatusChange(handleConnectionStatusChange);
      realtimeManager.setOnErrorCallback(() => {}); // Clear callback on unmount
    };
  }, [showErrorToast]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container flex justify-between items-center px-4 h-16">
            <h1 className="text-xl font-bold">
              Electron React Python Template
            </h1>
            <nav className="flex space-x-4">
              <Link to="/" className="[&.active]:font-bold">
                Home
              </Link>
              <Link to="/main" className="[&.active]:font-bold">
                Main
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                title={isConnected ? "Connected" : "Disconnected"}
              ></div>
              <span className="text-sm">
                {isConnected ? "Backend Connected" : "Backend Disconnected"}
              </span>
            </div>
          </div>
        </header>
        <main className="container py-8">
          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
            <div className="col-span-1">
              <h2 className="mb-2 text-lg font-semibold">Environment Info</h2>
              <div className="p-4 bg-gray-100 rounded-md dark:bg-gray-800">
                <p>OS: macOS</p>
                <p>App Version: 1.0.0</p>
              </div>
            </div>
            <div className="col-span-2">
              <h2 className="mb-2 text-lg font-semibold">Backend Info</h2>
              <div className="p-4 bg-gray-100 rounded-md dark:bg-gray-800">
                {realtimeMessage ? (
                  <p>{realtimeMessage}</p>
                ) : (
                  <p>No backend information available.</p>
                )}
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
