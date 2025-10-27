"use client"; // Necessário para hooks como useState, useCallback e hooks do wallet-adapter

import React, { useState, useCallback, useEffect } from 'react'; // Import useEffect
import { Search, Loader2, AlertTriangle, Wallet, CheckCircle, XCircle } from 'lucide-react';

// --- Declarações para TypeScript ---
// Declara WalletMultiButton como um componente funcional que aceita quaisquer props
// Assumimos que este componente será fornecido pelo contexto @solana/wallet-adapter-react-ui
declare const WalletMultiButton: React.FC<any>;

// Definições de tipo simplificadas para os hooks
interface WalletAdapterProps {
    publicKey: any | null;
    sendTransaction: (transaction: any, connection: any, options?: any) => Promise<string>;
}
interface ConnectionAdapterProps {
    connection: any | null;
}

// Declarar tipos globais (mantido)
declare const SystemProgram: any;
declare const Transaction: any;
declare const LAMPORTS_PER_SOL: number;
declare const PublicKey: any;

// Variáveis para guardar os hooks carregados dinamicamente (mantido)
let useConnection: () => ConnectionAdapterProps = () => ({ connection: null });
let useWallet: () => WalletAdapterProps = () => ({ publicKey: null, sendTransaction: async () => '' });
// --- Fim das declarações ---


// Interface RugPullResult (mantida)
interface RugPullResult {
    riskScore: number;
    warnings: { level: 'high' | 'medium' | 'low' | 'info'; message: string }[];
    isRugPull: boolean;
    details: Record<string, any>;
}

// Constantes HELIUS (mantidas)
const HELIUS_API_KEY = "2e9c5f4b-aacf-4903-a787-0c431a50ffff";
const HELIUS_RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;


// --- Função fetchRugPullData ---
// Mover levelOrder para fora para estar acessível no sort
const levelOrder = { high: 0, medium: 1, low: 2, info: 3 };

async function fetchRugPullData(address: string, apiKey: string): Promise<RugPullResult> {
    console.log(`Iniciando análise real para o endereço: ${address}`);
    const warnings: RugPullResult['warnings'] = [];
    let riskScore = 0;
    const details: Record<string, any> = {};

    const heliusUrl = `https://devnet.helius-rpc.com/?api-key=${apiKey}`;

    const overallController = new AbortController();
    const overallTimeoutId = setTimeout(() => {
        console.error("Timeout geral da análise atingido.");
        overallController.abort();
    }, 20000);

    try {
        // 1. Obter Metadados do Ativo (Token)
        console.log("Buscando metadados do ativo...");
        let assetData: any = null;
        try {
            const assetResponse = await fetch(heliusUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'prophetfi-getAsset',
                    method: 'getAsset',
                    params: { id: address },
                }),
                signal: overallController.signal,
            });

            if (!assetResponse.ok) throw new Error(`Falha ao buscar metadados (${assetResponse.status}): ${assetResponse.statusText}`);
            assetData = await assetResponse.json();

            if (assetData.error) {
                 throw new Error(`Erro da API Helius (getAsset): ${assetData.error.message}`);
            }
        } catch (fetchError: any) {
             if (fetchError.name === 'AbortError') {
                 throw new Error("Timeout ao buscar metadados do ativo.");
             }
             throw new Error(`Erro de rede ao buscar metadados: ${fetchError.message}`);
        }


        if (!assetData.result) {
            warnings.push({ level: 'info', message: "O endereço fornecido não parece ser um token SPL ou NFT conhecido pela Helius." });
            details.asset = null;
        } else {
            details.asset = assetData.result;
            console.log("Metadados recebidos:", details.asset);

            // Análises baseadas nos metadados...
            if (details.asset.interface !== "V1_NFT" && details.asset.interface !== "FungibleToken" && details.asset.interface !== "FungibleAsset") {
                 warnings.push({ level: 'info', message: `Tipo de ativo não padrão detectado: ${details.asset.interface}. Análise pode ser limitada.` });
            }
             if (!details.asset.content) {
                warnings.push({ level: 'medium', message: "Metadados (conteúdo) do token não encontrados." });
                riskScore += 15;
            } else {
                 if (details.asset.mint_info?.mint_authority) {
                    warnings.push({ level: 'high', message: "Autoridade de mint ainda ativa. O fornecimento pode ser aumentado." });
                    riskScore += 30;
                 } else if (details.asset.mint_info) {
                    warnings.push({ level: 'low', message: "Autoridade de mint revogada ou inexistente." });
                 } else {
                     warnings.push({ level: 'info', message: "Não foi possível verificar a autoridade de mint (sem mint_info)." });
                 }

                 if (details.asset.mint_info?.freeze_authority) {
                    warnings.push({ level: 'medium', message: "Autoridade de congelamento ativa. As transferências podem ser bloqueadas." });
                    riskScore += 15;
                 } else if (details.asset.mint_info) {
                      warnings.push({ level: 'low', message: "Autoridade de congelamento revogada ou inexistente." });
                 } else {
                      warnings.push({ level: 'info', message: "Não foi possível verificar a autoridade de congelamento (sem mint_info)." });
                 }

                 if (!details.asset.content.metadata?.name || !details.asset.content.metadata?.symbol) {
                     warnings.push({ level: 'medium', message: "Metadados incompletos (sem nome ou símbolo)." });
                     riskScore += 10;
                 } else {
                     warnings.push({ level: 'info', message: `Token: ${details.asset.content.metadata.name} (${details.asset.content.metadata.symbol})` });
                 }

                 if (!details.asset.content.links?.website && !details.asset.content.links?.twitter && !details.asset.content.links?.telegram) {
                     warnings.push({ level: 'medium', message: "Faltam links sociais/website nos metadados." });
                     riskScore += 15;
                 } else {
                     warnings.push({ level: 'low', message: "Links sociais/website presentes nos metadados." });
                 }

                if(details.asset.mutable) {
                    warnings.push({ level: 'medium', message: "Metadados do token são mutáveis. Podem ser alterados." });
                    riskScore += 10;
                } else {
                     warnings.push({ level: 'low', message: "Metadados do token são imutáveis." });
                }
            }
             if (details.asset.ownership?.owner) {
                 warnings.push({ level: 'info', message: `Proprietário atual: ${details.asset.ownership.owner.substring(0,8)}...` });
            }
             if (details.asset.authorities?.length > 0) {
                 const updateAuth = details.asset.authorities.find((auth: any) => auth.scopes?.includes('full') || auth.scopes?.includes('metadata'));
                 if (updateAuth) {
                     warnings.push({ level: 'medium', message: `Endereço ${updateAuth.address.substring(0,8)}... tem autoridade de atualização.` });
                     riskScore += 5;
                 }
             }
             if (details.asset.compression?.compressed) {
                warnings.push({ level: 'info', message: "Este é um NFT Comprimido (compressed). A análise de liquidez tradicional não se aplica diretamente." });
            }
        }


        // 2. Obter Maiores Detentores e Supply
        if (details.asset && (details.asset.interface === "FungibleToken" || details.asset.interface === "FungibleAsset")) {
            console.log("Buscando supply e maiores detentores...");
            if (details.asset.mint_info?.supply && details.asset.mint_info.decimals !== undefined) {
                 const totalSupply = BigInt(details.asset.mint_info.supply);
                 const decimals = details.asset.mint_info.decimals;
                 const divisor = BigInt(10)**BigInt(decimals);
                 const supplyFormatted = divisor > 0 ? (totalSupply / divisor).toLocaleString() : totalSupply.toString();
                 warnings.push({ level: 'info', message: `Fornecimento total: ${supplyFormatted}` });

                 if (totalSupply === BigInt(0)) {
                     warnings.push({ level: 'medium', message: `Fornecimento total é zero.` });
                     riskScore += 5;
                 } else if (totalSupply > BigInt("1000000000" + "0".repeat(decimals))) {
                     warnings.push({ level: 'medium', message: `Fornecimento total elevado.` });
                     riskScore += 5;
                 }
                  let largestAccountsData: any = null;
                 try {
                     const largestAccountsResponse = await fetch(heliusUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                             jsonrpc: '2.0',
                             id: 'prophetfi-getTokenLargestAccounts',
                             method: 'getTokenLargestAccounts',
                             params: [address],
                          }),
                          signal: overallController.signal
                      });
                     if (!largestAccountsResponse.ok) throw new Error(`Falha ao buscar maiores detentores (${largestAccountsResponse.status})`);
                     largestAccountsData = await largestAccountsResponse.json();
                     if (largestAccountsData.error) throw new Error(`Erro da API Helius (getTokenLargestAccounts): ${largestAccountsData.error.message}`);
                 } catch (holderError: any) {
                      console.warn("Erro ao buscar maiores detentores:", holderError.message);
                      warnings.push({ level: 'info', message: "Não foi possível verificar a distribuição dos detentores." });
                 }

                 if (largestAccountsData?.result?.value?.length > 0 && totalSupply > 0) {
                     details.largestAccounts = largestAccountsData.result.value;
                     let topConcentration = BigInt(0);
                     const topN = Math.min(10, details.largestAccounts.length);
                     for(let i = 0; i < topN; i++) {
                         if (typeof details.largestAccounts[i].amount === 'string' && /^\d+$/.test(details.largestAccounts[i].amount)) {
                             topConcentration += BigInt(details.largestAccounts[i].amount);
                         } else {
                              console.warn(`Amount inválido encontrado no detentor ${i}:`, details.largestAccounts[i].amount);
                         }
                     }
                      if (topConcentration >= 0) {
                         const topPercentage = Number((topConcentration * BigInt(1000) / totalSupply)) / 10;
                         warnings.push({ level: 'info', message: `Top ${topN} detentores possuem ${topPercentage.toFixed(1)}% da supply.` });
                         if (topPercentage > 80) { riskScore += 35; warnings.push({ level: 'high', message: `Concentração muito alta nos ${topN} maiores detentores (>80%).` });}
                         else if (topPercentage > 50) { riskScore += 20; warnings.push({ level: 'medium', message: `Concentração alta nos ${topN} maiores detentores (>50%).` }); }
                         else if (topPercentage > 30) { riskScore += 5; warnings.push({ level: 'low', message: `Concentração moderada nos ${topN} maiores detentores (>30%).` }); }
                      } else {
                           warnings.push({ level: 'medium', message: "Não foi possível calcular a concentração dos detentores devido a dados inválidos." });
                           riskScore += 5;
                      }
                 } else if (largestAccountsData) {
                      warnings.push({ level: 'medium', message: "Não foram encontrados grandes detentores." });
                      riskScore += 5;
                 }


            } else {
                warnings.push({ level: 'medium', message: "Informação de supply/decimals não encontrada." });
                riskScore += 10;
            }
        } else if (details.asset && details.asset.interface === "V1_NFT") {
             warnings.push({ level: 'info', message: "Análise de detentores não aplicável a NFTs individuais." });
        }


        // 3. Verificar Liquidez (Simulação Mantida)
        console.log("Simulando verificação de liquidez...");
        if (!details.asset?.compression?.compressed) {
            const simulatedLiquidityLocked = Math.random() > 0.4;
            if (!simulatedLiquidityLocked) {
                 warnings.push({ level: 'high', message: "SIMULADO: Liquidez parece não estar bloqueada ou é insuficiente." });
                 riskScore += 40;
            } else {
                warnings.push({ level: 'low', message: "SIMULADO: Liquidez parece estar bloqueada." });
            }
        } else {
             warnings.push({ level: 'info', message: "Verificação de liquidez não aplicável a NFTs comprimidos." });
        }

        // --- Cálculo Final ---
        riskScore = Math.min(Math.max(riskScore, 0), 100);
        const isRugPull = riskScore > 70;

        // Ordenar warnings por nível de risco usando levelOrder definido fora da função
        warnings.sort((a, b) => {
            return levelOrder[a.level] - levelOrder[b.level];
        });


        console.log("Análise concluída.");
        return { riskScore, warnings, isRugPull, details };

    } catch (error: any) {
        clearTimeout(overallTimeoutId);
        console.error("Erro detalhado durante a análise:", error);
        const errorMessage = error.name === 'AbortError' ? "Timeout durante a análise." : error.message;
        return {
            riskScore: -1,
            warnings: [{ level: 'high', message: `Falha ao analisar: ${errorMessage}` }],
            isRugPull: true,
            details: { error: error.message },
        };
    } finally {
         clearTimeout(overallTimeoutId);
    }
}
// --- Fim da Função ---


// Componente da página de Deteção de Rug Pull
const RugPullDetectionPage: React.FC = () => {
    // Hooks e Estados
    const [walletAdapterHooks, setWalletAdapterHooks] = useState<{
        useConnection: () => ConnectionAdapterProps,
        useWallet: () => WalletAdapterProps
    } | null>(null);
    const [web3JsClasses, setWeb3JsClasses] = useState<{
        SystemProgram: any,
        Transaction: any,
        LAMPORTS_PER_SOL: number,
        PublicKey: any
    } | null>(null);
     const [UiComponents, setUiComponents] = useState<{ WalletMultiButton: React.FC<any> | null }>({ WalletMultiButton: null });


    // Usar os hooks do estado local depois de carregados
    const { connection } = walletAdapterHooks?.useConnection() ?? { connection: null };
    const { publicKey, sendTransaction } = walletAdapterHooks?.useWallet() ?? { publicKey: null, sendTransaction: async () => '' };
    // Usar o componente do estado local depois de carregado
    const LocalWalletMultiButton = UiComponents.WalletMultiButton;


    const [isClient, setIsClient] = useState(false);
    const [addressToCheck, setAddressToCheck] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<RugPullResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [feePaid, setFeePaid] = useState<boolean>(false);

    useEffect(() => {
        setIsClient(true);
        // Carregar hooks do adapter
        import('@solana/wallet-adapter-react').then(walletAdapterReact => {
            setWalletAdapterHooks({
                useConnection: walletAdapterReact.useConnection,
                useWallet: walletAdapterReact.useWallet,
            });
        }).catch(err => console.error("Failed to load wallet hooks:", err));

        // Carregar classes do web3.js
        import('@solana/web3.js').then(web3 => {
            setWeb3JsClasses({
                 SystemProgram: web3.SystemProgram,
                 Transaction: web3.Transaction,
                 LAMPORTS_PER_SOL: web3.LAMPORTS_PER_SOL,
                 PublicKey: web3.PublicKey
             });
        }).catch(err => console.error("Failed to load @solana/web3.js:", err));

        // Carregar componentes UI
        import('@solana/wallet-adapter-react-ui').then(ui => {
             // REMOVIDO: Tentativa de importar CSS dinamicamente
             // import('@solana/wallet-adapter-react-ui/styles.css').catch(cssErr => console.error("Failed to load wallet styles:", cssErr));
             setUiComponents({ WalletMultiButton: ui.WalletMultiButton });
         }).catch(err => console.error("Failed to load wallet UI components:", err));

    }, []);


    const feeAmountSOL = 0.01;
    const feeReceiverAddress = '4hSVNpgfh1tzn91jgbpH6fVEQ25b63Vd9cvLMJhE3FEf';

    const handleCheckAddress = useCallback(async () => {
        if (!isClient || !connection || !publicKey || !sendTransaction || !web3JsClasses) {
             setError("Componentes da carteira ou Web3.js ainda não estão prontos.");
             console.error("Dependências não prontas", { isClient, connection, publicKey, sendTransaction, web3JsClasses });
             return;
         }
         const { SystemProgram: ImportedSystemProgram, Transaction: ImportedTransaction, LAMPORTS_PER_SOL: ImportedLamports, PublicKey: ImportedPublicKey } = web3JsClasses;


        const trimmedAddress = addressToCheck.trim();
        if (!trimmedAddress) {
            setError("Por favor, insira um endereço Solana para verificar.");
            return;
        }

        try {
             new ImportedPublicKey(trimmedAddress);
         } catch (err) {
             setError("Formato de endereço Solana inválido.");
             return;
         }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setFeePaid(false);

        try {
            console.log("Iniciando pagamento da taxa...");
            const transaction = new ImportedTransaction();
            transaction.add(
                ImportedSystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new ImportedPublicKey(feeReceiverAddress),
                    lamports: feeAmountSOL * ImportedLamports,
                })
            );

            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext('confirmed');
             transaction.recentBlockhash = blockhash;
             transaction.feePayer = publicKey;

            console.log("Enviando transação de taxa...");
            const signature = await sendTransaction(transaction, connection, {
                 minContextSlot,
                 skipPreflight: false
             });

            console.log("Confirmando transação de taxa...");
            const confirmation = await connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature
            }, 'confirmed');

            if (confirmation.value.err) {
                try {
                     const txDetails = await connection.getConfirmedTransaction(signature, 'confirmed');
                     console.error("Logs da transação falhada:", txDetails?.meta?.logMessages);
                     throw new Error(`Falha na confirmação da transação da taxa: ${JSON.stringify(confirmation.value.err)}. Logs: ${txDetails?.meta?.logMessages?.join('; ') || 'N/A'}`);
                } catch (logError) {
                     console.error("Erro ao buscar logs da transação:", logError);
                     throw new Error(`Falha na confirmação da transação da taxa: ${JSON.stringify(confirmation.value.err)}`);
                }
            }


            console.log(`Transação de pagamento da taxa confirmada com assinatura: ${signature}`);
            setFeePaid(true);

            console.log(`Iniciando verificação do endereço: ${trimmedAddress}`);
            const analysisResult = await fetchRugPullData(trimmedAddress, HELIUS_API_KEY);

            if (analysisResult.riskScore === -1 && analysisResult.warnings.length > 0) {
                 setError(analysisResult.warnings[0].message);
                 setResult(null);
            } else {
                 setResult(analysisResult);
            }

        } catch (err: any) {
            console.error("Falha detalhada na verificação ou pagamento:", err);
             let userMessage = `Ocorreu um erro: ${err.message || 'Erro desconhecido.'}`;
             if (err.name === 'WalletSendTransactionError') { userMessage = `Erro ao enviar transação: ${err.message}. Verifique sua carteira.`; if (err.message.includes('blockhash')) { userMessage += " O blockhash pode ter expirado, tente novamente."; } }
             else if (err.message.includes('User rejected the request')) { userMessage = "Transação rejeitada."; }
             else if (err.message.includes('confirmTransaction')) { userMessage = "Falha na confirmação da transação da taxa."; }
             else if (err.message.includes('Network request failed') || err.message.includes('Failed to fetch')) { userMessage = "Erro de rede."; }
             else if (err.name === 'AbortError') { userMessage = "A operação demorou muito (timeout)."; }
             else if (err instanceof Error && err.message.includes("Cannot read properties of null (reading 'getLatestBlockhashAndContext')")) { userMessage = "Erro de conexão (Devnet?)."; }

            setError(userMessage);
            setFeePaid(false);
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    }, [isClient, connection, publicKey, sendTransaction, addressToCheck, web3JsClasses]);

    // Funções auxiliares
     const getWarningIconAndColor = (level: RugPullResult['warnings'][0]['level']): { icon: React.ElementType, color: string } => {
         // Usa a constante levelOrder definida globalmente no escopo do ficheiro
         switch (level) {
             case 'high': return { icon: XCircle, color: 'text-red-400' };
             case 'medium': return { icon: AlertTriangle, color: 'text-amber-400' };
             case 'low': return { icon: CheckCircle, color: 'text-emerald-400' };
             default: return { icon: CheckCircle, color: 'text-slate-400' }; // info
         }
     };

     const getRiskScoreColor = (score: number): string => {
         if (score > 70) return 'text-red-500';
         if (score > 40) return 'text-amber-500';
         if (score <= 40 && score >= 0) return 'text-emerald-500';
         return 'text-slate-500';
     };


    // Renderização do componente
    const renderWalletButton = () => {
        if (!isClient || !LocalWalletMultiButton) {
            return <div className="h-[40px] w-[150px] bg-indigo-500 rounded-md animate-pulse"></div>;
        }
        // Renderiza o botão real apenas no cliente
        return <LocalWalletMultiButton style={{ height: '40px', backgroundColor: '#6366f1', borderRadius: '6px' }}/>;
    };

    return (
      // JSX da UI (mantido como na versão anterior)
      <div className="bg-slate-900 py-16 sm:py-24 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-base font-semibold leading-7 text-indigo-500">Segurança com IA</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Detector de Rug Pull Solana
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Conecte sua carteira, insira um endereço de token/contrato e pague {feeAmountSOL} SOL para uma avaliação de risco.
            </p>
          </div>

          <div className="bg-slate-800/60 p-6 sm:p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
             <div className="mb-6 flex flex-col items-center">
                 {!isClient || !publicKey ? (
                     <>
                        <p className="text-center text-slate-400 mb-4">Conecte sua carteira para começar.</p>
                        {renderWalletButton()}
                     </>
                 ) : (
                    <div className="text-center text-emerald-400 flex items-center justify-center text-sm sm:text-base">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2"/> Conectado: <span className="truncate max-w-[150px] sm:max-w-xs">{publicKey.toBase58()}</span>
                    </div>
                 )}
            </div>

            {isClient && publicKey && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="solana-address" className="block text-sm font-medium leading-6 text-slate-300 mb-1.5">
                           Endereço Solana (Token ou Contrato)
                        </label>
                        <div className="relative">
                           <input
                              type="text"
                              name="solana-address"
                              id="solana-address"
                              value={addressToCheck}
                              onChange={(e) => {
                                  setAddressToCheck(e.target.value);
                                  setError(null);
                                  setResult(null);
                              }}
                              className="block w-full rounded-md border-0 bg-slate-700/30 py-2 px-3 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-600/50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 placeholder:text-slate-500"
                              placeholder="Insira o endereço..."
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
                                {feePaid ? 'Analisando...' : 'Processando Taxa...'}
                            </>
                        ) : (
                           <> <Search className="mr-2 h-4 w-4" /> Verificar ({feeAmountSOL} SOL)</>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-6 rounded-md bg-red-950/50 p-3 sm:p-4 text-center text-red-400 border border-red-800/50 text-sm">
                    <AlertTriangle className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2 align-middle" /> {error}
                </div>
            )}

            {isLoading && !result && !error && (
                 <div className="mt-6 text-center text-slate-400 text-sm">
                    <p>{feePaid ? 'Executando análise...' : 'Aguardando confirmação da taxa na sua carteira...'}</p>
                 </div>
            )}

            {result && !isLoading && result.riskScore !== -1 && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-800/40 rounded-lg border border-slate-700/50">
                 <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3 sm:mb-4 text-center">Resultado da Análise</h3>
                <div className="text-center mb-3 sm:mb-4">
                  <span className={`text-4xl sm:text-5xl font-bold ${getRiskScoreColor(result.riskScore)}`}>
                    {result.riskScore}
                  </span>
                  <span className="text-slate-400 text-sm"> / 100 Pontuação de Risco</span>
                </div>
                 <div className={`text-center font-semibold mb-4 sm:mb-6 text-sm sm:text-base ${result.isRugPull ? 'text-red-400' : getRiskScoreColor(result.riskScore)}`}>
                    {result.isRugPull ? 'ALTO RISCO / POTENCIAL RUG PULL DETECTADO' : (result.riskScore > 40 ? 'RISCO MODERADO DETECTADO' : 'RISCO BAIXO DETECTADO')}
                 </div>
                {result.warnings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-indigo-400 mb-2 text-base">
                        Detalhes da Análise:
                    </h4>
                    <ul className="space-y-1.5 text-xs sm:text-sm">
                      {result.warnings.map((warning, index) => {
                         const { icon: Icon, color } = getWarningIconAndColor(warning.level);
                         return (
                            <li key={index} className={`flex items-start ${color}`}>
                              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{warning.message}</span>
                            </li>
                         );
                      })}
                    </ul>
                  </div>
                )}
                 <p className="text-xs text-slate-500 mt-4 sm:mt-6 text-center">Aviso: Análise baseada em dados da API Helius e heurísticas. Não é aconselhamento financeiro. DYOR.</p>

              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default RugPullDetectionPage;

