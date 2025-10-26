import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container flex items-center justify-between h-16 px-4">
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
          </div>
        </header>
        <main className="container py-8">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
