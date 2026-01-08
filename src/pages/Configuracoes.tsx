import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Settings, Package, FileText, ChevronRight, Users, Palette, CreditCard, Building2 } from 'lucide-react';
import { GerenciarCardapio } from '@/components/config/GerenciarCardapio';

type ConfigSection = 'cardapio' | null;

const menuItems = [
  { path: '/membros', label: 'Equipe', description: 'Gerenciar membros e convites', icon: Users },
  { path: '/onboarding', label: 'Dados do Negócio', description: 'Nome, telefone e informações da empresa', icon: Building2 },
  { path: '/onboarding', label: 'Personalização', description: 'Alterar cor e configurações visuais', icon: Palette },
  { path: '/assinatura', label: 'Assinatura', description: 'Gerenciar plano e pagamentos', icon: CreditCard },
];

const proItems = [
  { path: '/estoque', label: 'Estoque', description: 'Controle de quantidades e movimentações', icon: Package, pro: true },
  { path: '/relatorios', label: 'Relatórios', description: 'DRE, Curva ABC e análises financeiras', icon: FileText, pro: true },
];

const Configuracoes = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ConfigSection>(null);

  const renderContent = () => {
    if (activeSection === 'cardapio') {
      return <GerenciarCardapio onBack={() => setActiveSection(null)} />;
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Cardápio</h2>
          <button
            onClick={() => setActiveSection('cardapio')}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-left"
          >
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Gerenciar Cardápio</p>
              <p className="text-sm text-muted-foreground">Produtos e categorias em um só lugar</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Organização</h2>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path + item.label}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-left"
              >
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Recursos Pro</h2>
          {proItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-left"
              >
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      PRO
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="flex-1 p-4 md:p-5">
        {activeSection === null && (
          <div className="flex items-center gap-2.5 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
          </div>
        )}
        
        {renderContent()}
      </main>
    </div>
  );
};

export default Configuracoes;
