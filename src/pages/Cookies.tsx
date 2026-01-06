import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <h1 className="text-4xl font-bold text-slate-900 mb-8">
          Política de Cookies
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">O que são Cookies?</h2>
            <p className="text-slate-600 mb-4">
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você 
              visita um site. Eles são amplamente utilizados para fazer os sites funcionarem de 
              forma mais eficiente e fornecer informações aos proprietários do site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Como Usamos Cookies</h2>
            <p className="text-slate-600 mb-4">
              O Servire utiliza cookies para as seguintes finalidades:
            </p>

            <div className="bg-slate-50 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-slate-900 mb-2">Cookies Essenciais</h3>
              <p className="text-slate-600 text-sm">
                Necessários para o funcionamento básico do sistema. Incluem cookies de autenticação 
                e sessão que permitem você navegar e usar recursos seguros.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-slate-900 mb-2">Cookies de Preferências</h3>
              <p className="text-slate-600 text-sm">
                Lembram suas configurações e preferências, como idioma e tema escolhido, 
                para melhorar sua experiência.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-slate-900 mb-2">Cookies de Desempenho</h3>
              <p className="text-slate-600 text-sm">
                Coletam informações anônimas sobre como você usa o sistema, ajudando-nos a 
                identificar problemas e melhorar a experiência.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Cookies de Terceiros</h2>
            <p className="text-slate-600 mb-4">
              Utilizamos serviços de terceiros que podem definir seus próprios cookies:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Stripe:</strong> Para processamento seguro de pagamentos.</li>
              <li><strong>Google Analytics:</strong> Para análise de uso (anônimo).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Gerenciar Cookies</h2>
            <p className="text-slate-600 mb-4">
              Você pode controlar e gerenciar cookies de várias formas:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>
                <strong>Configurações do Navegador:</strong> A maioria dos navegadores permite 
                bloquear ou excluir cookies através das configurações.
              </li>
              <li>
                <strong>Ferramentas de Privacidade:</strong> Extensões de navegador podem ajudar 
                a gerenciar cookies de terceiros.
              </li>
            </ul>
            <p className="text-slate-600 mt-4">
              <strong>Atenção:</strong> Bloquear cookies essenciais pode impedir o funcionamento 
              correto do sistema.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Cookies que Utilizamos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Duração</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Finalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-600">sb-auth-token</td>
                    <td className="px-4 py-3 text-sm text-slate-600">Essencial</td>
                    <td className="px-4 py-3 text-sm text-slate-600">Sessão</td>
                    <td className="px-4 py-3 text-sm text-slate-600">Autenticação do usuário</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-600">theme</td>
                    <td className="px-4 py-3 text-sm text-slate-600">Preferência</td>
                    <td className="px-4 py-3 text-sm text-slate-600">1 ano</td>
                    <td className="px-4 py-3 text-sm text-slate-600">Tema claro/escuro</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-600">_ga</td>
                    <td className="px-4 py-3 text-sm text-slate-600">Desempenho</td>
                    <td className="px-4 py-3 text-sm text-slate-600">2 anos</td>
                    <td className="px-4 py-3 text-sm text-slate-600">Google Analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contato</h2>
            <p className="text-slate-600">
              Dúvidas sobre cookies? Entre em contato: {" "}
              <a href="mailto:privacidade@servire.com.br" className="text-blue-600 hover:underline">
                privacidade@servire.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
