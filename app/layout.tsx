import { type Metadata, type Viewport } from "next";

import "./globals.css";

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
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
