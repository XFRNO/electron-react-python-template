import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { realtimeManager } from "@/lib/realtime-utils";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [realtimeMessage, setRealtimeMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(realtimeManager.getIsConnected());

  useEffect(() => {
    // Example: Listen for a 'statusUpdate' event
    const handleStatusUpdate = (message: any) => {
      setRealtimeMessage(`Realtime Update: ${JSON.stringify(message.payload)}`);
    };

    realtimeManager.on("statusUpdate", handleStatusUpdate);

    const handleConnectionStatusChange = (status: boolean) => {
      setIsConnected(status);
    };
    realtimeManager.onConnectionStatusChange(handleConnectionStatusChange);

    return () => {
      realtimeManager.off("statusUpdate", handleStatusUpdate);
      realtimeManager.offConnectionStatusChange(handleConnectionStatusChange);
    };
  }, []);

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
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              title={isConnected ? "Connected" : "Disconnected"}
            ></div>
          </div>
        </header>
        <main className="container py-8">
          {realtimeMessage && (
            <div className="bg-blue-100 text-blue-800 p-2 rounded mb-4">
              {realtimeMessage}
            </div>
          )}
          <Outlet />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
