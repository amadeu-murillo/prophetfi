"use client"; // Necessário para hooks como useState, useCallback e hooks do wallet-adapter

import React, { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Search, Loader2, AlertTriangle, Wallet } from 'lucide-react';

// Interface para definir a estrutura do resultado da deteção
interface RugPullResult {
    riskScore: number; // Pontuação de risco (0-100)
    warnings: string[]; // Lista de avisos ou observações
    isRugPull: boolean; // Indica se é um potencial rug pull
}

// Componente da página de Deteção de Rug Pull
const RugPullDetectionPage: React.FC = () => {
    const { connection } = useConnection(); // Hook para obter a conexão Solana
    const { publicKey, sendTransaction } = useWallet(); // Hook para obter a chave pública e função de envio de transação da carteira conectada
    const [addressToCheck, setAddressToCheck] = useState<string>(''); // Estado para o endereço a ser verificado
    const [isLoading, setIsLoading] = useState<boolean>(false); // Estado para indicar carregamento
    const [result, setResult] = useState<RugPullResult | null>(null); // Estado para armazenar o resultado da análise
    const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro
    const [feePaid, setFeePaid] = useState<boolean>(false); // Estado para rastrear se a taxa foi paga na verificação atual

    const feeAmountSOL = 0.01; // Quantidade da taxa em SOL (exemplo)
    // IMPORTANTE: Substitua pelo seu endereço real de recebimento de taxas na Solana!
    const feeReceiverAddress = '4hSVNpgfh1tzn91jgbpH6fVEQ25b63Vd9cvLMJhE3FEf';

    // Função para lidar com a verificação do endereço
    const handleCheckAddress = useCallback(async () => {
        if (!publicKey) {
            setError("Por favor, conecte sua carteira primeiro.");
            return;
        }
        const trimmedAddress = addressToCheck.trim();
        if (!trimmedAddress) {
            setError("Por favor, insira um endereço Solana para verificar.");
            return;
        }

        try {
            new PublicKey(trimmedAddress);
        } catch (err) {
            setError("Formato de endereço Solana inválido.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setFeePaid(false);

        try {
            console.log("Simulando pagamento da taxa...");
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(feeReceiverAddress),
                    lamports: feeAmountSOL * LAMPORTS_PER_SOL,
                })
            );

            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();

            const signature = await sendTransaction(transaction, connection, { minContextSlot });

            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

            console.log(`Transação de pagamento da taxa bem-sucedida com assinatura: ${signature}`);
            setFeePaid(true);

            console.log(`Verificando endereço: ${trimmedAddress}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simula atraso

            // --- Resultado Mock (Simulado) ---
            const mockRisk = Math.random();
            const mockResult: RugPullResult = {
                riskScore: Math.floor(mockRisk * 100),
                isRugPull: mockRisk > 0.7,
                warnings: [],
            };

            if (mockRisk > 0.8) {
                mockResult.warnings.push("Alta concentração de tokens nas carteiras principais.");
                mockResult.warnings.push("Pool de liquidez desbloqueada ou controlada pelo deployer.");
            } else if (mockRisk > 0.5) {
                mockResult.warnings.push("Concentração moderada de tokens.");
                mockResult.warnings.push("Nenhuma atividade recente significativa do desenvolvedor.");
            } else {
                 mockResult.warnings.push("Baixa concentração de tokens.");
                 mockResult.warnings.push("Liquidez parece bloqueada.");
            }

            setResult(mockResult);

        } catch (err: any) {
            console.error("Falha na verificação de rug pull:", err);
             if (err.message.includes('User rejected the request')) {
                setError("Transação rejeitada. Por favor, aprove o pagamento da taxa para prosseguir.");
            } else if (err.message.includes('blockhash') || err.message.includes('timeout')) {
                setError("A transação expirou ou falhou na confirmação. Por favor, tente novamente.");
            }
             else {
                setError(`Ocorreu um erro: ${err.message || 'Erro desconhecido'}`);
            }
            setFeePaid(false);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, addressToCheck, connection, sendTransaction, feeReceiverAddress]);

    // Função para obter a cor do texto com base na pontuação de risco (usando cores mais adequadas)
    const getRiskColor = (score: number): string => {
        if (score > 70) return 'text-red-500'; // Risco alto
        if (score > 40) return 'text-amber-500'; // Risco médio (âmbar)
        return 'text-emerald-500'; // Risco baixo (esmeralda)
    };

    return (
      // Fundo slate-900
      <div className="bg-slate-900 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Cabeçalho da Página */}
          <div className="text-center mb-16">
            {/* Subtítulo indigo-500 */}
            <p className="text-base font-semibold leading-7 text-indigo-500">Segurança com IA</p>
            {/* Título slate-100 */}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Detector de Rug Pull Solana
            </h1>
            {/* Parágrafo slate-300 */}
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Conecte sua carteira, insira um endereço de token ou contrato Solana e pague uma pequena taxa ({feeAmountSOL} SOL) para obter uma avaliação de risco com IA.
            </p>
          </div>

          {/* Área de Interação */}
          {/* Fundo slate-800/60 */}
          <div className="bg-slate-800/60 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
            {/* Status da Conexão da Carteira */}
             <div className="mb-6 flex flex-col items-center">
                {!publicKey ? (
                     <>
                        {/* Texto slate-400 */}
                        <p className="text-center text-slate-400 mb-4">Conecte sua carteira para começar.</p>
                        {/* Botão da carteira com cor indigo-500 */}
                        <WalletMultiButton style={{ backgroundColor: '#6366f1', borderRadius: '6px' }}/>
                     </>
                ) : (
                    // Texto emerald-400 para conectado
                    <div className="text-center text-emerald-400 flex items-center">
                        <Wallet className="w-5 h-5 mr-2"/> Conectado: {publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().substring(publicKey.toBase58().length - 4)}
                    </div>
                )}
            </div>

            {/* Input do Endereço e Botão de Verificação */}
            {publicKey && (
                <div className="space-y-6">
                    <div>
                        {/* Label slate-300 */}
                        <label htmlFor="solana-address" className="block text-sm font-medium leading-6 text-slate-300 mb-2">
                           Endereço Solana (Token ou Contrato)
                        </label>
                        <div className="relative">
                           <input
                              type="text"
                              name="solana-address"
                              id="solana-address"
                              value={addressToCheck}
                              onChange={(e) => setAddressToCheck(e.target.value)}
                              // Estilos do input atualizados para slate
                              className="block w-full rounded-md border-0 bg-slate-700/30 py-2.5 px-3 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-600/50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 placeholder:text-slate-500"
                              placeholder="Insira o endereço..."
                              disabled={isLoading}
                           />
                        </div>
                    </div>

                    <button
                        onClick={handleCheckAddress}
                        disabled={isLoading || !publicKey || !addressToCheck.trim()}
                        // Botão com indigo-500 e hover indigo-600
                        className="w-full flex justify-center items-center rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {feePaid ? 'Analisando...' : 'Processando Taxa...'}
                            </>
                        ) : (
                           <> <Search className="mr-2 h-4 w-4" /> Verificar Endereço ({feeAmountSOL} SOL)</>
                        )}
                    </button>
                </div>
            )}

            {/* Área de Resultados */}
            {error && (
                // Erro com fundo red-950, texto red-400 e borda red-800
                <div className="mt-6 rounded-md bg-red-950/50 p-4 text-center text-red-400 border border-red-800/50">
                    <AlertTriangle className="inline-block w-5 h-5 mr-2" /> {error}
                </div>
            )}

            {isLoading && !result && (
                 // Texto de carregamento slate-400
                 <div className="mt-6 text-center text-slate-400">
                    <p>{feePaid ? 'Executando análise de IA...' : 'Aguardando confirmação da taxa...'}</p>
                 </div>
            )}

            {result && !isLoading && (
              // Área de resultado com fundo slate-800/40 e borda slate-700
              <div className="mt-8 p-6 bg-slate-800/40 rounded-lg border border-slate-700/50">
                {/* Título slate-100 */}
                <h3 className="text-xl font-semibold text-slate-100 mb-4 text-center">Resultado da Análise</h3>
                <div className="text-center mb-4">
                  <span className={`text-5xl font-bold ${getRiskColor(result.riskScore)}`}>
                    {result.riskScore}
                  </span>
                  {/* Texto secundário slate-400 */}
                  <span className="text-slate-400"> / 100 Pontuação de Risco</span>
                </div>
                 {/* Indicação de Risco com cores ajustadas */}
                 <div className={`text-center font-semibold mb-6 ${result.isRugPull ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.isRugPull ? 'Alto Risco / Potencial Rug Pull Detectado' : 'Risco Baixo Detectado'}
                 </div>
                {result.warnings.length > 0 && (
                  <div>
                    {/* Título dos avisos indigo-400 */}
                    <h4 className="font-semibold text-indigo-400 mb-2">Avisos e Observações:</h4>
                    {/* Texto dos avisos slate-300 */}
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                 {/* Aviso Legal slate-500 */}
                 <p className="text-xs text-slate-500 mt-6 text-center">Aviso: Esta é uma análise automatizada e não constitui aconselhamento financeiro. Faça sua própria pesquisa (DYOR).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default RugPullDetectionPage;
