import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";

const CheckoutSucesso = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscriptionContext();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    // Refresh subscription status after successful checkout
    const refresh = async () => {
      try {
        await refreshSubscription();
      } finally {
        setIsRefreshing(false);
      }
    };
    refresh();
  }, [refreshSubscription]);

  const handleContinue = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur">
        <CardContent className="pt-12 pb-8 px-8 text-center">
          {/* Success Icon */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* Celebration sparkles */}
          <div className="flex justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            <Sparkles className="w-5 h-5 text-primary animate-pulse delay-100" />
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse delay-200" />
          </div>

          {/* Title & Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-muted-foreground mb-8">
            Sua assinatura foi ativada com sucesso. Aproveite todos os recursos do seu plano!
          </p>

          {/* Benefits reminder */}
          <div className="bg-muted/50 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm font-medium text-foreground mb-2">
              Agora você tem acesso a:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Todas as funcionalidades do seu plano</li>
              <li>✓ Suporte dedicado</li>
              <li>✓ Atualizações automáticas</li>
            </ul>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleContinue} 
            className="w-full gap-2"
            size="lg"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              "Ativando sua assinatura..."
            ) : (
              <>
                Ir para o Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Um e-mail de confirmação foi enviado para você.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSucesso;
