import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermosDeUso() {
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
          Termos de Uso
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-slate-600 mb-4">
              Ao acessar e usar o Servire, você concorda em cumprir e estar vinculado a estes 
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá 
              acessar o serviço.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-slate-600 mb-4">
              O Servire é um sistema de gestão baseado em nuvem para estabelecimentos comerciais, 
              incluindo cafeterias, floriculturas e restaurantes. O serviço oferece:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Gestão de produtos e cardápio</li>
              <li>Sistema de ponto de venda (PDV)</li>
              <li>Gestão de pedidos e mesas</li>
              <li>Relatórios e análises</li>
              <li>Gestão de usuários e permissões</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Conta do Usuário</h2>
            <p className="text-slate-600 mb-4">
              Para usar o Servire, você deve criar uma conta fornecendo informações precisas e 
              completas. Você é responsável por:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Manter a confidencialidade de sua senha</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
              <li>Manter suas informações de conta atualizadas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Uso Aceitável</h2>
            <p className="text-slate-600 mb-4">Você concorda em não:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Usar o serviço para atividades ilegais</li>
              <li>Tentar acessar sistemas ou dados sem autorização</li>
              <li>Interferir no funcionamento do serviço</li>
              <li>Compartilhar sua conta com terceiros</li>
              <li>Revender ou sublicenciar o serviço sem autorização</li>
              <li>Fazer engenharia reversa ou copiar o software</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Pagamento e Assinatura</h2>
            <p className="text-slate-600 mb-4">
              O Servire oferece planos de assinatura com pagamento recorrente:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Os pagamentos são processados mensalmente através do Stripe</li>
              <li>Você pode cancelar sua assinatura a qualquer momento</li>
              <li>Não há reembolso por períodos parciais</li>
              <li>Podemos alterar preços com aviso prévio de 30 dias</li>
              <li>Atrasos no pagamento podem resultar em suspensão do serviço</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Seus Dados</h2>
            <p className="text-slate-600 mb-4">
              Você mantém todos os direitos sobre os dados que insere no sistema. Nós:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Não reivindicamos propriedade sobre seus dados</li>
              <li>Protegemos seus dados conforme nossa Política de Privacidade</li>
              <li>Oferecemos exportação de dados mediante solicitação</li>
              <li>Excluímos seus dados após encerramento da conta (conforme retenção legal)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Disponibilidade do Serviço</h2>
            <p className="text-slate-600 mb-4">
              Nos esforçamos para manter o serviço disponível 24/7, mas:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Não garantimos disponibilidade ininterrupta</li>
              <li>Manutenções programadas serão comunicadas com antecedência</li>
              <li>Não somos responsáveis por indisponibilidade causada por terceiros</li>
              <li>Reservamo-nos o direito de modificar ou descontinuar recursos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-slate-600 mb-4">
              Na extensão máxima permitida por lei:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>O serviço é fornecido "como está", sem garantias</li>
              <li>Não somos responsáveis por danos indiretos ou consequentes</li>
              <li>Nossa responsabilidade é limitada ao valor pago nos últimos 12 meses</li>
              <li>Você é responsável por backups adicionais de seus dados críticos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Rescisão</h2>
            <p className="text-slate-600 mb-4">
              Podemos suspender ou encerrar sua conta se:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Você violar estes Termos de Uso</li>
              <li>Houver atividade fraudulenta ou ilegal</li>
              <li>Não houver pagamento por mais de 30 dias</li>
            </ul>
            <p className="text-slate-600 mt-4">
              Você pode encerrar sua conta a qualquer momento através das configurações ou 
              entrando em contato conosco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Alterações nos Termos</h2>
            <p className="text-slate-600 mb-4">
              Podemos atualizar estes termos periodicamente. Alterações significativas serão 
              comunicadas por email ou através do sistema. O uso continuado após alterações 
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Lei Aplicável</h2>
            <p className="text-slate-600 mb-4">
              Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida 
              nos tribunais da comarca de São Paulo, SP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Contato</h2>
            <p className="text-slate-600">
              Dúvidas sobre estes termos? Entre em contato: {" "}
              <a href="mailto:contato@servire.com.br" className="text-blue-600 hover:underline">
                contato@servire.com.br
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
