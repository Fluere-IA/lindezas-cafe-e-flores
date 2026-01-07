import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionContext, PlanTier } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Sparkles, Loader2 } from 'lucide-react';

interface PlanGuardProps {
  requiredPlan: PlanTier;
  children: ReactNode;
  /** Feature name to display in the upgrade card */
  featureName?: string;
  /** Custom description for the upgrade card */
  description?: string;
  /** Render as inline block instead of full page */
  inline?: boolean;
}

export function PlanGuard({ 
  requiredPlan, 
  children, 
  featureName = 'Funcionalidade Premium',
  description = 'Faça upgrade do seu plano para acessar esta funcionalidade.',
  inline = false
}: PlanGuardProps) {
  const navigate = useNavigate();
  const { hasAccess, isLoading, planTier } = useSubscriptionContext();

  if (isLoading) {
    return (
      <div className={inline ? 'flex items-center justify-center p-8' : 'min-h-[400px] flex items-center justify-center'}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // User has access - render children
  if (hasAccess(requiredPlan)) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade card
  const planLabels: Record<PlanTier, string> = {
    trial: 'Trial',
    start: 'Start',
    pro: 'Pro',
  };

  const UpgradeCard = (
    <Card className={`border-2 border-dashed border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 ${inline ? '' : 'max-w-md mx-auto'}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
          {requiredPlan === 'pro' ? (
            <Crown className="h-8 w-8 text-white" />
          ) : (
            <Lock className="h-8 w-8 text-white" />
          )}
        </div>
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          {featureName}
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-sm text-muted-foreground">
          Seu plano atual: <span className="font-medium text-foreground">{planLabels[planTier]}</span>
          <br />
          Plano necessário: <span className="font-medium text-amber-600">{planLabels[requiredPlan]}</span>
        </div>
        <Button 
          onClick={() => navigate('/assinatura')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md"
        >
          <Crown className="h-4 w-4 mr-2" />
          Fazer Upgrade
        </Button>
      </CardContent>
    </Card>
  );

  if (inline) {
    return UpgradeCard;
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      {UpgradeCard}
    </div>
  );
}
