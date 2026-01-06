import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer id="sobre" className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-white">Servire</span>
            </Link>
            <p className="text-slate-400 max-w-md">
              Sistema de gestão completo para cafeterias, floriculturas e restaurantes. 
              Simplifique suas operações e foque no que importa: atender bem.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#produto" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#planos" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Preços
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Integrações
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Servire. Todos os direitos reservados.
          </p>
          <p className="text-slate-500 text-sm">
            Desenvolvido por{" "}
            <a 
              href="https://fluere.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#60A5FA] hover:text-[#93C5FD] font-medium"
            >
              Fluere
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
