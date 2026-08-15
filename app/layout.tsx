import { type Metadata, type Viewport } from "next";
import { Google_Sans } from "next/font/google";

import { Toaster } from "@/ui/primitives";

import "./globals.css";

// Auto-hospedada no build: nenhuma requisição a servidor de fonte em runtime e
// nenhum salto de layout ao carregar. Expõe --font-google-sans, que globals.css
// usa como primeira opção de --font-sans.
const googleSans = Google_Sans({
  subsets: ["latin"],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wishlist da Casa",
  description: "Lista de compras compartilhada da casa.",
  // O manifest é o que habilita instalar como app e receber compartilhamentos.
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={googleSans.variable}>
      <body className="scrollbar-themed font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
