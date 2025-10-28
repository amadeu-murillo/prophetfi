import React from 'react';
import { ShieldCheck, TrendingUp, Cpu, Bell, Database, Zap } from 'lucide-react';

// Componente da Seção de Funcionalidades
const FeaturesSection: React.FC = () => {
    // Definição das funcionalidades (textos revisados)
    const features = [
      { name: 'Análises Preditivas', description: 'Nossos modelos de IA analisam vastos conjuntos de dados para prever tendências de mercado com maior precisão.', icon: TrendingUp },
      { name: 'Sinais de IA em Tempo Real', description: 'Receba alertas e sinais acionáveis gerados por IA, adaptados ao seu perfil de investimento e risco.', icon: Bell },
      { name: 'Segurança de Protocolo', description: 'Proteja utilizadores e tesourarias com deteção avançada de ameaças e vulnerabilidades em tempo real.', icon: ShieldCheck },
      { name: 'Dados On-Chain Detalhados', description: 'Acesse rastreamento profundo de carteiras, análise de pools de liquidez e auditorias de contratos inteligentes.', icon: Database },
      { name: 'Contratos Inteligentes Otimizados', description: 'Implemente contratos autoajustáveis que reagem dinamicamente às condições de mercado.', icon: Cpu },
      { name: 'Deteção Instantânea de Riscos', description: 'Avalie instantaneamente tokens e protocolos quanto a riscos de rug pull, exploits e outras anomalias.', icon: Zap },
    ];

    return (
      <div id="features" className="bg-slate-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Cabeçalho da Seção */}
          <div className="mx-auto max-w-2xl lg:text-center">
            <p className="text-base font-semibold leading-7 text-indigo-500">Porquê escolher a ProphetFi?</p>
            {/* Título revisado */}
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Navegue no DeFi com Inteligência Superior
            </h2>
            {/* Parágrafo revisado */}
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Obtenha uma vantagem competitiva no espaço DeFi com a nossa plataforma de inteligência e segurança baseada em IA.
            </p>
          </div>
          {/* Grelha de Funcionalidades */}
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col p-6 rounded-lg bg-slate-800/60 shadow-lg transition-all hover:scale-[1.03] hover:bg-slate-800">
                  <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-slate-100">
                    <feature.icon className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    );
  };

export default FeaturesSection;
