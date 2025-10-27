import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/main")({
  component: MainPage,
});

function MainPage() {
  const [message, setMessage] = useState("Hello from the main page!");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-4">Main Page</h1>
      <p className="text-lg mb-8">{message}</p>
      <button
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        onClick={() => setMessage("Button clicked!")}
      >
        Click me
      </button>
    </div>
  );
}
