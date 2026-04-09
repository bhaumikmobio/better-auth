import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { APP_COPY } from "@/constants/messages";

export const metadata: Metadata = {
  title: APP_COPY.appTitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
