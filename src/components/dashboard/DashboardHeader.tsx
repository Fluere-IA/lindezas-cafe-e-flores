import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, BarChart3, ChefHat, Receipt, Menu, X, Settings, LogOut, Store, Shield, User } from 'lucide-react';
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
import { useOrganization } from '@/contexts/OrganizationContext';
import { VipSupportButton } from '@/components/subscription/VipSupportButton';

import { useSuperAdmin } from '@/hooks/useSuperAdmin';

const allNavItems = [
  { path: '/dashboard', label: 'Visão Geral', icon: BarChart3, roles: ['owner', 'admin'] },
  { path: '/pedidos', label: 'Pedidos', icon: ShoppingCart, roles: ['owner', 'admin', 'member'] },
  { path: '/cozinha', label: 'Cozinha', icon: ChefHat, roles: ['owner', 'admin', 'kitchen'] },
  { path: '/caixa', label: 'Caixa', icon: Receipt, roles: ['owner', 'admin', 'cashier'] },
];

export function DashboardHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const { currentOrganization, userOrgRole } = useOrganization();
  const { isSuperAdmin } = useSuperAdmin();
  const { toast } = useToast();

  // Filter nav items based on user's organization role
  const navItems = useMemo(() => {
    // Super admins and master admins see everything
    if (isSuperAdmin) return allNavItems;
    
    // Filter based on organization role
    if (!userOrgRole) return [];
    
    return allNavItems.filter(item => item.roles.includes(userOrgRole));
  }, [userOrgRole, isSuperAdmin]);

  // Check if user can access settings (owner/admin only)
  const canAccessSettings = useMemo(() => {
    return isSuperAdmin || userOrgRole === 'owner' || userOrgRole === 'admin';
  }, [userOrgRole, isSuperAdmin]);

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
      className="text-white px-4 md:px-6 py-2.5 bg-primary"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm flex items-center gap-2">
            <Store className="h-5 w-5 text-white" />
            <span className="text-sm font-semibold text-white truncate max-w-[120px] md:max-w-[180px]">
              {currentOrganization?.name || 'Meu Negócio'}
            </span>
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
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150',
                    isActive 
                      ? 'bg-white text-primary' 
                      : 'text-white/85 hover:bg-white/10'
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
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Settings, User & Logout */}
        <div className="flex items-center gap-2">
          
          <p className="hidden lg:block text-sm font-medium text-white/80">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            }).replace('.', '')}
          </p>
          
          {/* VIP Support Button for Pro users */}
          <VipSupportButton 
            variant="ghost" 
            className="hidden sm:flex text-white hover:bg-white/10 border-white/20"
          />
          
          {userOrgRole && !['owner', 'admin'].includes(userOrgRole) && (
            <span className="hidden sm:inline-block text-xs bg-white/20 px-2 py-1 rounded-full">
              {userOrgRole === 'cashier' ? 'Caixa' : userOrgRole === 'kitchen' ? 'Cozinha' : 'Garçom'}
            </span>
          )}
          
          {isSuperAdmin && (
            <Link
              to="/admin/super-dashboard"
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPath.includes('/admin/') ? 'bg-purple-500/50' : 'hover:bg-white/10'
              )}
              title="Super Admin"
            >
              <Shield className="h-5 w-5 text-white" />
            </Link>
          )}
          
          {canAccessSettings && (
            <Link
              to="/configuracoes"
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentPath === '/configuracoes' ? 'bg-white/20' : 'hover:bg-white/10'
              )}
              title="Configurações"
            >
              <Settings className="h-5 w-5 text-white" />
            </Link>
          )}
          
          <Link
            to="/perfil"
            className={cn(
              'p-2 rounded-lg transition-colors',
              currentPath === '/perfil' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Minha Conta"
          >
            <User className="h-5 w-5 text-white" />
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
