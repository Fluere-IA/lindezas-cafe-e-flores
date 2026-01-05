import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, BarChart3, ChefHat, Receipt, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logoLindezas from '@/assets/logo-lindezas.png';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/', label: 'Pedidos', icon: ShoppingCart },
  { path: '/cozinha', label: 'Cozinha', icon: ChefHat },
  { path: '/caixa', label: 'Caixa', icon: Receipt },
];

export function DashboardHeader() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <img 
            src={logoLindezas} 
            alt="Lindezas Café & Flores" 
            className="h-10 md:h-12 w-auto object-contain"
          />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
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

          {/* Mobile Navigation */}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-48 bg-background border border-border z-50"
            >
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 w-full cursor-pointer',
                        isActive && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Date - Hidden on small screens */}
        <div className="hidden sm:flex items-center gap-4">
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
