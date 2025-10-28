import React from 'react';
import { Twitter, Github, Linkedin } from 'lucide-react'; // Example social icons

// Componente Footer aprimorado
const Footer: React.FC = () => (
    // Fundo slate-900, borda slate-700
    <footer className="bg-slate-900 border-t border-slate-700/50 mt-16 sm:mt-32">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
        {/* Links de Navegação Opcionais (Exemplo) */}
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          {/* Adicione links relevantes aqui se necessário, ex: */}
          {/* <div className="pb-6">
            <a href="#" className="text-sm leading-6 text-slate-400 hover:text-slate-200">Sobre</a>
          </div> */}
           <div className="pb-6">
            <a href="#" className="text-sm leading-6 text-slate-400 hover:text-slate-200">Termos</a>
          </div>
          <div className="pb-6">
            <a href="#" className="text-sm leading-6 text-slate-400 hover:text-slate-200">Privacidade</a>
          </div>
        </nav>
        {/* Ícones Sociais (Exemplo) */}
        <div className="mt-10 flex justify-center space-x-10">
           <a href="#" className="text-slate-500 hover:text-slate-400">
            <span className="sr-only">Twitter</span>
            <Twitter className="h-6 w-6" aria-hidden="true" />
          </a>
          <a href="#" className="text-slate-500 hover:text-slate-400">
            <span className="sr-only">GitHub</span>
            <Github className="h-6 w-6" aria-hidden="true" />
          </a>
          {/* Adicione outros ícones sociais conforme necessário */}
          <a href="#" className="text-slate-500 hover:text-slate-400">
            <span className="sr-only">LinkedIn</span>
            <Linkedin className="h-6 w-6" aria-hidden="true" />
          </a>
        </div>
         {/* Texto de copyright em slate-500 */}
        <p className="mt-10 text-center text-xs leading-5 text-slate-500">
           &copy; {new Date().getFullYear()} ProphetFi. Todos os direitos reservados. Ferramenta em desenvolvimento (Devnet).
        </p>
      </div>
    </footer>
  );

export default Footer;
