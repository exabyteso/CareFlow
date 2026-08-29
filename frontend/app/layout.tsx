import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-cf-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "CareFlow",
    template: "%s · CareFlow",
  },
  description:
    "Kenya pretriage routing to a suitable facility. This is not a diagnosis.",
  applicationName: "CareFlow",
  appleWebApp: {
    capable: true,
    title: "CareFlow",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e63b8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
