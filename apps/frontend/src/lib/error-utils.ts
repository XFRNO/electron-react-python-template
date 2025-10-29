import { useToast } from "@/hooks/use-toast";

export const useErrorToast = () => {
  const { toast } = useToast();

  const showErrorToast = (title: string, description?: string) => {
    toast({
      title: title,
      description: description,
      variant: "destructive",
    });
  };

  return { showErrorToast };
};