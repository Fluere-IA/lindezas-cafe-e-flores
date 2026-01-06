import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacidade() {
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
          Política de Privacidade
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introdução</h2>
            <p className="text-slate-600 mb-4">
              A Servire ("nós", "nosso" ou "empresa") está comprometida em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
              informações quando você utiliza nosso sistema de gestão.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Informações que Coletamos</h2>
            <p className="text-slate-600 mb-4">Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Informações de Conta:</strong> Nome, email, telefone e dados de login.</li>
              <li><strong>Dados do Negócio:</strong> Informações sobre produtos, vendas, pedidos e clientes.</li>
              <li><strong>Dados de Uso:</strong> Como você interage com nosso sistema.</li>
              <li><strong>Dados de Pagamento:</strong> Processados de forma segura através do Stripe.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Como Usamos suas Informações</h2>
            <p className="text-slate-600 mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Fornecer e manter nosso serviço</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Melhorar nosso sistema com base no uso</li>
              <li>Fornecer suporte ao cliente</li>
              <li>Enviar comunicações sobre atualizações e novidades (com seu consentimento)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-slate-600 mb-4">
              Não vendemos suas informações pessoais. Compartilhamos dados apenas com:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Processadores de Pagamento:</strong> Stripe para processar pagamentos.</li>
              <li><strong>Provedores de Infraestrutura:</strong> Serviços de hospedagem e banco de dados.</li>
              <li><strong>Requisitos Legais:</strong> Quando exigido por lei ou ordem judicial.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Segurança dos Dados</h2>
            <p className="text-slate-600 mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Criptografia SSL/TLS para transmissão de dados</li>
              <li>Criptografia de dados sensíveis em repouso</li>
              <li>Backups automáticos diários</li>
              <li>Controle de acesso baseado em função</li>
              <li>Monitoramento contínuo de segurança</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Seus Direitos</h2>
            <p className="text-slate-600 mb-4">
              De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos ou incompletos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar consentimento para uso de dados</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Retenção de Dados</h2>
            <p className="text-slate-600 mb-4">
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para 
              fornecer nossos serviços. Após o cancelamento, mantemos dados por até 5 anos para 
              fins fiscais e legais, exceto se você solicitar exclusão.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Contato</h2>
            <p className="text-slate-600 mb-4">
              Para questões sobre privacidade ou exercer seus direitos, entre em contato:
            </p>
            <p className="text-slate-600">
              Email: <a href="mailto:privacidade@servire.com.br" className="text-blue-600 hover:underline">privacidade@servire.com.br</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
