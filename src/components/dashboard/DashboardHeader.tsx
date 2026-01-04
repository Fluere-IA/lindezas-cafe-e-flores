import { Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, BarChart3, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoLindezas from '@/assets/logo-lindezas.png';

interface DashboardHeaderProps {
  activeTab?: 'dashboard' | 'pos';
}

export function DashboardHeader({ activeTab = 'dashboard' }: DashboardHeaderProps) {
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
            <Link
              to="/dashboard"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'dashboard' 
                  ? 'bg-white/15 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'pos' 
                  ? 'bg-white/15 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              PDV
            </Link>
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
