import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth"
import { ConditionalLayout } from "@/components/conditional-layout"
// import ErrorBoundary from "@/components/error-boundary"
import { ApiStatusChecker } from "@/components/api-status-checker"
import { AppQueryClientProvider } from "@/components/providers/react-query-provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Takenos | La billetera digital para cobros y pagos en todo el mundo.",
  description: "Portal financiero de Takenos para depósitos y retiros",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: '/isotipo_color_02.jpg',
        sizes: 'any',
        type: 'image/jpeg',
      },
    ],
    shortcut: '/isotipo_color_02.jpg',
    apple: [
      {
        url: '/isotipo_color_02.jpg',
        sizes: '180x180',
        type: 'image/jpeg',
      },
    ],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <AppQueryClientProvider>
          <AuthProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AuthProvider>
          <Toaster />
          <ApiStatusChecker />
        </AppQueryClientProvider>
      </body>
    </html>
  )
}
