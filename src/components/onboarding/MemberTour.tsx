import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  User,
  Bell,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Sistema!',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades. Isso levará menos de 1 minuto.',
    icon: <LayoutDashboard className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'sidebar',
    title: 'Menu de Navegação',
    description: 'Use o menu lateral para acessar as diferentes áreas do sistema: Pedidos, Caixa, Cozinha e mais.',
    icon: <Menu className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'orders',
    title: 'Gerenciar Pedidos',
    description: 'Acompanhe todos os pedidos em tempo real. Você pode ver o status, detalhes e atualizar conforme necessário.',
    icon: <ShoppingCart className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'kitchen',
    title: 'Visão da Cozinha',
    description: 'A tela de cozinha mostra os pedidos pendentes em ordem de chegada, facilitando o preparo.',
    icon: <ChefHat className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'notifications',
    title: 'Notificações em Tempo Real',
    description: 'Receba alertas instantâneos sobre novos pedidos e atualizações importantes.',
    icon: <Bell className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'profile',
    title: 'Seu Perfil',
    description: 'Acesse suas configurações pessoais, altere sua senha ou atualize seus dados a qualquer momento.',
    icon: <User className="w-8 h-8" />,
    position: 'center',
  },
];

interface MemberTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function MemberTour({ onComplete, onSkip }: MemberTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 300);
  };

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <Card 
        className={cn(
          "relative z-10 w-full max-w-md mx-4 p-6 shadow-2xl transition-all duration-300 transform",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        )}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          onClick={handleSkip}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentStep 
                  ? "bg-primary w-6" 
                  : index < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {step.icon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground mb-4">
          {currentStep + 1} de {tourSteps.length}
        </p>

        {/* Navigation */}
        <div className="flex gap-2">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className={cn("flex-1", isFirstStep && "w-full")}
          >
            {isLastStep ? (
              'Começar!'
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Skip link */}
        {!isLastStep && (
          <button
            onClick={handleSkip}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular tour
          </button>
        )}
      </Card>
    </div>
  );
}
