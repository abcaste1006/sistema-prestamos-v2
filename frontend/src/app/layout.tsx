import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Layout from "./components/Layout";
import "./globals.css";
import CartFloating from "./components/CartFloating";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Prestamos de Equipos",
  description: "Gestion de prestamos de equipos tecnologicos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Layout>{children}</Layout>
        <CartFloating />
      </body>
    </html>
  );
}
