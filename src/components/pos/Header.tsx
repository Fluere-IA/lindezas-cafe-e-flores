import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoLindezas from '@/assets/logo-lindezas.png';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground px-4 py-3">
      <div className="flex items-center justify-between">
        <img 
          src={logoLindezas} 
          alt="Lindezas Café & Flores" 
          className="h-10 w-auto object-contain"
        />
        <Link to="/caixa">
          <Button 
            variant="secondary" 
            size="sm"
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Caixa
          </Button>
        </Link>
      </div>
    </header>
  );
}
