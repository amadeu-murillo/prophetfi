"use client"; // Necessário para hooks do React (useMemo) e contexto

import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Importação de CSS geralmente não é feita aqui no App Router,
// mas sim no layout.tsx ou globals.css. Deixe comentado ou remova.
// require('@solana/wallet-adapter-react-ui/styles.css');
// Ou se os estilos não estiverem aplicando:
// import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
    children: React.ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
    // A rede pode ser 'devnet', 'testnet', ou 'mainnet-beta'
    const network = WalletAdapterNetwork.Devnet;

    // Endpoint RPC da rede Solana. useMemo evita recálculos desnecessários.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // Configuração das carteiras suportadas.
    // Apenas as carteiras configuradas aqui serão incluídas no bundle final.
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            // Adicione outras carteiras aqui se necessário
        ],
        [network] // Recalcula apenas se a rede mudar
    );

    return (
        // Provedor para a conexão com a rede Solana
        <ConnectionProvider endpoint={endpoint}>
            {/* Provedor para o estado da carteira (carteiras disponíveis, conexão) */}
            <WalletProvider wallets={wallets} autoConnect>
                {/* Provedor para a UI Modal de seleção de carteira */}
                <WalletModalProvider>
                    {children} {/* Renderiza os componentes filhos dentro dos provedores */}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
