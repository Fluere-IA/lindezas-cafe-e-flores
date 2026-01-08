import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, User, Save, ArrowLeft, Mail, 
  Shield, CreditCard, Crown, Lock, Building2, Phone, LayoutGrid,
  CheckCircle2, AlertCircle, Sparkles, ChevronRight
} from 'lucide-react';
import { z } from 'zod';

const tiposEstabelecimento = [
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'lanchonete', label: 'Lanchonete' },
  { value: 'padaria', label: 'Padaria' },
  { value: 'bar', label: 'Bar' },
  { value: 'pizzaria', label: 'Pizzaria' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'outro', label: 'Outro' },
];

// Validation schemas
const profileSchema = z.object({
  fullName: z.string().max(100, 'Nome deve ter no máximo 100 caracteres'),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export default function Perfil() {
  const { user } = useAuth();
  const { currentOrganization, refetchOrganizations } = useOrganization();
  const { planTier, planName, subscribed, isInTrial, trialDaysRemaining } = useSubscriptionContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  
  // Business state
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [tableCount, setTableCount] = useState(10);
  const [isSubmittingBusiness, setIsSubmittingBusiness] = useState(false);
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);

  // Check user's role in current organization
  const { data: memberRole } = useQuery({
    queryKey: ['member-role', currentOrganization?.id, user?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .single();
      
      if (error) return null;
      return data?.role as string | null;
    },
    enabled: !!currentOrganization?.id && !!user?.id,
  });

  const isOwnerOrAdmin = memberRole === 'owner' || memberRole === 'admin';

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentOrganization) {
      setBusinessName(currentOrganization.name || '');
      setBusinessPhone(currentOrganization.phone || '');
      setBusinessType(currentOrganization.type || '');
      setTableCount(currentOrganization.table_count || 10);
    }
  }, [currentOrganization]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = profileSchema.safeParse({ fullName });
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmittingProfile(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });
      
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o perfil. Tente novamente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Perfil atualizado!',
          description: 'Suas informações foram salvas com sucesso.',
        });
      }
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Nenhuma empresa selecionada.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!businessName.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do negócio é obrigatório.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmittingBusiness(true);
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: businessName.trim(),
          phone: businessPhone.trim() || null,
          type: businessType || null,
          table_count: tableCount,
        })
        .eq('id', currentOrganization.id);
      
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar os dados da empresa.',
          variant: 'destructive',
        });
      } else {
        await refetchOrganizations();
        toast({
          title: 'Empresa atualizada!',
          description: 'Os dados foram salvos com sucesso.',
        });
      }
    } finally {
      setIsSubmittingBusiness(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = passwordSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmittingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível atualizar a senha.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Senha atualizada!',
          description: 'Sua nova senha foi salva com sucesso.',
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const getPlanDisplayName = () => {
    if (!subscribed && !isInTrial) return 'Sem plano ativo';
    if (isInTrial && !subscribed) return `Trial (${trialDaysRemaining} dias restantes)`;
    return planName || (planTier === 'pro' ? 'Pro' : 'Start');
  };

  const getPlanStatus = () => {
    if (!subscribed && !isInTrial) return { label: 'Inativo', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertCircle };
    if (isInTrial) return { label: 'Período de Teste', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: AlertCircle };
    return { label: 'Ativo', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle2 };
  };

  const planStatus = getPlanStatus();
  const isPro = planTier === 'pro';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Minha Conta</h1>
              <p className="text-xs text-muted-foreground">Gerencie suas informações</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Profile Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-4 ring-white/20">
                  <AvatarFallback className="bg-white text-primary text-xl font-bold">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <h2 className="text-xl font-bold">
                    {fullName || 'Usuário'}
                  </h2>
                  <p className="text-white/80 text-sm">{user?.email}</p>
                </div>
              </div>
            </div>
            
            {/* Quick Plan Badge */}
            <div className="p-4 bg-card border-t flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPro ? 'bg-amber-100' : 'bg-primary/10'}`}>
                  {isPro ? <Crown className="h-4 w-4 text-amber-600" /> : <Sparkles className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{getPlanDisplayName()}</p>
                  <p className={`text-xs ${planStatus.color}`}>{planStatus.label}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/assinatura')}
                className="text-muted-foreground"
              >
                Ver <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="geral" className="space-y-4">
            <TabsList className="w-full bg-card border p-1 h-auto flex-wrap">
              <TabsTrigger value="geral" className="flex-1 gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="empresa" className="flex-1 gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Empresa</span>
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="flex-1 gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Geral */}
            <TabsContent value="geral">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize seu nome e foto de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Nome completo
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Seu nome completo"
                          className="pl-10 h-11 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
                          disabled={isSubmittingProfile}
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          className="pl-10 h-11 bg-muted/50 border-0"
                          disabled
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O email não pode ser alterado.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isSubmittingProfile}
                    >
                      {isSubmittingProfile ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar alterações
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Empresa */}
            <TabsContent value="empresa">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Dados do Negócio</CardTitle>
                  <CardDescription>
                    Informações de {currentOrganization?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isOwnerOrAdmin ? (
                    <form onSubmit={handleBusinessSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="businessName" className="text-sm font-medium">
                          Nome do Negócio
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="businessName"
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Nome da sua empresa"
                            className="pl-10 h-11 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
                            disabled={isSubmittingBusiness}
                            maxLength={100}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessType" className="text-sm font-medium">
                          Tipo de Estabelecimento
                        </Label>
                        <Select value={businessType} onValueChange={setBusinessType} disabled={isSubmittingBusiness}>
                          <SelectTrigger className="h-11 bg-muted/50 border-0">
                            <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposEstabelecimento.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessPhone" className="text-sm font-medium">
                            Telefone
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="businessPhone"
                              type="tel"
                              value={businessPhone}
                              onChange={(e) => setBusinessPhone(e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="pl-10 h-11 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
                              disabled={isSubmittingBusiness}
                              maxLength={20}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tableCount" className="text-sm font-medium">
                            Nº de Mesas
                          </Label>
                          <Input
                            id="tableCount"
                            type="number"
                            value={tableCount}
                            onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
                            min={1}
                            max={100}
                            className="h-11 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
                            disabled={isSubmittingBusiness}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11"
                        disabled={isSubmittingBusiness}
                      >
                        {isSubmittingBusiness ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar alterações
                      </Button>
                    </form>
                  ) : (
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Acesso restrito</p>
                          <p className="text-xs text-muted-foreground">
                            Apenas administradores podem editar
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Segurança */}
            <TabsContent value="seguranca">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Alterar Senha</CardTitle>
                  <CardDescription>
                    Atualize sua senha de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium">
                        Nova Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
                          disabled={isSubmittingPassword}
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirmar Nova Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
                          disabled={isSubmittingPassword}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isSubmittingPassword || !newPassword || !confirmPassword}
                    >
                      {isSubmittingPassword ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="mr-2 h-4 w-4" />
                      )}
                      Atualizar Senha
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}