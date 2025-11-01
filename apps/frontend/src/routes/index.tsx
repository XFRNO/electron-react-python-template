import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground">
      <h1 className="mb-4 text-3xl font-bold">
        Electron React Python Template
      </h1>
      <p className="mb-8 text-lg">
        A template for building desktop applications with Electron, React, and
        Python
      </p>
      <div className="grid grid-cols-1 gap-6 w-full max-w-4xl md:grid-cols-3">
        <div className="p-6 rounded-lg shadow-md bg-card">
          <h2 className="mb-2 text-xl font-semibold">Frontend</h2>
          <p>React with TypeScript, Vite, and Tailwind CSS</p>
        </div>
        <div className="p-6 rounded-lg shadow-md bg-card">
          <h2 className="mb-2 text-xl font-semibold">Backend</h2>
          <p>Python with FastAPI and SQLite</p>
        </div>
        <div className="p-6 rounded-lg shadow-md bg-card">
          <h2 className="mb-2 text-xl font-semibold">Desktop</h2>
          <p>Electron for cross-platform desktop integration</p>
        </div>

        <Link to="/api-test" className="p-6 rounded-lg shadow-md bg-card">
          <Button>Test API</Button>
        </Link>
      </div>
    </div>
  );
}
