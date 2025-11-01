import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api-test")({
  component: ApiTest,
});

export function ApiTest() {
  const [ipcPingResult, setIpcPingResult] = useState<string | null>(null);

  const {
    data: apiPingData,
    isLoading: apiPingLoading,
    error: apiPingError,
  } = useQuery({
    queryKey: ["apiPing"],
    queryFn: () => apiFetch("/ping"),
  });

  const handleIpcPing = async () => {
    if (window.electron) {
      const result = await window.electron.ping();
      console.log(result);
      setIpcPingResult(result);
    } else {
      setIpcPingResult("Not in Electron environment");
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">API and IPC Test</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Backend API Ping (/api/ping)</CardTitle>
        </CardHeader>
        <CardContent>
          {apiPingLoading && <p>Loading API ping...</p>}
          {apiPingError && (
            <p className="text-red-500">Error: {apiPingError.message}</p>
          )}
          {apiPingData && <p>API Response: {JSON.stringify(apiPingData)}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Electron IPC Ping (window.electron.ping())</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleIpcPing} className="mb-2">
            Send IPC Ping
          </Button>
          {ipcPingResult && <p>IPC Response: {ipcPingResult}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
