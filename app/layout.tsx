import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { setupSafeJsonParsing } from "@/lib/cookies/safe-parser"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ColCord - School Lifecycle Management",
  description: "A comprehensive school lifecycle management system",
  generator: 'v0.dev'
}

// Initialize safe cookie parsing in client components
if (typeof window !== 'undefined') {
  setupSafeJsonParsing();
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}