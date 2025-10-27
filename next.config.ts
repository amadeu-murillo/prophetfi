import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração recomendada para deploy com Docker ou servidor Node.js.
  // Garante que todas as dependências necessárias sejam copiadas para a pasta .next/standalone.
  output: 'standalone',

  // Outras configurações de produção podem ser adicionadas aqui, por exemplo:
  // images: { /* Configurações de otimização de imagem */ },
  // env: { /* Variáveis de ambiente de build */ },
  // experimental: { /* Funcionalidades experimentais */ },
};

export default nextConfig;
