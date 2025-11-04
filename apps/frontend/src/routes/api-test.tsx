import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api-test")({
  component: ApiTest,
});

export function ApiTest() {
  const {
    data: ipcPingData,
    isLoading: ipcPingLoading,
    error: ipcPingError,
  } = useQuery({
    queryKey: ["ipcPing"],
    queryFn: () => handleIpcPing(),
  });

  const {
    data: apiPingData,
    isLoading: apiPingLoading,
    error: apiPingError,
  } = useQuery({
    queryKey: ["apiPing"],
    queryFn: () => handleApiPing(),
  });

  const handleIpcPing = async () => {
    if (window.electron) {
      const result = await window.electron.ping();
      console.log(result);
      return result;
    }
  };

  const handleApiPing = async () => {
    const result = await fetch("http://127.0.0.1:8001/api/health");
    const data = await result.json();
    return data;
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
          {ipcPingLoading && <p>Loading IPC ping...</p>}
          {ipcPingError && (
            <p className="text-red-500">Error: {ipcPingError.message}</p>
          )}
          {ipcPingData && <p>IPC Response: {ipcPingData}</p>}
          <Button onClick={handleApiPing} className="mb-2">
            Send Backend Ping
          </Button>
          {apiPingData && (
            <p>Backend Response: {JSON.stringify(apiPingData)}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
