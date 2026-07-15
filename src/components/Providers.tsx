"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "text-sm",
            style: {
              borderRadius: "12px",
              background: "#1e293b",
              color: "#fff",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
