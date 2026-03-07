import { Toaster } from "sonner";
import type { Metadata } from "next";
import { AuthProvider } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { ThemeProvider } from "@/components/ui/theme-provider";
import ServerPing from "@/components/ServerPing";
import './globals.css';


export const metadata: Metadata = {
  title: "Zotion",
  description:
    "The seamless platform where creative and productive work happens.",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/logo.svg",
        href: "/logo.svg",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/logo-dark.svg",
        href: "/logo-dark.svg",
      },
    ],
  },
};

export const dynamic = 'force-dynamic'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <WorkspaceProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <ServerPing />
            </ThemeProvider>
          </WorkspaceProvider>
        </AuthProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}