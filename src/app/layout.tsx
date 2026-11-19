import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabCS — Ambiente Inteligente de Estudos",
  description:
    "Plataforma de aprendizagem e simulados para Banco de Dados, POO (Java) e Estrutura de Dados III.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
