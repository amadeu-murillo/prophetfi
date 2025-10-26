import React from 'react';

// Componente Footer simples
const Footer: React.FC = () => (
    // Fundo slate-900, borda slate-700
    <footer className="bg-slate-900 border-t border-slate-700/50 mt-16 sm:mt-32">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
        {/* Navegação do Rodapé (Opcional) */}
        {/* <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer"> ... </nav> */}
        {/* Texto de copyright em slate-500 */}
        <p className="mt-10 text-center text-xs leading-5 text-slate-500">
          &copy; {new Date().getFullYear()} ProphetFi, Inc. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );

export default Footer;
