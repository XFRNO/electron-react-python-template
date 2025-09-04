import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BackendInfo {
  backendPort: number | null;
  url: string;
  status: string;
}

interface AppInfo {
  name: string;
  version: string;
  isDev: boolean;
}

interface PortsInfo {
  frontendPort: number | null;
  backendPort: number | null;
}

export function SystemInfo() {
  const { toast } = useToast();
  const [backendInfo, setBackendInfo] = useState<BackendInfo | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [portsInfo, setPortsInfo] = useState<PortsInfo | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  const fetchSystemInfo = async () => {
    try {
      const [backend, app, ports] = await Promise.all([
        (window as any).electronAPI.getBackendInfo(),
        (window as any).electronAPI.getAppInfo(),
        (window as any).electronAPI.getPorts(),
      ]);

      setBackendInfo(backend);
      setAppInfo(app);
      setPortsInfo(ports);
    } catch (error) {
      console.error("Failed to fetch system info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch system information",
        variant: "destructive",
      });
    }
  };

  const testBackendConnection = async () => {
    if (!backendInfo?.url) return;

    setIsTesting(true);
    try {
      const response = await fetch(`${backendInfo.url}/docs`);
      if (response.ok) {
        setBackendStatus("connected");
        toast({
          title: "Success",
          description: "Backend is connected and responding",
        });
      } else {
        setBackendStatus("disconnected");
        toast({
          title: "Connection Failed",
          description: `Backend responded with status ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setBackendStatus("disconnected");
      toast({
        title: "Connection Failed",
        description: "Unable to connect to backend",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* App Information */}
        <div className="space-y-2">
          <h3 className="font-medium">Application</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Name:</div>
            <div>{appInfo?.name || "Loading..."}</div>
            <div className="text-muted-foreground">Version:</div>
            <div>{appInfo?.version || "Loading..."}</div>
            <div className="text-muted-foreground">Mode:</div>
            <div>
              <Badge variant={appInfo?.isDev ? "default" : "secondary"}>
                {appInfo?.isDev ? "Development" : "Production"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* Ports Information */}
        <div className="space-y-2">
          <h3 className="font-medium">Ports</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Frontend Port:</div>
            <div>
              {portsInfo?.frontendPort
                ? `:${portsInfo.frontendPort}`
                : "Not running"}
            </div>
            <div className="text-muted-foreground">Backend Port:</div>
            <div>
              {portsInfo?.backendPort
                ? `:${portsInfo.backendPort}`
                : "Not running"}
            </div>
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* Backend Information */}
        <div className="space-y-2">
          <h3 className="font-medium">Backend</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Status:</div>
            <div>
              <Badge
                variant={
                  backendInfo?.status === "running" ? "default" : "destructive"
                }
              >
                {backendInfo?.status === "running" ? "Running" : "Not Running"}
              </Badge>
            </div>
            <div className="text-muted-foreground">URL:</div>
            <div className="font-mono text-xs break-all">
              {backendInfo?.url || "Not available"}
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={testBackendConnection}
            disabled={isTesting || !backendInfo?.url}
            className="w-full"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test Backend Connection"
            )}
          </Button>

          {backendStatus !== "unknown" && (
            <div className="flex items-center justify-center gap-2 text-sm">
              {backendStatus === "connected" ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Backend Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">Backend Disconnected</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
