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
    <header className="bg-gradient-to-r from-primary via-primary to-forest-light text-primary-foreground px-4 md:px-6 py-3 shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-sm">
            <img 
              src={logoLindezas} 
              alt="Lindezas Café & Flores" 
              className="h-9 md:h-11 w-auto object-contain"
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-gold text-forest shadow-md' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
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
          <div className="text-right bg-white/10 rounded-xl px-5 py-2.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] uppercase tracking-widest text-lindezas-gold font-bold">Hoje</p>
            <p className="text-sm font-sans font-semibold text-white tracking-wide">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              }).replace('.', '')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
