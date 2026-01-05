import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Settings, Package, Tag, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GerenciarProdutos } from '@/components/config/GerenciarProdutos';
import { GerenciarCategorias } from '@/components/config/GerenciarCategorias';

type ConfigSection = 'produtos' | 'categorias' | 'relatorios' | null;

const menuItems = [
  { id: 'produtos' as const, label: 'Cardápio', description: 'Adicionar, editar e remover produtos', icon: Package },
  { id: 'categorias' as const, label: 'Categorias', description: 'Gerenciar categorias do cardápio', icon: Tag },
  { id: 'relatorios' as const, label: 'Relatórios', description: 'Exportar dados e relatórios', icon: FileText },
];

const Configuracoes = () => {
  const [activeSection, setActiveSection] = useState<ConfigSection>(null);

  const renderContent = () => {
    switch (activeSection) {
      case 'produtos':
        return <GerenciarProdutos onBack={() => setActiveSection(null)} />;
      case 'categorias':
        return <GerenciarCategorias onBack={() => setActiveSection(null)} />;
      case 'relatorios':
        return (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Em breve</p>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:border-lindezas-gold/50 transition-colors text-left"
                >
                  <div className="p-2.5 rounded-lg bg-lindezas-cream">
                    <Icon className="h-5 w-5 text-lindezas-forest" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-lindezas-forest">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-lindezas-cream">
      <DashboardHeader />
      
      <main className="flex-1 p-4 md:p-5">
        {activeSection === null && (
          <div className="flex items-center gap-2.5 mb-4">
            <Settings className="h-5 w-5 text-lindezas-forest/70" />
            <h1 className="text-xl font-semibold text-lindezas-forest">Configurações</h1>
          </div>
        )}
        
        {renderContent()}
      </main>
    </div>
  );
};

export default Configuracoes;
