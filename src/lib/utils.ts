import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getErrorMessage = (error: any, fallback: string): string => {
  return error?.response?.data?.message || error?.message || fallback;
};

export function waitForClerkSession(): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const clerk = window.Clerk;
      if (clerk?.loaded && clerk.session) {
        clearInterval(interval);
        resolve();
      }
    }, 50); // Polling every 50ms
  });
}
