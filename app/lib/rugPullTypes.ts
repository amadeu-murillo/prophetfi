// Níveis de Aviso
export type WarningLevel = 'high' | 'medium' | 'low' | 'info';

// Categorias de Aviso (Liquidity removida)
export type WarningCategory = 'Holders' | 'Metadata' | 'Creator' | 'Activity' | 'General';

// Estrutura de um Aviso individual
export interface AnalysisWarning {
    level: WarningLevel;
    message: string;
    category: WarningCategory;
}

// Estrutura para informações de um Top Holder
export interface TopHolder {
    address: string;
    amount: string; // Manter como string para BigInt
    percentage: number;
    uiAmountFormatted?: string; // Para exibição formatada
}

// REMOVIDO: Interface LiquidityPoolInfo

// Estrutura principal do Resultado da Análise
export interface RugPullResult {
    riskScore: number; // 0-100, or -1 for error
    status: 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Error' | 'N/A';
    summary: string;
    warnings: AnalysisWarning[];
    isRugPullCandidate: boolean; // Baseado no riskScore > threshold
    details: {
        asset?: any; // Dados da Helius API getAsset
        topHolders?: TopHolder[];
        totalSupply?: string; // Mantido como string
        decimals?: number;
        // REMOVIDO: liquidityPools?: LiquidityPoolInfo[];
        creatorAddress?: string | null;
        creatorHistory?: {
            signatureCount: number; // Alterado de mintCount para signatureCount
            firstTxTimestamp: number | null; // Renomeado
            lastTxTimestamp: number | null; // Renomeado
        };
        recentActivity?: {
            signatureCount: number; // Renomeado
            significantSalesCount: number; // Renomeado e mantido como placeholder
        };
        links: {
            tokenSolscan?: string;
            tokenSolanaFM?: string;
            creatorSolscan?: string;
            creatorSolanaFM?: string;
            // REMOVIDO: liquidityPoolLinks?: { dex: string; url: string }[];
        };
        error?: string; // Mensagem de erro em caso de falha na análise
    };
}

