"use client"; // Necessário para hooks como useState, useCallback e hooks do wallet-adapter

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, AlertTriangle, Wallet } from 'lucide-react';

// Importações dos módulos separados
import { FEE_AMOUNT_SOL, FEE_RECEIVER_ADDRESS, HELIUS_API_KEY } from '../lib/rugPullConstants';
import { RugPullResult, ConnectionAdapterProps, WalletAdapterProps } from '../lib/rugPullTypes';
import { fetchRugPullData } from '../lib/rugPullAnalysis';
import RugPullResultsDisplay from '../components/RugPullResultsDisplay'; // Importa o componente de exibição

// --- Declarações de Tipos Globais e Hooks ---
declare const WalletMultiButton: React.FC<any>; // Componente UI
declare const SystemProgram: any;
declare const Transaction: any;
declare const LAMPORTS_PER_SOL: number;
declare const PublicKey: any;

// Hooks (inicializados como null functions, serão carregados dinamicamente)
let useConnection: () => ConnectionAdapterProps = () => ({ connection: null });
let useWallet: () => WalletAdapterProps = () => ({ publicKey: null, sendTransaction: async () => '' });
// --- Fim das Declarações ---


// --- Componente Principal da Página ---
const RugPullDetectionPage: React.FC = () => {
    // Hooks de Estado para dependências dinâmicas
    const [walletAdapterHooks, setWalletAdapterHooks] = useState<{ useConnection: () => ConnectionAdapterProps; useWallet: () => WalletAdapterProps } | null>(null);
    const [web3JsClasses, setWeb3JsClasses] = useState<{ SystemProgram: any; Transaction: any; LAMPORTS_PER_SOL: number; PublicKey: any } | null>(null);
    const [UiComponents, setUiComponents] = useState<{ WalletMultiButton: React.FC<any> | null }>({ WalletMultiButton: null });

    // Hooks de Estado da Aplicação
    const [isClient, setIsClient] = useState(false);
    const [addressToCheck, setAddressToCheck] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analysisStep, setAnalysisStep] = useState<string>(''); // Para indicar o progresso
    const [result, setResult] = useState<RugPullResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [feePaid, setFeePaid] = useState<boolean>(false);

    // Usa os hooks carregados dinamicamente
    const { connection } = walletAdapterHooks?.useConnection() ?? { connection: null };
    const { publicKey, sendTransaction } = walletAdapterHooks?.useWallet() ?? { publicKey: null, sendTransaction: async () => '' };
    const LocalWalletMultiButton = UiComponents.WalletMultiButton;

    // Efeito para carregar dependências do lado do cliente
    useEffect(() => {
        setIsClient(true);
        // Carregar hooks do adapter
        import('@solana/wallet-adapter-react').then(walletAdapterReact => {
            setWalletAdapterHooks({
                useConnection: walletAdapterReact.useConnection,
                useWallet: walletAdapterReact.useWallet,
            });
        }).catch(err => console.error("Falha ao carregar hooks da carteira:", err));

        // Carregar classes do web3.js
        import('@solana/web3.js').then(web3 => {
            setWeb3JsClasses({
                SystemProgram: web3.SystemProgram,
                Transaction: web3.Transaction,
                LAMPORTS_PER_SOL: web3.LAMPORTS_PER_SOL,
                PublicKey: web3.PublicKey
            });
        }).catch(err => console.error("Falha ao carregar @solana/web3.js:", err));

        // Carregar componentes UI
        import('@solana/wallet-adapter-react-ui').then(ui => {
            // Se necessário, carregar estilos aqui ou globalmente
            // import('@solana/wallet-adapter-react-ui/styles.css').catch(cssErr => console.error("Falha ao carregar estilos da carteira:", cssErr));
            setUiComponents({ WalletMultiButton: ui.WalletMultiButton });
        }).catch(err => console.error("Falha ao carregar componentes UI da carteira:", err));
    }, []);

    // Callback para lidar com a verificação do endereço
    const handleCheckAddress = useCallback(async () => {
        // Verifica se todas as dependências estão carregadas
        if (!isClient || !connection || !publicKey || !sendTransaction || !web3JsClasses) {
            setError("Componentes da carteira ou Web3.js ainda não estão prontos.");
            console.error("Dependências não prontas", { isClient, connection, publicKey, sendTransaction, web3JsClasses });
            return;
        }
        const { SystemProgram: ImportedSystemProgram, Transaction: ImportedTransaction, LAMPORTS_PER_SOL: ImportedLamports, PublicKey: ImportedPublicKey } = web3JsClasses;

        const trimmedAddress = addressToCheck.trim();
        // Validação básica do input
        if (!trimmedAddress) {
            setError("Por favor, insira um endereço Solana válido para verificar.");
            return;
        }
        try {
            new ImportedPublicKey(trimmedAddress); // Valida formato do endereço Solana
        } catch (err) {
            setError("Formato de endereço Solana inválido.");
            return;
        }

        // Reseta o estado antes de iniciar
        setIsLoading(true);
        setError(null);
        setResult(null);
        setFeePaid(false);
        setAnalysisStep('Iniciando pagamento da taxa...');

        try {
            // 1. Cria e envia a transação de taxa
            console.log("Iniciando pagamento da taxa...");
            const transaction = new ImportedTransaction();
            const feeLamports = FEE_AMOUNT_SOL * ImportedLamports;
            transaction.add(
                ImportedSystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new ImportedPublicKey(FEE_RECEIVER_ADDRESS),
                    lamports: feeLamports,
                })
            );

            console.log("Obtendo blockhash...");
            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            setAnalysisStep('Aguardando assinatura da transação da taxa...');
            console.log("Enviando transação de taxa...");
            const signature = await sendTransaction(transaction, connection, { minContextSlot, skipPreflight: false }); // skipPreflight pode ser útil em devnet

            setAnalysisStep('Confirmando transação da taxa...');
            console.log("Confirmando transação de taxa, assinatura:", signature);
            const confirmation = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');

            // Verifica erros na confirmação
            if (confirmation.value.err) {
                let logs = 'N/A';
                try { // Tenta obter logs para depuração
                    const txDetails = await connection.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
                    logs = txDetails?.meta?.logMessages?.join('; ') || 'Logs não disponíveis';
                    console.error("Logs da transação falhada:", logs);
                } catch (logError: any) { console.error("Erro ao buscar logs da transação:", logError.message); }
                throw new Error(`Falha na confirmação da transação da taxa: ${JSON.stringify(confirmation.value.err)}. Logs: ${logs}`);
            }

            console.log(`Transação de pagamento confirmada: ${signature}`);
            setFeePaid(true); // Marca que a taxa foi paga

            // 2. Inicia a análise do token (após pagamento)
            setAnalysisStep('Iniciando análise do token...');
            console.log(`Iniciando verificação do endereço: ${trimmedAddress}`);
            const analysisResult = await fetchRugPullData(trimmedAddress, HELIUS_API_KEY, setAnalysisStep); // Passa a função de callback

            // 3. Processa o resultado da análise
            if (analysisResult.status === 'Error' && analysisResult.warnings.length > 0) {
                setError(analysisResult.warnings[0].message);
                setResult(null);
            } else {
                setResult(analysisResult);
            }

        } catch (err: any) {
            // Tratamento de Erros
            console.error("Falha detalhada na verificação ou pagamento:", err);
            let userMessage = `Ocorreu um erro: ${err.message || 'Erro desconhecido.'}`;
            if (err.name === 'WalletSendTransactionError' || err.message.includes('Transaction creation failed')) {
                userMessage = `Erro ao enviar transação: ${err.message}. Verifique sua carteira.`;
                if (err.message.includes('blockhash')) userMessage += " O blockhash pode ter expirado, tente novamente.";
            } else if (err.message.includes('User rejected the request')) userMessage = "Transação rejeitada pelo usuário.";
            else if (err.message.includes('confirmTransaction')) userMessage = "Falha ao confirmar a transação da taxa na rede. Verifique o Solscan ou tente novamente.";
            else if (err.message.includes('Network request failed') || err.message.includes('Failed to fetch')) userMessage = "Erro de rede ao comunicar com o RPC. Verifique sua conexão.";
            else if (err.name === 'AbortError') userMessage = `A operação demorou muito (timeout - ${err.message}). Tente novamente mais tarde.`;
            else if (err instanceof Error && (err.message.includes("Cannot read properties of null (reading 'getLatestBlockhashAndContext')") || err.message.includes("connection"))) userMessage = "Erro de conexão com a rede Solana (Devnet pode estar instável). Tente novamente.";
            else if (err.message.includes('insufficient lamports')) userMessage = "Saldo insuficiente para pagar a taxa da transação ou a taxa de análise.";

            setError(userMessage);
            setFeePaid(false); // Pagamento falhou ou não ocorreu
            setResult(null);
        } finally {
            // Limpa o estado de loading
            setIsLoading(false);
            setAnalysisStep('');
        }
    }, [isClient, connection, publicKey, sendTransaction, addressToCheck, web3JsClasses]);

    // Renderiza o botão da carteira (com placeholder durante carregamento)
    const renderWalletButton = () => {
        if (!isClient || !LocalWalletMultiButton) {
            return <div className="h-[40px] w-[150px] bg-indigo-500 rounded-md animate-pulse"></div>;
        }
        // Aplica estilos diretamente
        return <LocalWalletMultiButton style={{ height: '40px', backgroundColor: '#6366f1', borderRadius: '6px' }} />;
    };

    // --- JSX do Componente ---
    return (
        <div className="bg-slate-900 py-16 sm:py-24 min-h-screen">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {/* Cabeçalho */}
                <div className="text-center mb-12">
                    <p className="text-base font-semibold leading-7 text-indigo-500">Segurança com IA</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
                        Detector de Rug Pull Solana (Devnet)
                    </h1>
                    <p className="mt-4 text-lg leading-8 text-slate-300">
                        Conecte sua carteira, insira um endereço de token e pague {FEE_AMOUNT_SOL} SOL (Devnet) para uma avaliação de risco detalhada.
                    </p>
                </div>

                {/* Seção Principal de Interação */}
                <div className="bg-slate-800/60 p-6 sm:p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
                    {/* Botão Conectar Carteira / Status Conectado */}
                    <div className="mb-6 flex flex-col items-center">
                        {!isClient || !publicKey ? (
                            <>
                                <p className="text-center text-slate-400 mb-4">Conecte sua carteira Devnet para começar.</p>
                                {renderWalletButton()}
                            </>
                        ) : (
                            <div className="text-center text-emerald-400 flex items-center justify-center text-sm sm:text-base">
                                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Conectado: <span className="truncate max-w-[150px] sm:max-w-xs">{publicKey.toBase58()}</span>
                            </div>
                        )}
                    </div>

                    {/* Input e Botão de Verificação (visível apenas se conectado) */}
                    {isClient && publicKey && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="solana-address" className="block text-sm font-medium leading-6 text-slate-300 mb-1.5">
                                    Endereço do Token Solana (Devnet)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="solana-address"
                                        id="solana-address"
                                        value={addressToCheck}
                                        onChange={(e) => { setAddressToCheck(e.target.value); setError(null); setResult(null); }}
                                        className="block w-full rounded-md border-0 bg-slate-700/30 py-2 px-3 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-600/50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 placeholder:text-slate-500"
                                        placeholder="Cole o endereço do token aqui..."
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCheckAddress}
                                disabled={isLoading || !publicKey || !addressToCheck.trim() || !web3JsClasses}
                                className="w-full flex justify-center items-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {analysisStep || (feePaid ? 'Analisando...' : 'Processando Taxa...')}
                                    </>
                                ) : (
                                    <><Search className="mr-2 h-4 w-4" /> Verificar ({FEE_AMOUNT_SOL} SOL)</>
                                )}
                            </button>
                            <p className="text-xs text-slate-500 text-center">Uma taxa de {FEE_AMOUNT_SOL} SOL (Devnet) é necessária para cobrir os custos da API Helius.</p>
                        </div>
                    )}

                    {/* Mensagem de Erro */}
                    {error && (
                        <div className="mt-6 rounded-md bg-red-950/50 p-3 sm:p-4 text-center text-red-400 border border-red-800/50 text-sm">
                            <AlertTriangle className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2 align-middle" /> {error}
                        </div>
                    )}

                    {/* Indicador de Progresso */}
                    {isLoading && !result && !error && (
                        <div className="mt-6 text-center text-slate-400 text-sm">
                            <p>{analysisStep || (feePaid ? 'Executando análise...' : 'Aguardando confirmação da taxa...')}</p>
                            {/* Pode adicionar uma barra de progresso visual aqui */}
                        </div>
                    )}
                </div>

                {/* Exibição dos Resultados (usando o componente separado) */}
                {result && !isLoading && result.status !== 'Error' && (
                    <RugPullResultsDisplay result={result} />
                )}
            </div>
        </div>
    );
};

export default RugPullDetectionPage;

