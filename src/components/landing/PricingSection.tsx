import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Start",
    priceId: "price_1SmdeyHx3U4iTNTbnzINv2Rl",
    price: "99,90",
    description: "Ideal para sair do papel e organizar a casa",
    features: [
      "Comanda Digital e Mesas",
      "Frente de Caixa (PDV)",
      "KDS (Tela da Cozinha)",
      "Cardápio QR Code",
      "Até 2 Usuários",
      "Relatório de Vendas do Dia",
    ],
    highlighted: false,
    cta: "Assinar Start",
  },
  {
    name: "Pro",
    priceId: "price_1Sn9TrHx3U4iTNTblXPO4bsJ",
    price: "149,90",
    description: "Para quem quer lucrar mais com inteligência",
    features: [
      "Tudo do Start +",
      "Dashboards de Lucro & DRE",
      "Usuários Ilimitados (Equipe)",
      "Segurança (Permissões de Acesso)",
      "Curva ABC de Produtos",
      "IA para Descrição de Pratos",
      "Suporte Prioritário WhatsApp",
    ],
    highlighted: true,
    cta: "Assinar Pro",
  },
];

export function PricingSection() {
  const navigate = useNavigate();

  const handleSubscribe = (planName: string) => {
    // Redireciona para cadastro com o plano selecionado
    navigate(`/cadastro?plan=${planName.toLowerCase()}`);
  };

  return (
    <section id="planos" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-[#1E40AF] rounded-full text-sm font-medium mb-4">
            Planos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Escolha o poder que seu negócio precisa
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Comece com 7 dias grátis. Sem fidelidade.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 border-2 transition-all duration-300 ${
                plan.highlighted
                  ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-xl scale-105"
                  : "bg-white text-slate-900 border-slate-200 hover:border-[#1E40AF]/30"
              }`}
            >
              {plan.highlighted && (
                <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full mb-4">
                  Recomendado
                </span>
              )}
              
              <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                {plan.name}
              </h3>
              
              <p className={`text-sm mb-6 ${plan.highlighted ? "text-white/70" : "text-slate-500"}`}>
                {plan.description}
              </p>
              
              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                  R$ {plan.price}
                </span>
                <span className={`text-sm ${plan.highlighted ? "text-white/70" : "text-slate-500"}`}>
                  /mês
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      plan.highlighted ? "text-green-300" : "text-green-500"
                    }`} />
                    <span className={`text-sm ${plan.highlighted ? "text-white/90" : "text-slate-600"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.name)}
                className={`w-full py-6 text-base font-semibold ${
                  plan.highlighted
                    ? "bg-white text-[#1E40AF] hover:bg-white/90"
                    : "bg-[#1E40AF] text-white hover:bg-[#1E40AF]/90"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        <div className="mt-12 text-center">
          <p className="text-slate-500">
            Dúvidas? Veja nossas{" "}
            <a href="#" className="text-[#1E40AF] font-medium hover:underline">
              perguntas frequentes
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
