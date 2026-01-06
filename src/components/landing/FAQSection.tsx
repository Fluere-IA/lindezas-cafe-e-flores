import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona o período de teste?",
    answer: "Você pode experimentar o Servire gratuitamente por 7 dias, sem necessidade de cartão de crédito. Durante esse período, terá acesso a todas as funcionalidades do plano Pro para avaliar se o sistema atende às suas necessidades."
  },
  {
    question: "Posso mudar de plano depois?",
    answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor imediatamente e o valor é calculado proporcionalmente ao período restante."
  },
  {
    question: "O sistema funciona offline?",
    answer: "O Servire é um sistema baseado em nuvem e requer conexão com a internet para funcionar. Recomendamos uma conexão estável para garantir a melhor experiência."
  },
  {
    question: "Como é feito o suporte?",
    answer: "Oferecemos suporte por email para todos os planos. No plano Pro, você também tem acesso a suporte prioritário com tempo de resposta reduzido e atendimento por chat."
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente. Utilizamos criptografia de ponta a ponta, backups automáticos diários e nossos servidores estão hospedados em data centers certificados. Seus dados nunca são compartilhados com terceiros."
  },
  {
    question: "Quantos usuários posso adicionar?",
    answer: "No plano Start você pode ter até 2 usuários. No plano Pro, não há limite de usuários, podendo adicionar quantos colaboradores precisar."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. Você continuará tendo acesso até o final do período já pago."
  },
  {
    question: "O Servire emite nota fiscal?",
    answer: "No momento ainda não emitimos nota fiscal, mas estamos trabalhando para disponibilizar essa funcionalidade em breve."
  }
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-slate-600">
            Tire suas dúvidas sobre o Servire
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-lg border border-slate-200 px-6"
            >
              <AccordionTrigger className="text-left text-slate-900 hover:text-blue-600 hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
