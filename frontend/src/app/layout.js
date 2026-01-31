import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/query-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ReCaptchaProvider } from '@/providers/recaptcha-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = await getMessages();
  
  return {
    title: messages.metadata?.title || "HackOps",
    description: messages.metadata?.description || "Built with Next.js, MongoDB, and TanStack Query",
  };
}

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

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