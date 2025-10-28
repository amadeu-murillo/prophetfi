import { fetchHeliusRpc } from './rugPullApi';
import { RugPullResult, WarningLevel, WarningCategory, TopHolder } from './rugPullTypes';
import { SOLSCAN_BASE_URL, SOLANAFM_BASE_URL, ANALYSIS_TIMEOUT_MS, MAX_SIGNATURE_FETCH } from './rugPullConstants';

const levelOrder: Record<WarningLevel, number> = { high: 0, medium: 1, low: 2, info: 3 };

/**
 * Performs rug pull analysis on a Solana token address using Helius API.
 * @param address The Solana token address to analyze.
 * @param apiKey Your Helius API key.
 * @param updateStep Callback function to update the analysis progress step.
 * @returns A promise that resolves to a RugPullResult object.
 */
export async function fetchRugPullData(
    address: string,
    apiKey: string,
    updateStep: (step: string) => void
): Promise<RugPullResult> {
    console.log(`Iniciando análise para o endereço: ${address}`);
    updateStep("Inicializando análise..."); // Initial step
    const warnings: RugPullResult['warnings'] = [];
    let riskScore = 0;
    const details: RugPullResult['details'] = { links: {} }; // Initialize details with links object
    let assetData: any = null;
    let creatorAddress: string | null = null;
    let isCreatorTopHolder = false; // Flag to indicate if creator is a top holder

    // Use AbortController for overall timeout
    const overallController = new AbortController();
    const overallTimeoutId = setTimeout(() => {
        console.error("Timeout geral da análise atingido.");
        overallController.abort("Overall analysis timeout");
    }, ANALYSIS_TIMEOUT_MS);

    // Helper to add warnings and update risk score
    // Comments added to explain score increases
    const addWarning = (level: WarningLevel, message: string, category: WarningCategory, scoreIncrease = 0) => {
        warnings.push({ level, message, category });
        riskScore += scoreIncrease;
        console.log(`[${category}/${level}${scoreIncrease > 0 ? ` (+${scoreIncrease})` : ''}] ${message}`);
    };

    try {
        // 1. Obter Metadados do Ativo (Token/NFT)
        updateStep("Buscando metadados do ativo...");
        assetData = await fetchHeliusRpc('getAsset', { id: address }, apiKey);
        details.asset = assetData;

        if (!assetData) {
            // High impact if metadata isn't found
            addWarning('high', "Não foi possível encontrar metadados para este endereço. Pode não ser um token SPL válido ou conhecido pela Helius.", 'General', 50);
        } else {
            console.log("Metadados recebidos:", assetData);
            details.links.tokenSolscan = `${SOLSCAN_BASE_URL}/token/${address}?cluster=devnet`;
            details.links.tokenSolanaFM = `${SOLANAFM_BASE_URL}/address/${address}?cluster=devnet-solana`;

            // Análise de Metadados
            updateStep("Analisando metadados...");
            // Try to find creator/update authority
            creatorAddress = assetData.authorities?.find((a: any) => a.scopes?.includes('full'))?.address
                            || assetData.authorities?.find((a: any) => a.scopes?.includes('metadata'))?.address
                            || assetData.update_authority // Older metadata standard field
                            || null;

            if (!creatorAddress && assetData.ownership?.owner) {
                // Fallback to owner if no clear authority, common for older NFTs/tokens
                creatorAddress = assetData.ownership.owner;
                 addWarning('info', `Autoridade de atualização não encontrada. Usando proprietário atual (${creatorAddress ? creatorAddress.substring(0,6) : 'N/A'}...) como criador para análise.`, 'Metadata');
            }
             details.creatorAddress = creatorAddress;
             if (creatorAddress) {
                 updateStep("Verificando criador..."); // More granular step
                 details.links.creatorSolscan = `${SOLSCAN_BASE_URL}/account/${creatorAddress}?cluster=devnet`;
                 details.links.creatorSolanaFM = `${SOLANAFM_BASE_URL}/address/${creatorAddress}?cluster=devnet-solana`;
             } else {
                 // Medium risk if creator cannot be identified
                 addWarning('medium', "Não foi possível identificar o endereço do criador/autoridade de atualização.", 'Metadata', 5);
             }

            // Interface/Type Check
            if (assetData.interface !== "V1_NFT" && assetData.interface !== "FungibleToken" && assetData.interface !== "FungibleAsset") {
                addWarning('info', `Tipo de ativo não padrão detectado: ${assetData.interface}. Análise pode ser limitada.`, 'Metadata');
            }

            // Content Checks (Name, Symbol, Links, URI)
            if (!assetData.content) {
                // Higher risk if essential content metadata is missing
                addWarning('medium', "Metadados de conteúdo (nome, símbolo, URI) não encontrados.", 'Metadata', 15);
            } else {
                updateStep("Analisando conteúdo dos metadados..."); // More granular step
                if (!assetData.content.metadata?.name || !assetData.content.metadata?.symbol) {
                    // Medium risk for incomplete metadata
                    addWarning('medium', "Metadados incompletos (sem nome e/ou símbolo).", 'Metadata', 10);
                } else {
                    addWarning('info', `Token: ${assetData.content.metadata.name} (${assetData.content.metadata.symbol})`, 'Metadata');
                }

                 if (!assetData.content.links?.website && !assetData.content.links?.twitter && !assetData.content.links?.telegram && !assetData.content.links?.discord) {
                    // Missing social links increases risk
                    addWarning('medium', "Faltam links sociais/website nos metadados.", 'Metadata', 15);
                } else {
                    addWarning('low', "Links sociais/website presentes nos metadados.", 'Metadata');
                }
                 // Check external metadata URI
                 if (assetData.content?.json_uri) {
                     addWarning('info', `Metadados externos (JSON URI): ${assetData.content.json_uri.substring(0, 30)}...`, 'Metadata');
                     // Ideal: Fetch URI, validate, compare hash? Increases complexity.
                 } else if (assetData.interface !== "V1_NFT") { // URIs often missing for standard NFTs
                      // Slight risk increase if fungible and no external URI
                      addWarning('low', "Não há URI de metadados externos (JSON URI).", 'Metadata', 5);
                 }
            }

            // Mint/Freeze Authority Checks (Only for Fungible)
             if (assetData.interface === "FungibleToken" || assetData.interface === "FungibleAsset") {
                 updateStep("Verificando autoridades de mint/freeze..."); // More granular step
                if (assetData.mint_info?.mint_authority) {
                     // Active mint authority is a major red flag
                     addWarning('high', "Autoridade de mint ainda ativa. O fornecimento pode ser aumentado arbitrariamente.", 'Metadata', 30);
                 } else if (assetData.mint_info?.supply !== undefined) { // Check if mint_info exists
                    addWarning('low', "Autoridade de mint revogada ou inexistente.", 'Metadata');
                } else {
                     addWarning('info', "Não foi possível verificar a autoridade de mint (sem mint_info).", 'Metadata');
                }

                if (assetData.mint_info?.freeze_authority) {
                    // Active freeze authority allows blocking transfers
                    addWarning('medium', "Autoridade de congelamento ativa. As transferências podem ser bloqueadas.", 'Metadata', 15);
                } else if (assetData.mint_info?.supply !== undefined) {
                    addWarning('low', "Autoridade de congelamento revogada ou inexistente.", 'Metadata');
                } else {
                    addWarning('info', "Não foi possível verificar a autoridade de congelamento (sem mint_info).", 'Metadata');
                }
            }

             // Mutability Check
            if (assetData.mutable) {
                // Mutable metadata can be changed later, potential scam vector
                addWarning('medium', "Metadados do token são mutáveis. Podem ser alterados após a criação (ex: links, nome).", 'Metadata', 10);
            } else if (assetData.content) { // Only add 'low' if content exists to check mutability against
                addWarning('low', "Metadados do token são imutáveis.", 'Metadata');
            }

            // Compression Check
            if (assetData.compression?.compressed) {
                addWarning('info', "Este é um Ativo Comprimido (cNFT/cToken). Análise de liquidez e detentores tradicionais limitada.", 'Metadata');
            }
        }

        // 2. Obter Maiores Detentores e Supply (Apenas para Fungíveis não comprimidos)
        if (assetData && (assetData.interface === "FungibleToken" || assetData.interface === "FungibleAsset") && !assetData.compression?.compressed) {
            updateStep("Buscando supply e maiores detentores...");
            if (assetData.mint_info?.supply && assetData.mint_info.decimals !== undefined) {
                details.totalSupply = assetData.mint_info.supply;
                details.decimals = assetData.mint_info.decimals;
                const totalSupplyBI = BigInt(details.totalSupply ?? "0");
                const decimals = details.decimals ?? 0;
                const divisor = BigInt(10) ** BigInt(decimals);

                let supplyFormatted = "N/A";
                 try {
                     supplyFormatted = divisor > 0 ? (totalSupplyBI / divisor).toLocaleString() : totalSupplyBI.toString();
                     addWarning('info', `Fornecimento total: ${supplyFormatted}`, 'Holders');
                 } catch (e) { console.error("Erro formatando supply:", e); }

                if (totalSupplyBI === BigInt(0)) {
                    // Zero supply is unusual
                    addWarning('medium', `Fornecimento total é zero.`, 'Holders', 5);
                }

                const largestAccountsResult = await fetchHeliusRpc('getTokenLargestAccounts', [address], apiKey);

                if (largestAccountsResult?.value?.length > 0 && totalSupplyBI > 0) {
                     updateStep("Analisando distribuição dos detentores..."); // More granular step
                     const topHoldersRaw = largestAccountsResult.value;
                     details.topHolders = topHoldersRaw.slice(0, 10).map((acc: any): TopHolder => { // Add return type annotation
                         let percentage = 0;
                         let amountBI = BigInt(0);
                         let uiAmountFormatted = 'N/A';
                          if (typeof acc.amount === 'string' && /^\d+$/.test(acc.amount)) {
                              amountBI = BigInt(acc.amount);
                             try {
                                 percentage = Number((amountBI * BigInt(10000) / totalSupplyBI)) / 100;
                                  // Format amount for UI
                                 const numAmount = divisor > 0 ? Number(amountBI * BigInt(100) / divisor) / 100 : Number(amountBI);
                                 uiAmountFormatted = numAmount.toLocaleString(undefined, { maximumFractionDigits: decimals });
                             } catch (e) { console.error("Erro calculando/formatando detentor:", e); }
                         }
                         return {
                             address: acc.address,
                             amount: acc.amount, // Raw amount as string
                             percentage: percentage,
                             uiAmountFormatted: uiAmountFormatted
                         };
                     });

                    // Calculate concentration
                    const top1Concentration = (details.topHolders?.[0]?.percentage) || 0;
                    const top10Concentration = (details.topHolders ?? []).reduce((sum, h) => sum + h.percentage, 0);

                    addWarning('info', `Top 1 detentor possui ${top1Concentration.toFixed(2)}% do supply.`, 'Holders');
                    addWarning('info', `Top 10 detentores possuem ${top10Concentration.toFixed(2)}% do supply.`, 'Holders');

                    // Score based on concentration - Higher concentration significantly increases risk
                    if (top1Concentration > 50) { addWarning('high', `Concentração extremamente alta no maior detentor (>50%). Risco elevado de dump.`, 'Holders', 35); }
                    else if (top1Concentration > 30) { addWarning('medium', `Concentração alta no maior detentor (>30%).`, 'Holders', 20); }
                    else if (top10Concentration > 80) { addWarning('high', `Concentração muito alta nos 10 maiores detentores (>80%).`, 'Holders', 25); }
                    else if (top10Concentration > 60) { addWarning('medium', `Concentração alta nos 10 maiores detentores (>60%).`, 'Holders', 15); }
                    else if (top10Concentration > 40) { addWarning('low', `Concentração moderada nos 10 maiores detentores (>40%).`, 'Holders', 5); }

                     // Check if creator is a top holder
                     if (creatorAddress && details.topHolders && details.topHolders.some(h => h.address === creatorAddress)) {
                         const creatorHolding = details.topHolders.find(h => h.address === creatorAddress);
                         // Medium risk if creator holds a significant portion
                         addWarning('medium', `O endereço do criador está entre os maiores detentores com ${creatorHolding?.percentage.toFixed(2)}%.`, 'Holders', 10);
                         isCreatorTopHolder = true; // Set the flag
                     }
                     details.isCreatorTopHolder = isCreatorTopHolder; // Add this info to details

                } else if (largestAccountsResult) { // Result exists but value is empty or supply is 0
                     // Slight risk if no holders found or supply is zero
                     addWarning('medium', "Não foram encontrados grandes detentores (ou supply é zero).", 'Holders', 5);
                } else { // Error fetching accounts
                    addWarning('info', "Não foi possível verificar a distribuição dos detentores.", 'Holders');
                }

            } else {
                // Missing supply info is a moderate risk
                addWarning('medium', "Informação de supply/decimals não encontrada nos metadados.", 'Holders', 10);
            }
        // Specific info messages for non-fungible/compressed
        } else if (assetData && assetData.interface === "V1_NFT") {
            addWarning('info', "Análise de detentores não aplicável a NFTs individuais.", 'Holders');
        } else if (assetData?.compression?.compressed) {
             addWarning('info', "Análise de detentores tradicionais limitada para ativos comprimidos.", 'Holders');
        }

        // 3. REMOVED Liquidity Check Step

        // 4. Análise do Criador
        updateStep("Analisando histórico do criador...");
        details.creatorHistory = { signatureCount: 0, firstTxTimestamp: null, lastTxTimestamp: null }; // Updated structure
        if (creatorAddress) {
            try {
                // Fetch only signatures, limit MAX_SIGNATURE_FETCH
                const signaturesResult = await fetchHeliusRpc('getSignaturesForAddress', [creatorAddress, { limit: MAX_SIGNATURE_FETCH }], apiKey);
                const signatures = signaturesResult || []; // Handle null result

                if (signatures.length > 0) {
                    details.creatorHistory.signatureCount = signatures.length;
                    const timestamps = signatures.map((sig: any) => sig.blockTime).filter((ts: any): ts is number => typeof ts === 'number'); // Filter nulls and ensure type

                    if (timestamps.length > 0) {
                        details.creatorHistory.firstTxTimestamp = Math.min(...timestamps);
                        details.creatorHistory.lastTxTimestamp = Math.max(...timestamps);
                         addWarning('info', `Criador (${creatorAddress.substring(0,6)}...) tem ${signatures.length} assinaturas recentes na Helius.`, 'Creator');

                         // Basic scoring based on activity level
                         if (signatures.length >= MAX_SIGNATURE_FETCH) {
                              addWarning('low', `Criador tem histórico de transações considerável (${signatures.length}+). Pode indicar atividade legítima.`, 'Creator');
                         } else if (signatures.length < 5) {
                              // Very few transactions might indicate a new/disposable wallet
                              addWarning('medium', `Criador tem pouquíssimas transações recentes (${signatures.length}). Pode ser uma carteira nova/descartável.`, 'Creator', 10);
                         }
                    } else {
                         addWarning('info', "Não foi possível obter timestamps das transações recentes do criador.", 'Creator');
                    }
                     // Advanced: Fetch transaction details for some signatures (expensive)
                     // const txDetailPromises = signatures.slice(0, 5).map(sig => fetchHeliusRpc('parseTransaction', { signature: sig.signature }, apiKey));
                     // const txDetails = await Promise.all(txDetailPromises);
                     // Analyze txDetails for patterns (multiple mints close together, initial LP add/remove, etc.)

                } else {
                    // No recent history for creator increases risk
                    addWarning('medium', "Nenhuma assinatura encontrada recentemente para o criador.", 'Creator', 10);
                }
            } catch (creatorError: any) {
                 console.warn("Erro ao buscar histórico do criador:", creatorError.message);
                 addWarning('info', `Falha ao buscar histórico do criador: ${creatorError.message}`, 'Creator');
            }
        } else {
             addWarning('info', "Análise do criador pulada por falta de endereço.", 'Creator');
        }

        // 5. Análise de Atividade Recente do Token
        updateStep("Analisando atividade recente do token...");
        details.recentActivity = { signatureCount: 0, significantSalesCount: 0 }; // Updated structure
        // Only analyze activity for non-compressed fungible tokens
         if (assetData && (assetData.interface === "FungibleToken" || assetData.interface === "FungibleAsset") && !assetData.compression?.compressed) {
            try {
                 // Fetch recent signatures for the token address
                 const signaturesResult = await fetchHeliusRpc('getSignaturesForAddress', [address, { limit: MAX_SIGNATURE_FETCH }], apiKey);
                 const signatures = signaturesResult || [];

                 if (signatures.length > 0) {
                     details.recentActivity.signatureCount = signatures.length;
                     addWarning('info', `Token teve ${signatures.length} assinaturas recentes na Helius.`, 'Activity');

                    if (signatures.length < 10) {
                        // Very low recent activity might be suspicious
                        addWarning('medium', "Volume de transações recentes muito baixo.", 'Activity', 10);
                    }

                    // Placeholder for advanced analysis needing parseTransaction
                    addWarning('info', `Análise detalhada de vendas/volume não implementada (requer parseTransaction).`, 'Activity');
                    details.recentActivity.significantSalesCount = 0; // Placeholder

                } else {
                     // No recent activity increases risk
                     addWarning('medium', "Nenhuma atividade recente encontrada para o token.", 'Activity', 15);
                 }
             } catch (activityError: any) {
                  console.warn("Erro ao buscar atividade do token:", activityError.message);
                  addWarning('info', `Falha ao buscar atividade recente do token: ${activityError.message}`, 'Activity');
              }
         } else {
              addWarning('info', "Análise de atividade não aplicável a NFTs ou Ativos Comprimidos.", 'Activity');
         }

        // --- Cálculo Final ---
        updateStep("Finalizando análise...");
        riskScore = Math.min(Math.max(riskScore, 0), 100); // Clamp score between 0 and 100

        let status: RugPullResult['status'] = 'Low Risk';
        let summary = "A análise inicial indica baixo risco com base nos fatores verificados.";
        // Adjusted thresholds as liquidity check (major factor) was removed
        const isRugPullCandidate = riskScore > 70; // High risk threshold

        if (riskScore > 70) { // High risk
            status = 'High Risk';
            summary = "ALERTA: Pontuação de risco elevada! Múltiplos indicadores sugerem alto risco. Proceda com extrema cautela.";
        } else if (riskScore > 40) { // Medium risk
            status = 'Medium Risk';
            summary = "AVISO: Risco moderado detectado. Alguns fatores de alerta estão presentes. Recomenda-se pesquisa adicional (DYOR).";
        } else if (warnings.some(w => w.level === 'medium' || w.level === 'high')) { // Low risk but with specific warnings
             status = 'Low Risk'; // Keep status low but adjust summary
            summary = "Risco geral baixo, mas alguns pontos de atenção foram encontrados. Verifique os detalhes.";
        }
        // If score is low and no medium/high warnings, keep default low risk summary

        // Sort warnings by level
        warnings.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

        console.log(`Análise concluída. Pontuação Final: ${riskScore}`);
        return { riskScore, status, summary, warnings, isRugPullCandidate, details };

    } catch (error: any) {
        clearTimeout(overallTimeoutId); // Clear timeout on error
        console.error("Erro fatal durante a análise:", error);
        // Distinguish timeout error
        const errorMessage = error.name === 'AbortError' ? `Timeout da análise: ${error.message}` : error.message;
        return {
            riskScore: -1, // Indicate error state
            status: 'Error',
            summary: `Falha na análise: ${errorMessage}`,
            warnings: [{ level: 'high', message: `Falha ao analisar: ${errorMessage}`, category: 'General' }],
            isRugPullCandidate: true, // Treat analysis error as high risk
            details: { error: errorMessage, links: {} },
        };
    } finally {
        clearTimeout(overallTimeoutId); // Ensure timeout is cleared on success or error
    }
}
