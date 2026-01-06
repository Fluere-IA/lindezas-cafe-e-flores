import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Assinatura = () => {
  const navigate = useNavigate();
  const { subscribed, planName, subscriptionEnd, isLoading, refreshSubscription } = useSubscription();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error opening portal:', error);
        toast.error('Erro ao abrir portal de gerenciamento');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao abrir portal');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-lindezas-cream">
        <header className="sticky top-0 z-10 bg-lindezas-forest text-white p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/app')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Minha Assinatura</h1>
          </div>
        </header>
        <main className="flex-1 p-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lindezas-forest" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-lindezas-cream">
      <header className="sticky top-0 z-10 bg-lindezas-forest text-white p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app')} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Minha Assinatura</h1>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {subscribed ? (
          <>
            {/* Current Plan Card */}
            <Card className="border-lindezas-forest/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lindezas-forest flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Plano Atual
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
                <CardDescription>Sua assinatura está ativa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-lindezas-sage/10 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="text-xl font-bold text-lindezas-forest">{planName || 'Lindezas'}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Próxima cobrança: {formatDate(subscriptionEnd)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Manage Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gerenciar Assinatura</CardTitle>
                <CardDescription>
                  Altere seu plano, método de pagamento ou cancele sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleManageSubscription} 
                  disabled={isOpeningPortal}
                  className="w-full bg-lindezas-forest hover:bg-lindezas-forest/90"
                >
                  {isOpeningPortal ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Abrir Portal de Pagamentos
                </Button>
              </CardContent>
            </Card>

            {/* Refresh Status */}
            <Button 
              variant="outline" 
              onClick={refreshSubscription}
              className="w-full"
            >
              Atualizar Status da Assinatura
            </Button>
          </>
        ) : (
          /* No Subscription */
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-700">Sem Assinatura Ativa</CardTitle>
              <CardDescription className="text-orange-600">
                Você não possui uma assinatura ativa. Assine para ter acesso completo ao sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full bg-lindezas-forest hover:bg-lindezas-forest/90"
              >
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Assinatura;
