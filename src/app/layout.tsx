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
  title: "Lírio Branco",
  description:
    "Joias projetadas para celebrar a sua essência e os momentos simples. A poesia que você veste.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
      <body className="min-h-full flex flex-col font-sans bg-[#F8C6C8] dark:bg-[#3A2B2E] overflow-x-hidden">
        <Header />
        <main className="flex-grow w-full overflow-hidden relative">{children}</main>
      </body>
    </html>
  );
}
