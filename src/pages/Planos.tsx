import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const plans = [
  {
    id: 'start',
    name: "Start",
    priceId: "price_1SmdeyHx3U4iTNTbnzINv2Rl",
    price: "99,90",
    description: "Ideal para pequenos estabelecimentos",
    features: [
      "Comanda Digital",
      "Frente de Caixa (PDV)",
      "KDS (Tela da Cozinha)",
      "Suporte via Chat",
      "1 Usuário",
      "Relatório básico de vendas",
    ],
    highlighted: false,
    icon: Zap,
  },
  {
    id: 'pro',
    name: "Pro",
    priceId: "price_1SmdhEHx3U4iTNTbmtjNQ6c2",
    price: "197,90",
    description: "Para negócios em crescimento",
    features: [
      "Tudo do Start +",
      "Estoque Avançado",
      "Múltiplos Usuários (até 5)",
      "Relatórios Financeiros",
      "Integração Fiscal",
      "Suporte Prioritário",
      "Dashboard Gerencial",
    ],
    highlighted: true,
    icon: Crown,
  },
];

const Planos = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!isAuthenticated) {
      navigate(`/cadastro?plan=${plan.id}`);
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.priceId }
      });

      if (error) {
        console.error('Error creating checkout:', error);
        toast.error('Erro ao iniciar checkout');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar assinatura');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Escolha seu Plano</h1>
        </div>
      </header>

      <main className="flex-1 p-4 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Comece a transformar seu negócio
          </h2>
          <p className="text-muted-foreground">
            7 dias grátis. Cancele a qualquer momento.
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-4 max-w-lg mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 border-2 transition-all ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block px-3 py-1 bg-white/20 text-primary-foreground text-xs font-medium rounded-full mb-3">
                    Mais popular
                  </span>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-5 w-5 ${plan.highlighted ? 'text-primary-foreground' : 'text-primary'}`} />
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>
                    <p className={`text-sm ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">R$ {plan.price}</div>
                    <div className={`text-xs ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      /mês
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'text-green-300' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full h-12 text-base font-semibold ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `Assinar ${plan.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-6 max-w-sm mx-auto">
          Ao assinar, você concorda com nossos{' '}
          <button onClick={() => navigate('/termos')} className="underline hover:text-foreground">
            Termos de Uso
          </button>{' '}
          e{' '}
          <button onClick={() => navigate('/privacidade')} className="underline hover:text-foreground">
            Política de Privacidade
          </button>
        </p>
      </main>
    </div>
  );
};

export default Planos;
