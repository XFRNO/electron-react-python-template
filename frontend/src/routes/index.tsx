import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-4">
        Electron React Python Template
      </h1>
      <p className="text-lg mb-8">
        A template for building desktop applications with Electron, React, and
        Python
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Frontend</h2>
          <p>React with TypeScript, Vite, and Tailwind CSS</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Backend</h2>
          <p>Python with FastAPI and SQLite</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Desktop</h2>
          <p>Electron for cross-platform desktop integration</p>
        </div>
      </div>
    </div>
  );
}
