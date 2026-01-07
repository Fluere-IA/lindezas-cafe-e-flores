import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Eye,
  Loader2,
  Shield,
  Calendar,
  LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  created_at: string;
  onboarding_completed: boolean | null;
}

export default function SuperDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Fetch all organizations
  const { data: organizations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['super-admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
  });

  // Fetch total users (organization_members count)
  const { data: totalUsers = 0, isLoading: loadingUsers } = useQuery({
    queryKey: ['super-admin-total-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  // Calculate MRR estimate (placeholder - R$49/org active)
  const estimatedMRR = organizations.filter(o => o.onboarding_completed).length * 49;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isLoading = loadingOrgs || loadingUsers;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Admin Header - Purple accent */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Admin</h1>
              <p className="text-sm text-slate-400">Painel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Voltar ao App
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Total de Empresas
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{organizations.length}</div>
                  <p className="text-xs text-slate-400 mt-1">
                    {organizations.filter(o => o.onboarding_completed).length} ativas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Usuários Totais
                  </CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{totalUsers}</div>
                  <p className="text-xs text-slate-400 mt-1">
                    membros cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    MRR Estimado
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    R$ {estimatedMRR.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    receita mensal recorrente
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Organizations Table */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Empresas Cadastradas</CardTitle>
                <CardDescription className="text-slate-400">
                  Lista de todas as organizações no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {organizations.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">
                    Nenhuma empresa cadastrada ainda.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-700/50">
                        <TableHead className="text-slate-300">Nome</TableHead>
                        <TableHead className="text-slate-300">Tipo</TableHead>
                        <TableHead className="text-slate-300">Data Cadastro</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org) => (
                        <TableRow key={org.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="font-medium text-white">
                            {org.name}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {org.type || 'Não definido'}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              {format(new Date(org.created_at), "dd MMM yyyy", { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {org.onboarding_completed ? (
                              <Badge className="bg-green-600 hover:bg-green-700">
                                Ativa
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-600">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-purple-400 hover:text-purple-300 hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
