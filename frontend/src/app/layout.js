import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ReCaptchaProvider } from '@/providers/recaptcha-provider';

const inter = Inter({ subsets: ["latin"] });


export const metadata = {
  title: "HackOps",
  description: "Built with Next.js, MongoDB, and TanStack Query",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="hydrated">
      <body
        className={inter.className}
      >
        <QueryProvider>
          <AuthProvider> <ReCaptchaProvider>{children}</ReCaptchaProvider></AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
