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
        // Verifica se a carteira está conectada
        if (!publicKey) {
            setError("Por favor, conecte sua carteira primeiro.");
            return;
        }
        // Verifica se um endereço foi inserido
        const trimmedAddress = addressToCheck.trim();
        if (!trimmedAddress) {
            setError("Por favor, insira um endereço Solana para verificar.");
            return;
        }

        // Validação básica do formato do endereço Solana
        try {
            new PublicKey(trimmedAddress);
        } catch (err) {
            setError("Formato de endereço Solana inválido.");
            return;
        }

        // Reseta estados e inicia o carregamento
        setIsLoading(true);
        setError(null);
        setResult(null);
        setFeePaid(false); // Reseta o status da taxa para a nova verificação

        try {
            // --- Simulação da Transação de Taxa ---
            console.log("Simulando pagamento da taxa...");
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(feeReceiverAddress), // Usa o endereço real do receptor
                    lamports: feeAmountSOL * LAMPORTS_PER_SOL, // Converte SOL para Lamports
                })
            );

            // Obtém o blockhash mais recente para a transação
            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();

            // Envia a transação usando o adaptador da carteira
            const signature = await sendTransaction(transaction, connection, { minContextSlot });

            // Confirma a transação na rede
            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

            console.log(`Transação de pagamento da taxa bem-sucedida com assinatura: ${signature}`);
            setFeePaid(true); // Marca a taxa como paga

            // --- Simulação da Chamada à API de Verificação de Rug Pull ---
            console.log(`Verificando endereço: ${trimmedAddress}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simula atraso de rede

            // --- Resultado Mock (Simulado) ---
            // Substitua esta parte pela sua chamada de API real e tratamento do resultado
            const mockRisk = Math.random(); // Simula um fator de risco
            const mockResult: RugPullResult = {
                riskScore: Math.floor(mockRisk * 100),
                isRugPull: mockRisk > 0.7, // Limite de exemplo para considerar rug pull
                warnings: [],
            };

            // Adiciona avisos com base no risco simulado
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

            setResult(mockResult); // Define o resultado no estado

        } catch (err: any) {
            console.error("Falha na verificação de rug pull:", err);
            // Trata erros específicos da transação ou outros erros
             if (err.message.includes('User rejected the request')) {
                setError("Transação rejeitada. Por favor, aprove o pagamento da taxa para prosseguir.");
            } else if (err.message.includes('blockhash') || err.message.includes('timeout')) {
                setError("A transação expirou ou falhou na confirmação. Por favor, tente novamente.");
            }
             else {
                setError(`Ocorreu um erro: ${err.message || 'Erro desconhecido'}`);
            }
            setFeePaid(false); // Reseta o status da taxa em caso de erro
        } finally {
            setIsLoading(false); // Finaliza o carregamento
        }
    }, [publicKey, addressToCheck, connection, sendTransaction, feeReceiverAddress]); // Inclui feeReceiverAddress nas dependências

    // Função para obter a cor do texto com base na pontuação de risco
    const getRiskColor = (score: number): string => {
        if (score > 70) return 'text-red-500'; // Risco alto
        if (score > 40) return 'text-yellow-500'; // Risco médio
        return 'text-green-500'; // Risco baixo
    };

    return (
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Cabeçalho da Página */}
          <div className="text-center mb-16">
            <p className="text-base font-semibold leading-7 text-indigo-400">Segurança com IA</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Detector de Rug Pull Solana
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Conecte sua carteira, insira um endereço de token ou contrato Solana e pague uma pequena taxa ({feeAmountSOL} SOL) para obter uma avaliação de risco com IA.
            </p>
          </div>

          {/* Área de Interação */}
          <div className="bg-gray-800/50 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
            {/* Status da Conexão da Carteira */}
             <div className="mb-6 flex flex-col items-center">
                {!publicKey ? (
                     <>
                        <p className="text-center text-gray-400 mb-4">Conecte sua carteira para começar.</p>
                        {/* Botão de conexão da carteira */}
                        <WalletMultiButton style={{ backgroundColor: '#4f46e5', borderRadius: '6px' }}/>
                     </>
                ) : (
                    <div className="text-center text-green-400 flex items-center">
                        <Wallet className="w-5 h-5 mr-2"/> Conectado: {publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().substring(publicKey.toBase58().length - 4)}
                    </div>
                )}
            </div>

            {/* Input do Endereço e Botão de Verificação (mostrado apenas se a carteira estiver conectada) */}
            {publicKey && (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="solana-address" className="block text-sm font-medium leading-6 text-gray-300 mb-2">
                           Endereço Solana (Token ou Contrato)
                        </label>
                        <div className="relative">
                           <input
                              type="text"
                              name="solana-address"
                              id="solana-address"
                              value={addressToCheck}
                              onChange={(e) => setAddressToCheck(e.target.value)}
                              className="block w-full rounded-md border-0 bg-white/5 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 placeholder:text-gray-500"
                              placeholder="Insira o endereço..."
                              disabled={isLoading} // Desabilita durante o carregamento
                           />
                        </div>
                    </div>

                    <button
                        onClick={handleCheckAddress}
                        disabled={isLoading || !publicKey || !addressToCheck.trim()} // Desabilita se carregando, sem carteira ou sem endereço
                        className="w-full flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {/* Mensagem dinâmica durante o carregamento */}
                                {feePaid ? 'Analisando...' : 'Processando Taxa...'}
                            </>
                        ) : (
                           <> <Search className="mr-2 h-4 w-4" /> Verificar Endereço ({feeAmountSOL} SOL)</>
                        )}
                    </button>
                </div>
            )}

            {/* Área de Resultados */}
            {/* Exibe erro, se houver */}
            {error && (
                <div className="mt-6 rounded-md bg-red-900/50 p-4 text-center text-red-300 border border-red-700">
                    <AlertTriangle className="inline-block w-5 h-5 mr-2" /> {error}
                </div>
            )}

            {/* Mensagem durante o carregamento */}
            {isLoading && !result && (
                 <div className="mt-6 text-center text-gray-400">
                    <p>{feePaid ? 'Executando análise de IA...' : 'Aguardando confirmação da taxa...'}</p>
                 </div>
            )}

            {/* Exibe o resultado da análise */}
            {result && !isLoading && (
              <div className="mt-8 p-6 bg-gray-700/30 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Resultado da Análise</h3>
                <div className="text-center mb-4">
                  {/* Pontuação de Risco */}
                  <span className={`text-5xl font-bold ${getRiskColor(result.riskScore)}`}>
                    {result.riskScore}
                  </span>
                  <span className="text-gray-400"> / 100 Pontuação de Risco</span>
                </div>
                 {/* Indicação de Risco */}
                 <div className={`text-center font-semibold mb-6 ${result.isRugPull ? 'text-red-400' : 'text-green-400'}`}>
                    {result.isRugPull ? 'Alto Risco / Potencial Rug Pull Detectado' : 'Risco Baixo Detectado'}
                 </div>
                {/* Avisos e Observações */}
                {result.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-indigo-300 mb-2">Avisos e Observações:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                 {/* Aviso Legal */}
                 <p className="text-xs text-gray-500 mt-6 text-center">Aviso: Esta é uma análise automatizada e não constitui aconselhamento financeiro. Faça sua própria pesquisa (DYOR).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default RugPullDetectionPage;
