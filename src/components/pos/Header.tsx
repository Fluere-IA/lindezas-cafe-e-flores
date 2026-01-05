import { Link } from 'react-router-dom';
import { Receipt, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoLindezas from '@/assets/logo-lindezas.png';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-primary via-primary to-forest-light text-primary-foreground px-4 py-3 shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-sm">
          <img 
            src={logoLindezas} 
            alt="Lindezas Café & Flores" 
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link to="/cozinha">
            <Button 
              variant="secondary" 
              size="sm"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
            >
              <ChefHat className="h-4 w-4" />
              Cozinha
            </Button>
          </Link>
          <Link to="/caixa">
            <Button 
              size="sm"
              className="gap-2 bg-gold hover:bg-gold-light text-forest font-semibold"
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
