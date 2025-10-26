"use client"; // Necessário para componentes com interatividade como onClick

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Tipos das propriedades esperadas pelo componente Header
interface HeaderProps {
  setPage: (page: string) => void; // Função para definir a página ativa
  activePage: string; // String que indica a página atualmente ativa
}

// Componente Header
const Header: React.FC<HeaderProps> = ({ setPage, activePage }) => {
  // Definição dos itens de navegação
  const navItems = [
    { name: 'Home', page: 'home' },
    // { name: 'Analytics', page: 'analytics' }, // Comentado por enquanto
    // { name: 'AI Signals', page: 'signals' }, // Comentado por enquanto
    { name: 'Rug Pull Detector', page: 'security' }, // Renomeado para clareza
  ];

  // Função para obter as classes CSS do link com base na página ativa
  const getLinkClass = (page: string) => {
    return `cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      activePage === page
        ? 'bg-indigo-700 text-white' // Estilo ativo
        : 'text-gray-300 hover:bg-gray-700 hover:text-white' // Estilo inativo/hover
    }`;
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo e Nome da Aplicação */}
          <div className="flex-shrink-0">
            <span
              onClick={() => setPage('home')} // Navega para 'home' ao clicar
              className="flex items-center space-x-2 cursor-pointer"
            >
              <TrendingUp className="h-8 w-8 text-indigo-400" />
              <span className="text-2xl font-bold text-white">ProphetFi</span>
            </span>
          </div>
          {/* Navegação Principal (visível em telas médias e maiores) */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  onClick={() => setPage(item.page)} // Navega para a página do item
                  className={getLinkClass(item.page)} // Aplica estilo dinâmico
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
          {/* Botão da Carteira */}
          <div className="flex items-center">
             <WalletMultiButton style={{ height: '40px', backgroundColor: '#4f46e5', borderRadius: '6px' }}/>
            {/* Pode adicionar um botão "Launch App" aqui se necessário */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
