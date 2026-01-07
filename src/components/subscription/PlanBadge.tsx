import { useSubscriptionContext, PlanTier } from '@/contexts/SubscriptionContext';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  className?: string;
}

export function PlanBadge({ className }: PlanBadgeProps) {
  const { planTier, isLoading, trialDaysRemaining } = useSubscriptionContext();

  if (isLoading) {
    return null;
  }

  const badgeConfig: Record<PlanTier, { 
    label: string; 
    className: string; 
    icon: React.ReactNode;
  }> = {
    trial: {
      label: `Trial (${trialDaysRemaining}d)`,
      className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
      icon: <Clock className="h-3 w-3" />,
    },
    start: {
      label: 'Plano Start',
      className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
      icon: <Zap className="h-3 w-3" />,
    },
    pro: {
      label: 'Plano Pro',
      className: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white border-amber-500 shadow-sm',
      icon: <Crown className="h-3 w-3" />,
    },
  };

  const config = badgeConfig[planTier];

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-xs font-medium gap-1 px-2 py-0.5',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
