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
    <header 
      className="text-white px-4 md:px-6 py-3 shadow-xl"
      style={{ background: 'linear-gradient(135deg, #2D5A27 0%, #3D7A37 50%, #2D5A27 100%)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="bg-white/15 rounded-xl p-1.5 backdrop-blur-sm border border-white/10">
            <img 
              src={logoLindezas} 
              alt="Lindezas Café & Flores" 
              className="h-9 md:h-11 w-auto object-contain"
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-white/10 rounded-full p-1.5 backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200'
                  )}
                  style={{
                    backgroundColor: isActive ? '#D4A84B' : 'transparent',
                    color: isActive ? '#2D5A27' : 'rgba(255,255,255,0.9)',
                    boxShadow: isActive ? '0 4px 12px rgba(212,168,75,0.4)' : 'none'
                  }}
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
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-52 bg-white border border-lindezas-gold/30 z-50 shadow-xl"
            >
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 w-full cursor-pointer py-3 px-4 font-medium',
                        isActive 
                          ? 'bg-lindezas-gold/20 text-lindezas-forest' 
                          : 'text-lindezas-espresso hover:bg-lindezas-cream'
                      )}
                    >
                      <item.icon className="h-4 w-4" style={{ color: isActive ? '#2D5A27' : '#4A3728' }} />
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
          <div 
            className="text-right rounded-xl px-5 py-2.5 backdrop-blur-sm border border-white/20"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#D4A84B' }}>Hoje</p>
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
