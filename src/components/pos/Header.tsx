import logoLindezas from '@/assets/logo-lindezas.png';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground px-4 py-3">
      <div className="flex items-center justify-center">
        <img 
          src={logoLindezas} 
          alt="Lindezas Café & Flores" 
          className="h-10 w-auto object-contain"
        />
      </div>
    </header>
  );
}
