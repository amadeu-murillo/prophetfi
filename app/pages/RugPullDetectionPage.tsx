"use client"; // Necessário para hooks como useState, useCallback e hooks do wallet-adapter

import React, { useState, useCallback, useEffect, ChangeEvent, useContext } from 'react';
import { Search, Loader2, AlertTriangle, Wallet, Info } from 'lucide-react';
// Importa os hooks diretamente
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
// Importa o contexto para UI dinâmica
import { WalletModalContext } from '@solana/wallet-adapter-react-ui';

// Importações dos módulos separados
import { FEE_AMOUNT_SOL, FEE_RECEIVER_ADDRESS, HELIUS_API_KEY } from '../lib/rugPullConstants';
import { RugPullResult } from '../lib/rugPullTypes';
import { fetchRugPullData } from '../lib/rugPullAnalysis';
import RugPullResultsDisplay from '../components/RugPullResultsDisplay';

// --- Componente Principal da Página ---
const RugPullDetectionPage: React.FC = () => {
    // **Hooks chamados incondicionalmente no topo, na ordem correta**
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet(); // Adicionado 'wallet' para checagem
    const { visible, setVisible } = useContext(WalletModalContext); // Hook para controlar o modal

    // Hooks de Estado para dependências dinâmicas
    const [web3JsLoaded, setWeb3JsLoaded] = useState(false);
    const [uiComponentsLoaded, setUiComponentsLoaded] = useState(false);

    // Hooks de Estado da Aplicação
    const [isClient, setIsClient] = useState(false);
    const [addressToCheck, setAddressToCheck] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analysisStep, setAnalysisStep] = useState<string>('');
    const [result, setResult] = useState<RugPullResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inputError, setInputError] = useState<string | null>(null);
    const [feePaid, setFeePaid] = useState<boolean>(false);

    // Estado local para classes web3.js carregadas dinamicamente
    const [LocalSystemProgram, setLocalSystemProgram] = useState<any>(null);
    const [LocalTransaction, setLocalTransaction] = useState<any>(null);
    const [LocalLAMPORTS_PER_SOL, setLocalLAMPORTS_PER_SOL] = useState<number | null>(null);
    const [LocalPublicKey, setLocalPublicKey] = useState<any>(null);
    // Estado local para o botão da carteira
    const [LocalWalletMultiButton, setLocalWalletMultiButton] = useState<React.FC<any> | null>(null);


    // Efeito para marcar como cliente e carregar libs dinâmicas
    useEffect(() => {
        setIsClient(true);

        // Carregar classes do web3.js
        import('@solana/web3.js').then(web3 => {
            setLocalSystemProgram(() => web3.SystemProgram);
            setLocalTransaction(() => web3.Transaction);
            setLocalLAMPORTS_PER_SOL(web3.LAMPORTS_PER_SOL);
            setLocalPublicKey(() => web3.PublicKey);
            setWeb3JsLoaded(true);
            console.log("web3.js carregado.");
        }).catch(err => console.error("Falha ao carregar @solana/web3.js:", err));

        // Carregar componentes UI
        import('@solana/wallet-adapter-react-ui').then(ui => {
            // Estilos devem ser carregados globalmente (ver WalletContextProvider)
            setLocalWalletMultiButton(() => ui.WalletMultiButton);
            setUiComponentsLoaded(true);
            console.log("Componentes UI da carteira carregados.");
        }).catch(err => console.error("Falha ao carregar componentes UI da carteira:", err));

    }, []); // Executa apenas uma vez no mount

    // Função para validar o endereço Solana
    const validateAddress = useCallback((address: string): boolean => {
        if (!LocalPublicKey) return false; // Adia a validação se PublicKey não estiver carregado
        if (!address.trim()) {
            setInputError("Por favor, insira um endereço Solana.");
            return false;
        }
        try {
            new LocalPublicKey(address.trim());
            setInputError(null);
            return true;
        } catch (err) {
            setInputError("Formato de endereço Solana inválido.");
            return false;
        }
    // Adicionado LocalPublicKey às dependências do useCallback
    }, [LocalPublicKey]);

    // Handler para mudança no input
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newAddress = e.target.value;
        setAddressToCheck(newAddress);
        setError(null);
        setResult(null);
        // Valida enquanto digita, mas só se web3.js já carregou
        if (web3JsLoaded) {
             validateAddress(newAddress);
        } else {
            setInputError(null);
        }
    };

    // Handler para perder foco (garante validação final no campo)
    const handleInputBlur = () => {
        if (web3JsLoaded) {
            validateAddress(addressToCheck);
        }
    }

    // Callback para lidar com a verificação do endereço
    const handleCheckAddress = useCallback(async () => {
        // Verifica se está no cliente, conectado, e libs carregadas
        const dependenciesReady = isClient && connection && publicKey && sendTransaction && LocalSystemProgram && LocalTransaction && LocalLAMPORTS_PER_SOL && LocalPublicKey;

        if (!publicKey) {
             setError("Por favor, conecte sua carteira primeiro.");
             setVisible(true); // Abre o modal da carteira
             return;
        }

        if (!dependenciesReady) {
            setError("Componentes necessários ainda não estão prontos. Tente recarregar a página.");
            console.error("Dependências não prontas", { isClient, connection, publicKey, sendTransaction, LocalSystemProgram, LocalTransaction, LocalLAMPORTS_PER_SOL, LocalPublicKey });
            return;
        }

        const trimmedAddress = addressToCheck.trim();
        // Validação final antes de prosseguir
        if (!validateAddress(trimmedAddress)) {
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
            setAnalysisStep('Criando transação da taxa...');
            console.log("Iniciando pagamento da taxa...");
            const transaction = new LocalTransaction();
            // Verifica se LocalLAMPORTS_PER_SOL não é null antes de usar
            const feeLamports = FEE_AMOUNT_SOL * (LocalLAMPORTS_PER_SOL ?? 1_000_000_000); // Usa valor padrão se null
            if(LocalLAMPORTS_PER_SOL === null) console.warn("LAMPORTS_PER_SOL não carregado, usando valor padrão.");

            transaction.add(
                LocalSystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new LocalPublicKey(FEE_RECEIVER_ADDRESS),
                    lamports: feeLamports,
                })
            );

            setAnalysisStep('Obtendo blockhash recente...');
            console.log("Obtendo blockhash...");
            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            setAnalysisStep('Aguardando assinatura da transação...');
            console.log("Enviando transação de taxa...");
             const signature = await sendTransaction(transaction, connection, { minContextSlot, skipPreflight: false });


            setAnalysisStep('Confirmando transação na rede...');
            console.log("Confirmando transação de taxa, assinatura:", signature);
            const confirmation = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');

            if (confirmation.value.err) {
                let logs = 'N/A';
                try {
                    const txDetails = await connection.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
                    logs = txDetails?.meta?.logMessages?.join('; ') || 'Logs não disponíveis';
                    console.error("Logs da transação falhada:", logs);
                } catch (logError: any) { console.error("Erro ao buscar logs da transação:", logError.message); }
                throw new Error(`Falha ao confirmar a transação da taxa na rede Solana. Verifique o explorador de blocos ou tente novamente. Detalhes: ${JSON.stringify(confirmation.value.err)}. Logs: ${logs}`);
            }

            console.log(`Transação de pagamento confirmada: ${signature}`);
            setFeePaid(true);

            // 2. Inicia a análise do token
            setAnalysisStep('Iniciando análise do token...');
            console.log(`Iniciando verificação do endereço: ${trimmedAddress}`);
            const analysisResult = await fetchRugPullData(trimmedAddress, HELIUS_API_KEY, setAnalysisStep);

            // 3. Processa o resultado
            if (analysisResult.status === 'Error' && analysisResult.warnings.length > 0) {
                setError(analysisResult.summary || analysisResult.warnings[0].message);
                setResult(null);
            } else {
                setResult(analysisResult);
            }

        } catch (err: any) {
            console.error("Falha detalhada na verificação ou pagamento:", err);
            let userMessage = `Ocorreu um erro inesperado: ${err.message || 'Erro desconhecido.'}. Tente novamente.`;

            if (err.name === 'WalletSendTransactionError' && err.message) {
                 if (err.message.includes('User rejected the request')) {
                     userMessage = "Transação rejeitada na sua carteira.";
                 } else if (err.message.includes('blockhash')) {
                     userMessage = "Erro ao enviar a transação: O blockhash pode ter expirado. Por favor, tente novamente.";
                 } else if (err.message.includes('insufficient lamports')) {
                    userMessage = "Saldo insuficiente para pagar a taxa da transação ou a taxa de análise.";
                 } else {
                    userMessage = `Erro ao enviar a transação pela carteira: ${err.message}. Verifique sua carteira e saldo.`;
                 }
            } else if (err.message?.includes('confirmTransaction')) {
                userMessage = "Falha ao confirmar a transação da taxa na rede Solana (Devnet pode estar lenta). Verifique o explorador de blocos (Solscan/SolanaFM) ou tente novamente.";
            } else if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch') || err.message?.includes('connection')) {
                 userMessage = "Erro de rede ao comunicar com a Solana Devnet. Verifique sua conexão ou tente novamente mais tarde.";
            } else if (err.name === 'AbortError') {
                 userMessage = `A operação demorou muito (timeout). A rede pode estar congestionada. Tente novamente mais tarde. (${err.message})`;
            } else if (err.message?.startsWith('Falha ao confirmar a transação')) {
                 userMessage = err.message;
            } else if (err.message?.includes("Invalid param")) {
                 userMessage = `Erro na API: Parâmetro inválido (${err.message}). Verifique o endereço do token.`;
            }


            setError(userMessage);
            setFeePaid(false);
            setResult(null);
        } finally {
            setIsLoading(false);
            setAnalysisStep('');
        }
    }, [isClient, connection, publicKey, sendTransaction, addressToCheck, LocalSystemProgram, LocalTransaction, LocalLAMPORTS_PER_SOL, LocalPublicKey, setVisible, validateAddress]);

    // Renderiza o botão da carteira
    const renderWalletButton = () => {
        if (!isClient || !uiComponentsLoaded || !LocalWalletMultiButton) {
            return <div className="h-[40px] w-[150px] bg-indigo-500 rounded-md animate-pulse"></div>;
        }
        return <LocalWalletMultiButton style={{ height: '40px', backgroundColor: '#6366f1', borderRadius: '6px' }} />;
    };

    // --- JSX do Componente ---
    return (
        <div className="bg-slate-900 py-16 sm:py-24 min-h-screen">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {/* Cabeçalho */}
                <div className="text-center mb-12">
                    <p className="text-base font-semibold leading-7 text-indigo-500">Segurança com IA na Solana</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
                        Detector de Rug Pull (Rede Devnet)
                    </h1>
                    <p className="mt-4 text-lg leading-8 text-slate-300">
                        Conecte sua carteira Devnet, insira um endereço de token SPL e pague uma pequena taxa de {FEE_AMOUNT_SOL} SOL (Devnet) para cobrir os custos da API e realizar uma avaliação de risco detalhada.
                    </p>
                    <p className="mt-2 text-sm text-amber-400">
                       <Info size={14} className="inline mr-1" /> Atenção: Esta ferramenta opera exclusivamente na rede **Devnet**. Os resultados podem não refletir o comportamento na Mainnet.
                    </p>
                </div>

                {/* Seção Principal de Interação */}
                <div className="bg-slate-800/60 p-6 sm:p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
                    {/* Botão Conectar Carteira / Status Conectado */}
                    <div className="mb-6 flex flex-col items-center">
                         {!publicKey && isClient && uiComponentsLoaded ? (
                            <>
                                <p className="text-center text-slate-400 mb-4">Conecte sua carteira Devnet para começar.</p>
                                {renderWalletButton()}
                            </>
                        ) : publicKey ? (
                             <div className="text-center text-emerald-400 flex items-center justify-center text-sm sm:text-base">
                                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Conectado: <span className="truncate max-w-[150px] sm:max-w-xs">{publicKey.toBase58()}</span>
                                <div className='ml-4'>{renderWalletButton()}</div>
                            </div>
                        ) : (
                             <div className="h-[40px] w-[150px] bg-indigo-500 rounded-md animate-pulse"></div>
                        )}
                    </div>

                    {/* Input e Botão de Verificação */}
                    {isClient && web3JsLoaded && (
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
                                        onChange={handleInputChange}
                                        onBlur={handleInputBlur}
                                        className={`block w-full rounded-md border-0 bg-slate-700/30 py-2 px-3 text-slate-100 shadow-sm ring-1 ring-inset ${
                                            inputError ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-600/50 focus:ring-indigo-500'
                                        } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 placeholder:text-slate-500 transition-all`}
                                        placeholder="Cole o endereço do token aqui..."
                                        disabled={isLoading}
                                        aria-invalid={!!inputError}
                                        aria-describedby="address-error"
                                    />
                                    {inputError && (
                                        <p id="address-error" className="mt-1 text-xs text-red-400">{inputError}</p>
                                    )}
                                </div>
                            </div>

                             <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
                                <AlertTriangle size={12} />
                                Análise baseada em heurísticas (Devnet). Não é aconselhamento financeiro. DYOR.
                            </p>

                            <button
                                onClick={handleCheckAddress}
                                disabled={isLoading || !publicKey || !addressToCheck.trim() || !!inputError}
                                className="w-full flex justify-center items-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {analysisStep || 'Processando...'}
                                    </>
                                ) : (
                                     !publicKey ? <><Wallet className="mr-2 h-4 w-4" /> Conectar Carteira Primeiro</> : <><Search className="mr-2 h-4 w-4" /> Verificar ({FEE_AMOUNT_SOL} SOL)</>
                                )}
                            </button>
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
                            <p>{analysisStep || 'Aguardando...'}</p>
                        </div>
                    )}
                </div>

                {/* Exibição dos Resultados */}
                {result && !isLoading && result.status !== 'Error' && (
                    <RugPullResultsDisplay result={result} />
                )}
            </div>
        </div>
    );
};

export default RugPullDetectionPage;

