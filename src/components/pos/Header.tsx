import { Link } from 'react-router-dom';
import { Receipt, ChefHat, Bell } from 'lucide-react';
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
        <div className="flex items-center gap-2">
          <Link to="/cozinha">
            <Button 
              variant="secondary" 
              size="sm"
              className="gap-2"
            >
              <ChefHat className="h-4 w-4" />
              Cozinha
            </Button>
          </Link>
          <Link to="/prontos">
            <Button 
              variant="secondary" 
              size="sm"
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              Prontos
            </Button>
          </Link>
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
      </div>
    </header>
  );
}
