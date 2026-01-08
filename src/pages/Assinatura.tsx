import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Calendar, CheckCircle, ExternalLink, Loader2, Crown, Zap, RefreshCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setIsRefreshing(false);
    toast.success('Status atualizado');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const isPro = planName?.toLowerCase().includes('pro');

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Assinatura</h1>
          </div>
        </header>
        <main className="flex-1 p-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Assinatura</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {subscribed ? (
          <>
            {/* Current Plan Card */}
            <Card className="overflow-hidden border-0 shadow-md">
              <div className={`p-6 ${isPro ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-primary to-primary/80'} text-white`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    {isPro ? <Crown className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                  </div>
                  <Badge className="bg-white/20 text-white hover:bg-white/30 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
                <p className="text-white/80 text-sm mb-1">Plano atual</p>
                <h2 className="text-2xl font-bold">{planName || 'Servire'}</h2>
              </div>
              
              <CardContent className="p-4 bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Próxima cobrança em {formatDate(subscriptionEnd)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleManageSubscription} 
                disabled={isOpeningPortal}
                className="w-full h-14 text-base"
                size="lg"
              >
                {isOpeningPortal ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-5 w-5 mr-2" />
                )}
                Gerenciar no Portal de Pagamentos
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Altere método de pagamento, upgrade de plano ou cancele
              </p>
            </div>

            {/* Features Hint */}
            {!isPro && (
              <Card className="border-dashed border-2 border-amber-300 bg-amber-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">Desbloqueie mais recursos</p>
                    <p className="text-sm text-amber-600">Faça upgrade para o Pro e tenha acesso a relatórios e estoque</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* No Subscription */
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-muted to-muted/50">
              <div className="p-3 rounded-xl bg-background/50 w-fit mb-4">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Sem Assinatura</h2>
              <p className="text-muted-foreground text-sm">
                Assine um plano para ter acesso completo a todas as funcionalidades
              </p>
            </div>
            <CardContent className="p-4">
              <Button 
                onClick={() => navigate('/')} 
                className="w-full h-12"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
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