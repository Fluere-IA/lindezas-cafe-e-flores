import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, BarChart3, ChefHat, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoLindezas from '@/assets/logo-lindezas.png';

export function DashboardHeader() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/', label: 'Pedidos', icon: ShoppingCart },
    { path: '/cozinha', label: 'Cozinha', icon: ChefHat },
    { path: '/caixa', label: 'Caixa', icon: Receipt },
  ];

  return (
    <header className="bg-primary text-primary-foreground px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <img 
            src={logoLindezas} 
            alt="Lindezas Café & Flores" 
            className="h-12 w-auto object-contain"
          />
          
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-white/15 text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
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
