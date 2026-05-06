import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, Alex_Brush } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
});

const alexBrush = Alex_Brush({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alex-brush",
});

export const metadata: Metadata = {
  title: "Lírio Branco | E-commerce & Brand Dashboard",
  description:
    "Joias projetadas para celebrar a sua essência e os momentos simples. A poesia que você veste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${montserrat.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-transparent overflow-x-hidden">
        {/* Background CSS gradient animado */}
        <div className="shader-bg" />
        <Header />
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}
