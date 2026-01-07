import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Settings, Package, Tag, FileText, ChevronRight, Users, Palette, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GerenciarProdutos } from '@/components/config/GerenciarProdutos';
import { GerenciarCategorias } from '@/components/config/GerenciarCategorias';
import { PlanGuard } from '@/components/subscription/PlanGuard';

type ConfigSection = 'produtos' | 'categorias' | 'relatorios' | null;

const menuItems = [
  { id: 'produtos' as const, label: 'Cardápio', description: 'Adicionar, editar e remover produtos', icon: Package },
  { id: 'categorias' as const, label: 'Categorias', description: 'Gerenciar categorias do cardápio', icon: Tag },
  { id: 'relatorios' as const, label: 'Relatórios', description: 'Exportar dados e relatórios', icon: FileText },
];

const navigationItems = [
  { path: '/membros', label: 'Equipe', description: 'Gerenciar membros e convites', icon: Users },
  { path: '/onboarding', label: 'Personalização', description: 'Alterar cor e configurações iniciais', icon: Palette },
];

const Configuracoes = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ConfigSection>(null);

  const renderContent = () => {
    switch (activeSection) {
      case 'produtos':
        return <GerenciarProdutos onBack={() => setActiveSection(null)} />;
      case 'categorias':
        return <GerenciarCategorias onBack={() => setActiveSection(null)} />;
      case 'relatorios':
        return (
          <PlanGuard 
            requiredPlan="pro"
            featureName="Relatórios Avançados"
            description="Exporte dados detalhados e gere relatórios personalizados com o plano Pro."
            inline
          >
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Em breve</p>
            </div>
          </PlanGuard>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground px-1">Cardápio</h2>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
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
              <h2 className="text-sm font-medium text-muted-foreground px-1">Organização</h2>
              {navigationItems.map((item) => {
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
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        );
    }
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
