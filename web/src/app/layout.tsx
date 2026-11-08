import type { Metadata } from "next";
import { Baloo_2, Rubik } from "next/font/google";
import { AppProviders } from "@/features/shared/providers/app-providers";
import { themeScript } from "@/features/shared/theme/theme-script";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restocker",
  description: "Tu inventario se actualiza con una foto, un audio o un mensaje.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${rubik.variable} ${baloo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
