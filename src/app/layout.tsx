import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduHub - Học thông minh với AI",
  description: "Nền tảng học tập cá nhân hóa với trợ giảng AI, giúp học sinh tự học hiệu quả theo đúng trình độ.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#1e293b",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
