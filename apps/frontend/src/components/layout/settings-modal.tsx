import { useQuery } from "@tanstack/react-query";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { LicenseSettings } from "@/components/layout/settings/license-settings";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  // Fetch current settings
  const {
    data: settings,
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const result = await window.electron.getSettings();

      if (result) {
        return result as any;
      } else {
        throw new Error(result.error || "Failed to fetch settings");
      }
    },
    retry: false, // Don't retry on failure
    enabled: open, // Only fetch when the modal is open
  });

  // Loading state
  if (isLoading) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Configure your download preferences and app settings
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Loading settings...</div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Error state
  if (isError || !settings) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Configure your download preferences and app settings
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="mb-2 text-muted-foreground">
                Failed to load settings
              </div>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-10">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Configure your download preferences and app settings
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-auto py-5 space-y-5 no-scrollbar">
          <LicenseSettings />
        </div>
        <DrawerFooter className="border-t border-border">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
