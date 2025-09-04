import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Home, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h1 className="text-xl font-bold">Electron Template</h1>
            <ThemeToggle />
          </div>

          <nav className="p-4 space-y-2">
            <Link
              to="/"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            <Link
              to="/settings"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>

      <Toaster />
    </ThemeProvider>
  ),
});
