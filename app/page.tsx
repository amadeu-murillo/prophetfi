"use client";

import React, { useState } from 'react';

// Importações dos componentes
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RugPullDetectionPage from './pages/RugPullDetectionPage';

// Componente principal da aplicação
export default function App() {
  // Estado para controlar a página ativa ('home' ou 'security')
  const [page, setPage] = useState<string>('home');

  return (
    // Usa slate-900 para um fundo escuro mais rico e slate-100 para texto claro padrão
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Cabeçalho da aplicação - passa a função para mudar de página e a página atual */}
      <Header setPage={setPage} activePage={page} />
      <main>
        {/* Renderiza condicionalmente a página com base no estado 'page' */}
        {page === 'home' && <HomePage />}
        {page === 'security' && <RugPullDetectionPage />}
        {/* Adicione outras páginas aqui conforme necessário */}
      </main>
      {/* Rodapé da aplicação */}
      <Footer />
    </div>
  );
}
