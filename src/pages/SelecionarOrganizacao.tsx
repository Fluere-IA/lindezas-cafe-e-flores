import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight, Plus, Settings, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOrganization, Organization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';

export default function SelecionarOrganizacao() {
  const navigate = useNavigate();
  const { organizations, setCurrentOrganization, isMasterAdmin, isLoading } = useOrganization();
  const { isLoading: authLoading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // If not master admin and has only one org, redirect directly (checking onboarding)
  useEffect(() => {
    if (!isLoading && !authLoading && !isMasterAdmin && organizations.length === 1) {
      const org = organizations[0];
      setCurrentOrganization(org);
      
      // Check if onboarding is completed
      if (!org.onboarding_completed) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isLoading, authLoading, isMasterAdmin, organizations, navigate, setCurrentOrganization]);

  const handleSelectOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    
    // Check if onboarding is completed
    if (!org.onboarding_completed) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-servire-blue-dark to-primary">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-servire-blue-dark to-primary">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link to="/" className="text-2xl font-bold text-white">
            Servire
          </Link>
          <div className="flex items-center gap-2">
            {isMasterAdmin && (
              <Link to="/organizacoes">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Selecione uma Organização
            </h1>
            <p className="text-white/70">
              {isMasterAdmin 
                ? 'Como administrador master, você tem acesso a todas as organizações.' 
                : 'Escolha a organização que deseja acessar.'}
            </p>
          </div>

          {organizations.length === 0 ? (
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-white/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhuma organização encontrada
                </h3>
                <p className="text-white/60 mb-6">
                  {isMasterAdmin 
                    ? 'Crie sua primeira organização para começar.' 
                    : 'Você ainda não foi adicionado a nenhuma organização.'}
                </p>
                {isMasterAdmin && (
                  <Link to="/organizacoes">
                    <Button className="bg-white text-primary hover:bg-white/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Organização
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {organizations.map((org) => (
                <Card 
                  key={org.id}
                  className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer group"
                  onClick={() => handleSelectOrganization(org)}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {org.name}
                      </h3>
                      <p className="text-sm text-white/60 truncate">
                        {org.slug}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isMasterAdmin && organizations.length > 0 && (
            <div className="mt-8 text-center">
              <Link to="/organizacoes">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar nova organização
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
