import React from 'react';
import { ShieldCheck, TrendingUp, Cpu, Bell, Database, Zap } from 'lucide-react';

// Componente da Seção de Funcionalidades
const FeaturesSection: React.FC = () => {
    // Definição das funcionalidades
    const features = [
      { name: 'Análises Preditivas', description: 'Nossos modelos de IA analisam terabytes de dados para prever tendências de mercado.', icon: TrendingUp },
      { name: 'Sinais de IA em Tempo Real', description: 'Receba sinais acionáveis gerados por IA, adaptados ao seu perfil de risco.', icon: Bell },
      { name: 'Segurança Total de Protocolo', description: 'Proteja usuários e tesouraria com deteção de ameaças em tempo real.', icon: ShieldCheck },
      { name: 'Dados On-Chain Profundos', description: 'Acesse rastreamento profundo de carteiras, análise de liquidez e auditoria.', icon: Database },
      { name: 'Contratos Inteligentes com IA', description: 'Implemente contratos adaptativos que reagem às condições de mercado.', icon: Cpu },
      { name: 'Deteção Instantânea de Risco', description: 'Avalie instantaneamente tokens/protocolos quanto a riscos de rug pull e exploits.', icon: Zap },
    ];

    return (
      // Fundo em slate-900
      <div id="features" className="bg-slate-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Cabeçalho da Seção */}
          <div className="mx-auto max-w-2xl lg:text-center">
            {/* Subtítulo em indigo-500 */}
            <p className="text-base font-semibold leading-7 text-indigo-500">Porquê ProphetFi?</p>
            {/* Título em slate-100 */}
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Uma Vantagem Injusta em DeFi
            </h2>
            {/* Parágrafo em slate-300 */}
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Navegue pelas finanças descentralizadas com confiança usando nossa plataforma de inteligência crítica.
            </p>
          </div>
          {/* Grelha de Funcionalidades */}
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                // Card com fundo slate-800/60 e hover slate-800
                <div key={feature.name} className="flex flex-col p-6 rounded-lg bg-slate-800/60 shadow-lg transition-all hover:scale-105 hover:bg-slate-800">
                  <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-slate-100">
                    {/* Ícone em indigo-500 */}
                    <feature.icon className="h-6 w-6 flex-none text-indigo-500" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  {/* Descrição em slate-400 */}
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
