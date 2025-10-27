"use client"; // Necessário para hooks do React (useMemo) e contexto

import React, { FC, useMemo } from 'react';
// Nota: O ambiente de visualização pode ter problemas para resolver estas importações.
// Elas devem funcionar corretamente em um ambiente de desenvolvimento Next.js local.
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
// Removido import de clusterApiUrl pois usaremos um endpoint específico

// Importação de CSS geralmente não é feita aqui no App Router,
// mas sim no layout.tsx ou globals.css.
// import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
    children: React.ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
    // A rede continua Devnet, correspondendo ao endpoint Helius fornecido
    const network = WalletAdapterNetwork.Devnet;

    // Endpoint RPC: Usando o endpoint Helius Devnet fornecido pelo usuário
    const endpoint = "https://devnet.helius-rpc.com/?api-key=2e9c5f4b-aacf-4903-a787-0c431a50ffff";

    // Configuração das carteiras suportadas.
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            // Adicione outras carteiras aqui se necessário
        ],
        [network] // Recalcula apenas se a rede mudar
    );

    return (
        // Provedor para a conexão com a rede Solana, agora usando o endpoint Helius
        <ConnectionProvider endpoint={endpoint}>
            {/* Provedor para o estado da carteira */}
            <WalletProvider wallets={wallets} autoConnect>
                {/* Provedor para a UI Modal de seleção de carteira */}
                <WalletModalProvider>
                    {children} {/* Renderiza os componentes filhos dentro dos provedores */}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
