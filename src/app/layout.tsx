import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { QuickCapture } from "@/components/quick-capture/quick-capture";
import { ToastContainer } from "@/components/ui/toast-container";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Your personal command center for tracking all work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          <Sidebar />
          <div className="md:ml-[var(--sidebar-width)] min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 p-6 pb-20 md:pb-6">
              {children}
            </main>
          </div>
          <MobileNav />
          <CommandPalette />
          <QuickCapture />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
