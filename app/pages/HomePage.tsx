import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';

// Componente que representa a página inicial
const HomePage: React.FC = () => (
    <>
      {/* Renderiza a seção Hero */}
      <HeroSection />
      {/* Renderiza a seção de Funcionalidades */}
      <FeaturesSection />
    </>
  );

export default HomePage;
