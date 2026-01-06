import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, BarChart3, ChefHat, Receipt, Menu, X, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { OrganizationSelector } from './OrganizationSelector';
import logoLindezas from '@/assets/logo-lindezas.png';

const navItems = [
  { path: '/dashboard', label: 'Visão Geral', icon: BarChart3 },
  { path: '/', label: 'Pedidos', icon: ShoppingCart },
  { path: '/cozinha', label: 'Cozinha', icon: ChefHat },
  { path: '/caixa', label: 'Caixa', icon: Receipt },
];

export function DashboardHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível sair da conta.',
        variant: 'destructive',
      });
    } else {
      navigate('/auth');
    }
  };

  return (
    <header 
      className="text-white px-4 md:px-6 py-2.5"
      style={{ background: '#2D5A27' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="bg-white/10 rounded-lg p-1 backdrop-blur-sm">
            <img 
              src={logoLindezas} 
              alt="Lindezas Café & Flores" 
              className="h-8 md:h-10 w-auto object-contain"
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5 bg-white/10 rounded-full p-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150'
                  )}
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.95)' : 'transparent',
                    color: isActive ? '#2D5A27' : 'rgba(255,255,255,0.85)',
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
        
        {/* Organization Selector, Settings, User & Logout */}
        <div className="flex items-center gap-2">
          <OrganizationSelector />
          
          <p className="hidden lg:block text-sm font-medium text-white/80">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            }).replace('.', '')}
          </p>
          
          {role && (
            <span className="hidden sm:inline-block text-xs bg-white/20 px-2 py-1 rounded-full">
              {role === 'admin' ? 'Admin Master' : role === 'cashier' ? 'Caixa' : 'Cozinha'}
            </span>
          )}
          
          <Link
            to="/configuracoes"
            className={cn(
              'p-2 rounded-lg transition-colors',
              currentPath === '/configuracoes' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
          >
            <Settings className="h-5 w-5 text-white" />
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-white hover:bg-white/10"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
