export {};

declare global {
  interface Window {
    Clerk: {
      loaded: boolean;
      session?: {
        id: string;
        getToken: () => Promise<string | null>;
      };
    };
  }
}
