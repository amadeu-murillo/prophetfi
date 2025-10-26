import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Renomeado para evitar conflito
import "./globals.css";
// Importação direta dos estilos da UI da carteira (alternativa)
// Se os estilos não aplicarem automaticamente, descomente a linha abaixo
// import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletContextProvider } from "./components/WalletContextProvider"; // Importa o provider

// Configuração das fontes Geist
const geistSansFont = Geist({ // Renomeado
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMonoFont = Geist_Mono({ // Renomeado
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadados da aplicação
export const metadata: Metadata = {
  title: "ProphetFi", // Título atualizado
  description: "The Future of DeFi Intelligence", // Descrição atualizada
};

// Layout Raiz da Aplicação
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Removido espaço em branco extra antes de <body...>
    <html lang="pt">
      <body
        className={`${geistSansFont.variable} ${geistMonoFont.variable} antialiased`} // Usa os nomes renomeados das fontes
      >
        {/* Envolve os filhos com o Provedor de Contexto da Carteira */}
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}

