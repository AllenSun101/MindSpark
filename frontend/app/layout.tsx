import type { Metadata } from "next";
import { Open_Sans } from "next/font/google"
import "./globals.css";
import Navbar from "./Navbar"
import Footer from "./Footer"
import { SessionProvider } from "next-auth/react"

const openSans = Open_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "MindSpark",
  description: "MindSpark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.className} ${openSans.className} antialiased`}
      >
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
              <div className="flex-grow">
                {children}
              </div>
            <Footer />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
