// --- Componente para Exibir Resultados da Análise ---
import React, { useMemo } from 'react';
import { Info, BarChart2, Users, FileText, Link as LinkIcon, Activity, UserCog, CalendarDays } from 'lucide-react'; // Droplet removido
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { RugPullResult, WarningCategory, AnalysisWarning, TopHolder } from '@/app/lib/rugPullTypes';
import { getRiskScoreColorClass, getStatusColorClass, getWarningIconAndColor, groupWarningsByCategory } from '@/app/lib/rugPullUtils';

interface RugPullResultsDisplayProps {
    result: RugPullResult;
}

// Define the type for the chart data explicitly
interface HolderChartData {
    name: string;
    percentage: number;
    amountFormatted: string;
}


const RugPullResultsDisplay: React.FC<RugPullResultsDisplayProps> = ({ result }) => {

    // Agrupa avisos por categoria
    const groupedWarnings = useMemo(() => groupWarningsByCategory(result.warnings), [result.warnings]);

    // Prepara dados para o gráfico de detentores
    const holderChartData: HolderChartData[] = useMemo(() => {
        if (!result.details?.topHolders) return [];
        return result.details.topHolders.slice(0, 10).map((h: TopHolder) => ({
            name: `${h.address.substring(0, 4)}...${h.address.substring(h.address.length - 4)}`,
            percentage: typeof h.percentage === 'number' ? h.percentage : 0,
            amountFormatted: h.uiAmountFormatted || h.amount
        }));
    }, [result.details?.topHolders]);

    // Helper para formatar supply
    const formatSupply = (supply: string | undefined, decimals: number | undefined): string => {
        if (supply === undefined || decimals === undefined) return 'N/A';
        try {
            const supplyBI = BigInt(supply);
            if (decimals === 0) return supplyBI.toLocaleString();
            const divisor = BigInt(10) ** BigInt(decimals);
            if (divisor === BigInt(0)) return supplyBI.toLocaleString();
            const value = Number(supplyBI * BigInt(100) / divisor) / 100;
            return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
        } catch (e) {
            console.error("Erro formatando supply:", e, { supply, decimals });
            return 'Erro';
        }
    };

     // Helper para formatar timestamp Unix (segundos) para data local
     const formatTimestamp = (timestamp: number | null | undefined): string => {
        if (timestamp === null || timestamp === undefined) return 'N/A';
        try {
            if (isNaN(timestamp) || timestamp < 0 || timestamp > Date.now() / 1000 + (365 * 24 * 60 * 60)) {
                 console.warn("Timestamp inválido recebido:", timestamp);
                 return 'Data Inválida';
            }
            const date = new Date(timestamp * 1000);
            return date.toLocaleString();
        } catch (e) {
            console.error("Erro formatando timestamp:", e);
            return 'Inválido';
        }
    };


    return (
        <div className="mt-8 p-4 sm:p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 space-y-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-4 text-center border-b border-slate-700 pb-3">Resultado da Análise</h3>

            {/* Resumo e Pontuação */}
            <div className="text-center space-y-2">
                <div className='mb-4'>
                    <span className={`text-5xl sm:text-6xl font-bold ${getRiskScoreColorClass(result.riskScore)}`}>
                        {result.riskScore >= 0 ? result.riskScore : '?'}
                    </span>
                    <span className="text-slate-400 text-lg"> / 100</span>
                    <p className="text-sm text-slate-500 flex items-center justify-center mt-1">
                        Pontuação de Risco
                        <span title="Calculado com base em distribuição de detentores, metadados (mutabilidade, autoridades), histórico do criador (limitado) e atividade recente (limitada)." className="ml-1 cursor-help"> {/* REMOVIDO 'liquidez' */}
                            <Info size={14} />
                        </span>
                    </p>
                </div>
                <p className={`font-semibold text-lg sm:text-xl ${getStatusColorClass(result.status)}`}>
                    {result.status.toUpperCase()}
                </p>
                <p className="text-sm text-slate-300 max-w-xl mx-auto">{result.summary}</p>
            </div>

            {/* Detalhes e Avisos */}
            <div className="space-y-4">
                <h4 className="font-semibold text-indigo-400 text-lg border-b border-indigo-800/50 pb-1">Detalhes da Análise por Categoria</h4>
                {Object.entries(groupedWarnings).length > 0 ? (
                    Object.entries(groupedWarnings).map(([category, warningsList]) => (
                        <div key={category} className="bg-slate-800/50 p-3 rounded-md border border-slate-700/60">
                            <h5 className="font-medium text-slate-200 mb-2 text-base flex items-center">
                                {/* Simple mapping for category icons */}
                                {category === 'Holders' && <Users size={16} className="mr-2 opacity-70" />}
                                {/* {category === 'Liquidity' && <Droplet size={16} className="mr-2 opacity-70" />} REMOVIDO */}
                                {category === 'Metadata' && <FileText size={16} className="mr-2 opacity-70" />}
                                {category === 'Creator' && <UserCog size={16} className="mr-2 opacity-70" />}
                                {category === 'Activity' && <Activity size={16} className="mr-2 opacity-70" />}
                                {category === 'General' && <Info size={16} className="mr-2 opacity-70" />}
                                {category}
                            </h5>
                            <ul className="space-y-1.5 text-xs sm:text-sm">
                                {warningsList.map((warning, index) => {
                                    const iconInfo = getWarningIconAndColor(warning.level);
                                    const Icon = iconInfo.icon;
                                    const colorClass = iconInfo.colorClass;
                                    return (
                                        <li key={`${category}-${index}`} className={`flex items-start ${colorClass.split(' ')[0]}`}>
                                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="break-words">{warning.message}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))
                ) : (
                     result.warnings.length === 0 ? <p className="text-slate-400 text-sm">Nenhum ponto de análise específico encontrado.</p> : null
                )}
            </div>

            {/* Seção de Detentores */}
            {result.details?.topHolders && result.details.topHolders.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-700/50">
                    <h4 className="font-semibold text-indigo-400 text-lg pb-1 flex items-center"><Users size={18} className="mr-2" /> Top 10 Detentores</h4>
                    {holderChartData.length > 0 ? (
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={holderChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} interval={0} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(71, 85, 105, 0.3)' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px' }}
                                        labelStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                                        itemStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                                        formatter={(value: number, name: string, props: any) => [`${value.toFixed(2)}% (${props.payload.amountFormatted})`, 'Percentagem (Quantidade)']}
                                        labelFormatter={(label: string) => `Endereço: ${label}`}
                                    />
                                    <Bar dataKey="percentage" fill="#6366f1" barSize={15}>
                                        {holderChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.percentage > 50 ? '#ef4444' : entry.percentage > 20 ? '#f59e0b' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">Dados do gráfico de detentores indisponíveis.</p>
                    )}
                    <p className="text-xs text-slate-500">Endereços dos 10 maiores detentores e a sua % do fornecimento total.</p>
                </div>
            )}

            {/* REMOVIDO: Seção de Liquidez */}

            {/* Seção de Metadados */}
            {result.details?.asset && (
                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    <h4 className="font-semibold text-indigo-400 text-lg pb-1 flex items-center"><FileText size={18} className="mr-2" /> Metadados do Ativo</h4>
                    <dl className="text-xs sm:text-sm text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Nome:</dt><dd className="mt-1">{result.details.asset.content?.metadata?.name || 'N/A'}</dd></div>
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Símbolo:</dt><dd className="mt-1">{result.details.asset.content?.metadata?.symbol || 'N/A'}</dd></div>
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Decimais:</dt><dd className="mt-1">{result.details.decimals ?? 'N/A'}</dd></div>
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Supply:</dt><dd className="mt-1">{formatSupply(result.details.totalSupply, result.details.decimals)}</dd></div>
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Mutável:</dt><dd className="mt-1">{result.details.asset.mutable ? 'Sim' : 'Não'}</dd></div>
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Mint Revogada:</dt><dd className="mt-1">{result.details.asset.interface === "V1_NFT" ? 'N/A (NFT)' : (result.details.asset.mint_info?.mint_authority ? 'Não' : 'Sim')}</dd></div>
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Freeze Revogada:</dt><dd className="mt-1">{result.details.asset.mint_info?.freeze_authority ? 'Não' : 'Sim'}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-slate-400 font-medium">Criador/Update Auth:</dt><dd className="mt-1"><code className="text-xs break-all">{result.details.creatorAddress || 'N/A'}</code></dd></div>
                        <div className="sm:col-span-2"><dt className="text-slate-400 font-medium">JSON URI:</dt><dd className="mt-1"><code className="text-xs break-all">{result.details.asset.content?.json_uri || 'N/A'}</code></dd></div>
                    </dl>
                </div>
            )}

             {/* Seção de Histórico do Criador */}
            {result.details?.creatorHistory && result.details.creatorAddress && (
                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    <h4 className="font-semibold text-indigo-400 text-lg pb-1 flex items-center"><UserCog size={18} className="mr-2" /> Histórico do Criador <code className='text-xs ml-2'>({result.details.creatorAddress.substring(0,6)}...)</code></h4>
                     <dl className="text-xs sm:text-sm text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Assinaturas Recentes:</dt><dd className="mt-1">{result.details.creatorHistory.signatureCount ?? 'N/A'} (na Helius)</dd></div>
                        <div className="sm:col-span-1"><dt className="text-slate-400 font-medium">Primeira Tx Recente:</dt><dd className="mt-1 flex items-center"><CalendarDays size={12} className='mr-1 opacity-60'/> {formatTimestamp(result.details.creatorHistory.firstTxTimestamp)}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-slate-400 font-medium">Última Tx Recente:</dt><dd className="mt-1 flex items-center"><CalendarDays size={12} className='mr-1 opacity-60'/> {formatTimestamp(result.details.creatorHistory.lastTxTimestamp)}</dd></div>
                    </dl>
                </div>
            )}

            {/* Seção de Links */}
            <div className="space-y-2 pt-4 border-t border-slate-700/50">
                <h4 className="font-semibold text-indigo-400 text-base flex items-center"><LinkIcon size={16} className="mr-2" /> Links Úteis (Devnet)</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
                    {result.details.links.tokenSolscan && <a href={result.details.links.tokenSolscan} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Token no Solscan</a>}
                    {result.details.links.tokenSolanaFM && <a href={result.details.links.tokenSolanaFM} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Token no SolanaFM</a>}
                    {result.details.links.creatorSolscan && <a href={result.details.links.creatorSolscan} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Criador no Solscan</a>}
                    {result.details.links.creatorSolanaFM && <a href={result.details.links.creatorSolanaFM} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Criador no SolanaFM</a>}
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-slate-500 mt-6 text-center">
                Aviso: Esta análise é baseada em dados da Helius API (Devnet) e heurísticas. A verificação de liquidez bloqueada não está incluída. Não é aconselhamento financeiro. Sempre faça sua própria pesquisa (DYOR).
            </p>
        </div>
    );
};

export default RugPullResultsDisplay;

