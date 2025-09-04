import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SystemInfo } from "@/components/system-info";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Electron React Python Template</CardTitle>
          <CardDescription>
            This is a template repository for building desktop applications with
            Electron, React, and Python.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>
            This template provides a solid foundation for building
            cross-platform desktop applications using modern web technologies.
            It includes:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Electron for cross-platform desktop application framework</li>
            <li>React with TypeScript for the frontend UI</li>
            <li>Python FastAPI backend for business logic</li>
            <li>TanStack Router for client-side routing</li>
            <li>TanStack Query for server state management</li>
            <li>Shadcn UI components for a modern UI</li>
          </ul>
          <p>
            Check the Settings page for system information and backend
            connectivity testing.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6">
        <SystemInfo />
      </div>
    </div>
  );
}
