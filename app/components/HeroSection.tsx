import React from 'react';

// Componente da Seção Hero (parte superior da página inicial)
const HeroSection: React.FC = () => (
    // Usa slate-900 para o fundo
    <div className="relative isolate overflow-hidden bg-slate-900 pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Gradiente de Fundo Decorativo */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-purple-800 opacity-25 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      {/* Conteúdo Principal da Seção Hero */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Título revisado */}
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-6xl">
            Inteligência Artificial para DeFi
          </h1>
          {/* Parágrafo revisado */}
          <p className="mt-6 text-lg leading-8 text-slate-300">
            ProphetFi utiliza IA de última geração para fornecer insights preditivos de mercado, avaliação de risco em tempo real e segurança de nível institucional para utilizadores e protocolos DeFi.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {/* Botão principal */}
            <button className="rounded-md bg-indigo-500 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all">
              Começar Agora
            </button>
            {/* Link "Saber Mais" */}
            <a href="#features" className="text-base font-semibold leading-6 text-slate-100 hover:text-indigo-400 transition-colors">
              Saber Mais <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

export default HeroSection;
