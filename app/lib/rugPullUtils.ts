// --- Funções Utilitárias para UI ---

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { WarningLevel, RugPullResult, AnalysisWarning } from './rugPullTypes';
import { HIGH_RISK_THRESHOLD, MEDIUM_RISK_THRESHOLD } from './rugPullConstants';

/**
 * Retorna o ícone e a classe de cor correspondente ao nível de aviso.
 * @param level Nível do aviso.
 * @returns Objeto com o componente do ícone e a string de classe de cor/borda Tailwind.
 */
export const getWarningIconAndColor = (level: WarningLevel): { icon: React.ElementType, colorClass: string } => {
    switch (level) {
        case 'high': return { icon: XCircle, colorClass: 'text-red-400 border-red-700/50' };
        case 'medium': return { icon: AlertTriangle, colorClass: 'text-amber-400 border-amber-700/50' };
        case 'low': return { icon: CheckCircle, colorClass: 'text-emerald-400 border-emerald-700/50' };
        default: return { icon: Info, colorClass: 'text-blue-400 border-blue-700/50' }; // info
    }
};

/**
 * Retorna a classe de cor Tailwind com base na pontuação de risco.
 * @param score Pontuação de risco (0-100 ou -1 para erro).
 * @returns String de classe de cor Tailwind.
 */
export const getRiskScoreColorClass = (score: number): string => {
    if (score > HIGH_RISK_THRESHOLD) return 'text-red-500';
    if (score > MEDIUM_RISK_THRESHOLD) return 'text-amber-500';
    if (score >= 0) return 'text-emerald-500';
    return 'text-slate-500'; // Error or N/A
};

/**
 * Retorna a classe de cor Tailwind com base no status do resultado.
 * @param status Status do resultado da análise.
 * @returns String de classe de cor Tailwind.
 */
export const getStatusColorClass = (status: RugPullResult['status']): string => {
    switch (status) {
        case 'High Risk': return 'text-red-400';
        case 'Medium Risk': return 'text-amber-400';
        case 'Low Risk': return 'text-emerald-400';
        default: return 'text-slate-400'; // Error or N/A
    }
};

/**
 * Agrupa os avisos por categoria.
 * @param warnings Array de avisos.
 * @returns Objeto onde as chaves são categorias e os valores são arrays de avisos.
 */
export const groupWarningsByCategory = (warnings: RugPullResult['warnings'] | undefined): Record<string, AnalysisWarning[]> => {
    if (!warnings) return {};
    return warnings.reduce((acc, warning) => {
        if (!acc[warning.category]) {
            acc[warning.category] = [];
        }
        acc[warning.category].push(warning);
        return acc;
    }, {} as Record<string, AnalysisWarning[]>);
};
