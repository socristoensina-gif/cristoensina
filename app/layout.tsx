import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import { CartProvider } from "@/components/CartProvider";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Jesus Ensina | Pastor João Luiz Silva",
  description:
    "Ensino bíblico direto ao ponto, para quem não tem tempo mas não abre mão da fé. Vídeos, e-books e uma comunidade de aprendizado diário.",
  metadataBase: new URL("https://jesusensina.com.br"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${inter.variable}`}>
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
