import { Coffee, Flower2, ChefHat } from "lucide-react";

const features = [
  {
    icon: Coffee,
    title: "Para Cafés",
    description: "Gestão ágil de mesas e balcão. Controle comandas individuais ou por mesa com agilidade. Ideal para operações de alto giro.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: Flower2,
    title: "Para Híbridos",
    description: "Venda flores e cafés no mesmo carrinho. Sistema unificado para negócios que combinam diferentes tipos de produtos e serviços.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: ChefHat,
    title: "Para Cozinha",
    description: "KDS (Tela de Produção) incluso no plano básico. Sua equipe de cozinha recebe os pedidos em tempo real, organizados por prioridade.",
    color: "bg-orange-100 text-orange-600",
  },
];

export function ForWhoSection() {
  return (
    <section id="para-quem" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-[#1E40AF] rounded-full text-sm font-medium mb-4">
            Para quem é
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Feito para quem atende com excelência
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Seja uma cafeteria tradicional, uma floricultura ou um negócio híbrido, 
            o Servire se adapta ao seu fluxo de trabalho.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Mais de <span className="font-semibold text-slate-700">200+ estabelecimentos</span> já usam o Servire
          </p>
        </div>
      </div>
    </section>
  );
}
