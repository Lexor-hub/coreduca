import type { Metadata, Viewport } from "next";
import { Nunito } from 'next/font/google'
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: "Coreduca — Aprenda Coreano com Diversão",
  description: "Aprenda coreano de um jeito divertido, com quizzes gamificados, pronúncia com IA e chat com personas inteligentes. Para fãs de K-drama e cultura coreana.",
  keywords: ["coreano", "aprender coreano", "kdrama", "kpop", "idioma coreano", "hangul"],
  openGraph: {
    title: "Coreduca — Aprenda Coreano com Diversão",
    description: "Quizzes, pronúncia com IA e chat com personas. Para fãs de K-drama e cultura coreana.",
    siteName: "Coreduca",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5B7CFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${nunito.variable} antialiased min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
