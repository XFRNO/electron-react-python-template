import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

export function LicenseSettings() {
  const [isSaving, setIsSaving] = useState(false);

  const handleClearLicense = async () => {
    try {
      setIsSaving(true);
      const result = await window.electron.clearLicense();

      if (result.success) {
        // Restart the app to trigger license verification
        setTimeout(async () => {
          await window.electron.restartApp();
        }, 2000);
      } else {
      }
    } catch (error) {
      console.error("Failed to clear license:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-muted-foreground">
        License Management
      </h3>

      <div className="p-4 bg-yellow-50 rounded-lg dark:bg-yellow-950/20">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 " />
          <div>
            <h4 className="mb-1 font-semibold">Clear License</h4>
            <p className="mb-3 text-sm text-muted-foreground">
              This will remove your current license and require you to re-enter
              it on next launch.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearLicense}
              disabled={isSaving}
            >
              Clear License
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-950/20">
        <div className="flex items-start space-x-3">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 " />
          <div>
            <h4 className="mb-1 font-semibold">Need Help?</h4>
            <p className="mb-2 text-sm text-muted-foreground">
              If you're having issues with your license or need assistance,
              please contact our support team.
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Support Email: </span>
              <a
                href="mailto:contact@xfrno.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                contact@xfrno.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
