import logoLindezas from '@/assets/logo-lindezas.png';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={logoLindezas} 
            alt="Lindezas Café & Flores" 
            className="h-14 w-auto object-contain"
          />
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
