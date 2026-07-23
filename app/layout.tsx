import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { GoalDataProvider } from "@/components/GoalDataProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { UserSettingsProvider } from "@/components/UserSettingsProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quickgoal",
  description: "Minimalist goal tracking for fast goal capture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <UserSettingsProvider>
              <GoalDataProvider>
                <ToastProvider>{children}</ToastProvider>
              </GoalDataProvider>
            </UserSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
