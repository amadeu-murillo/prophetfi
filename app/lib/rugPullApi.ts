// --- Funções Auxiliares (API Helius com Retry e Timeout) ---

import { API_FETCH_TIMEOUT_MS } from './rugPullConstants';

/**
 * Realiza uma chamada fetch com timeout.
 * @param url URL do endpoint.
 * @param options Opções do fetch.
 * @param timeout Tempo limite em milissegundos.
 * @returns Promise<Response>
 */
export const fetchWithTimeout = async (url: string, options: RequestInit, timeout = API_FETCH_TIMEOUT_MS): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        if (!response.ok) {
            let errorBody = '';
            try { errorBody = await response.text(); } catch {}
            throw new Error(`HTTP error ${response.status}: ${response.statusText}. ${errorBody}`);
        }
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout / 1000}s`);
        }
        throw error;
    }
};

/**
 * Realiza uma chamada RPC para a Helius API com retentativas e backoff exponencial.
 * @param method Método RPC a ser chamado.
 * @param params Parâmetros para o método RPC.
 * @param apiKey Chave da API Helius.
 * @param retries Número máximo de retentativas.
 * @param initialDelay Delay inicial em milissegundos para backoff.
 * @returns Promise<any> O resultado da chamada RPC ou null se não houver resultado.
 */
export const fetchHeliusRpc = async (method: string, params: any, apiKey: string, retries = 2, initialDelay = 500): Promise<any> => {
    const heliusUrl = `https://devnet.helius-rpc.com/?api-key=${apiKey}`; // Usar Devnet
    let attempt = 0;
    while (attempt <= retries) {
        try {
            const response = await fetchWithTimeout(heliusUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: `prophetfi-${method}-${Date.now()}`,
                    method: method,
                    params: params,
                }),
            });
            const data = await response.json();
            if (data.error) {
                console.warn(`Helius API Error (${method}, attempt ${attempt + 1}):`, data.error.message);
                // Evita retentar erros específicos como "Invalid param"
                if (data.error.message?.includes("Invalid param")) {
                    throw new Error(`Helius API Error (${method}): ${data.error.message}`);
                }
                // Continua tentando para outros erros
            }
             // Retorna null se não houver resultado, o que pode ser esperado
            if (data.result === undefined || data.result === null) {
                // console.warn(`Helius API (${method}, attempt ${attempt + 1}) returned no result.`);
                return null;
            }
            return data.result;
        } catch (error: any) {
            console.error(`Error fetching Helius (${method}, attempt ${attempt + 1}):`, error.message);
            if (attempt === retries) {
                throw error; // Rethrow final error
            }
            // Exponential backoff
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Retrying Helius (${method}) in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
        }
    }
     // Caso todas as retentativas falhem (embora o throw dentro do loop deva cobrir isso)
     throw new Error(`Failed to fetch Helius API (${method}) after ${retries + 1} attempts.`);
};
