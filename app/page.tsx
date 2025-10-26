"use client";

import React, { useState } from 'react';

// Importações dos novos componentes
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RugPullDetectionPage from './pages/RugPullDetectionPage';

// Componente principal da aplicação
export default function App() {
  // Estado para controlar a página ativa ('home' ou 'security')
  const [page, setPage] = useState<string>('home');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased">
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
