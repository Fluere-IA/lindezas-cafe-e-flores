import { Link } from 'react-router-dom';
import { Receipt, ChefHat, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';

export function Header() {
  const { currentOrganization } = useOrganization();

  return (
    <header className="bg-gradient-to-r from-primary to-servire-blue-light text-primary-foreground px-4 py-3 shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-white leading-tight">
              {currentOrganization?.name || 'Selecione uma organização'}
            </span>
            <span className="text-xs text-white/70">
              Servire POS
            </span>
          </div>
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
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
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
