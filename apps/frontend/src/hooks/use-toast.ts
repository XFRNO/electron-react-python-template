// Inspired by react-hot-toast library
import { useState, useEffect } from "react";

export type ToastType = "default" | "destructive" | "success" | "warning";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

let toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
      return;
    }

    const timeout = setTimeout(() => {
      toastTimeouts.delete(toastId);
      removeToast(toastId);
    }, TOAST_REMOVE_DELAY);

    toastTimeouts.set(toastId, timeout);
  };

  const addToast = (props: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);

    const toast = {
      ...props,
      id,
    };

    setToasts((prev) => {
      const newToasts = [toast, ...prev].slice(0, TOAST_LIMIT);
      return newToasts;
    });

    if (props.duration !== Infinity) {
      setTimeout(() => {
        addToRemoveQueue(id);
      }, props.duration || 3000);
    }

    return id;
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  useEffect(() => {
    return () => {
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();
    };
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };
}
