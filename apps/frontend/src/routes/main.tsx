import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { APP_NAME, IS_DEV, test } from "@repo/constants";
export const Route = createFileRoute("/main")({
  component: MainPage,
});

function MainPage() {
  const [message, setMessage] = useState("Hello from the main page!");

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground">
      <h1 className="mb-4 text-3xl font-bold">Main Page</h1>
      <p className="mb-8 text-lg">{message}</p>
      <button
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        onClick={() => setMessage("Button clicked!")}
      >
        Click me
      </button>

      <h1>{APP_NAME}</h1>
      <h1>{IS_DEV}</h1>
      <h1>{test}</h1>
    </div>
  );
}
