import { type Metadata, type Viewport } from "next";
import { Gabarito } from "next/font/google";

import "./globals.css";

// Auto-hospedada no build: nenhuma requisição a servidor de fonte em runtime e
// nenhum salto de layout ao carregar. Expõe --font-gabarito, que globals.css
// usa como primeira opção de --font-sans.
const gabarito = Gabarito({
  subsets: ["latin"],
  variable: "--font-gabarito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wishlist da Casa",
  description: "Lista de compras compartilhada da casa.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={gabarito.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
