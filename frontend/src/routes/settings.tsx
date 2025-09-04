import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SystemInfo } from "@/components/system-info";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Application configuration and system information
        </p>
      </div>

      <div className="space-y-6">
        {/* System Information */}
        <SystemInfo />

        {/* Template Information */}
        <Card>
          <CardHeader>
            <CardTitle>About This Template</CardTitle>
            <CardDescription>
              Information about this Electron React Python template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This is a template repository for building desktop applications
              with:
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
              To use this template, replace the current UI components with your
              own application logic.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
