import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dänk Symposium",
  description: "Workshop booking system",
  applicationName: "Dänk Symposium",
};

export const viewport: Viewport = {
  themeColor: "#5B6FE5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} antialiased`}>
        <div className="min-h-screen bg-background">
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
