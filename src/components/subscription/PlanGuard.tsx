import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionContext, PlanTier } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';

interface PlanGuardProps {
  requiredPlan: PlanTier;
  children: ReactNode;
  featureName?: string;
  description?: string;
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
  const { hasAccess, isLoading } = useSubscriptionContext();

  if (isLoading) {
    return (
      <div className={inline ? 'flex items-center justify-center p-8' : 'min-h-[400px] flex items-center justify-center'}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasAccess(requiredPlan)) {
    return <>{children}</>;
  }

  const UpgradeCard = (
    <div className={`flex flex-col items-center justify-center text-center ${inline ? 'p-6' : 'p-8'}`}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{featureName}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      <Button 
        onClick={() => navigate('/assinatura')}
        variant="outline"
        size="sm"
      >
        Ver planos
      </Button>
    </div>
  );

  if (inline) {
    return UpgradeCard;
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      {UpgradeCard}
    </div>
  );
}
