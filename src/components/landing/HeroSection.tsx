import { Button } from "@/components/ui/button";
import { ArrowRight, Monitor, Smartphone, ChefHat } from "lucide-react";

export function HeroSection() {
  const scrollToPlans = () => {
    const plansSection = document.getElementById("planos");
    plansSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="produto" className="bg-[#1E40AF] pt-16 pb-24 md:pt-24 md:pb-32 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Tecnologia que serve
              <span className="block text-white/90">quem serve.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
              O sistema de gestão para Cafeterias e Restaurantes. 
              <span className="font-semibold text-white"> Comanda, KDS e Gestão</span> em um só lugar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={scrollToPlans}
                size="lg"
                className="bg-white text-[#1E40AF] hover:bg-white/90 font-semibold text-lg px-8 py-6"
              >
                Começar gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/50 text-white bg-transparent hover:bg-white/10 text-lg px-8 py-6"
              >
                Ver demonstração
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-white/70 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                7 dias grátis
              </span>
            </div>
          </div>

          {/* Mockup/Dashboard Preview */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-2xl">
              {/* Fake Browser Chrome */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/10 rounded-full h-6 flex items-center px-3">
                    <span className="text-white/50 text-xs">servire.app/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Mockup */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 min-h-[300px]">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <Monitor className="h-6 w-6 text-blue-400 mb-2" />
                    <div className="text-white text-lg font-bold">R$ 4.280</div>
                    <div className="text-white/50 text-xs">Vendas hoje</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <Smartphone className="h-6 w-6 text-green-400 mb-2" />
                    <div className="text-white text-lg font-bold">47</div>
                    <div className="text-white/50 text-xs">Pedidos</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <ChefHat className="h-6 w-6 text-orange-400 mb-2" />
                    <div className="text-white text-lg font-bold">5</div>
                    <div className="text-white/50 text-xs">Em produção</div>
                  </div>
                </div>
                
                {/* Fake chart bars */}
                <div className="flex items-end gap-2 h-24">
                  {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                    <div 
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -right-4 top-1/4 bg-white rounded-xl p-3 shadow-xl animate-bounce-slow hidden lg:block">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium text-slate-800">KDS Incluso</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
