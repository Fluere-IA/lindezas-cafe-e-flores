import { Coffee, Flower2 } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Coffee className="h-6 w-6 text-gold" />
            <Flower2 className="h-6 w-6 text-flower-pink" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-wide">
              Lindezas
            </h1>
            <p className="text-xs text-primary-foreground/70 font-medium tracking-wider uppercase">
              Café & Flores
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-primary-foreground/70">Hoje</p>
            <p className="text-sm font-medium">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
