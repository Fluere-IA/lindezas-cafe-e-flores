import { Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TrialBannerProps {
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/assinatura');
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            Período de teste gratuito
          </p>
          <p className="text-sm text-muted-foreground">
            {daysRemaining === 1 
              ? 'Resta 1 dia do seu trial' 
              : `Restam ${daysRemaining} dias do seu trial`
            }
          </p>
        </div>
      </div>
      <Button 
        onClick={handleSubscribe}
        className="bg-primary hover:bg-primary/90 gap-2 whitespace-nowrap"
      >
        <Sparkles className="h-4 w-4" />
        Assinar agora
      </Button>
    </div>
  );
}
