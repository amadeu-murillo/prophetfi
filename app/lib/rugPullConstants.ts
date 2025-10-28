// --- Constantes ---

import { WarningLevel } from "./rugPullTypes";

export const HELIUS_API_KEY = "2e9c5f4b-aacf-4903-a787-0c431a50ffff"; // Substitua pela sua chave real, se diferente
export const HELIUS_RPC_URL = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`; // Usar Devnet conforme endpoint
export const SOLSCAN_BASE_URL = "https://solscan.io";
export const SOLANAFM_BASE_URL = "https://solana.fm";
export const KNOWN_DEX_PROGRAMS = {
    "Raydium Liquidity Pool V4": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "Orca Aquafarm Global": "82yxjeMsvaURa4MbZZ7WZZHfobirZYk3V9ubpvjhpYt", // Pode precisar de mais IDs Orca
    // Adicionar outros IDs de DEX relevantes
};
export const ANALYSIS_TIMEOUT_MS = 30000; // Tempo limite geral aumentado para 30s
export const API_FETCH_TIMEOUT_MS = 10000; // Tempo limite para chamadas individuais
export const MAX_SIGNATURE_FETCH = 100; // Limite para buscar assinaturas
export const MAX_TRANSACTION_FETCH = 20; // Limite para buscar detalhes de transações
export const FEE_AMOUNT_SOL = 0.01;
export const FEE_RECEIVER_ADDRESS = '4hSVNpgfh1tzn91jgbpH6fVEQ25b63Vd9cvLMJhE3FEf'; // Endereço para receber a taxa

// Ordem dos níveis de aviso para ordenação
export const levelOrder: Record<WarningLevel, number> = { high: 0, medium: 1, low: 2, info: 3 };

// Limites de pontuação para status
export const HIGH_RISK_THRESHOLD = 75;
export const MEDIUM_RISK_THRESHOLD = 45;
