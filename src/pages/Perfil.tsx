import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, User, Save, ArrowLeft, Mail, Image, 
  Shield, CreditCard, Crown, Lock,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { z } from 'zod';

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
  const { currentOrganization } = useOrganization();
  const { planTier, planName, subscribed, isInTrial, trialDaysRemaining } = useSubscriptionContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  
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
    if (!subscribed && !isInTrial) return { label: 'Inativo', color: 'text-red-600', icon: AlertCircle };
    if (isInTrial) return { label: 'Período de Teste', color: 'text-amber-600', icon: AlertCircle };
    return { label: 'Ativo', color: 'text-emerald-600', icon: CheckCircle2 };
  };

  const planStatus = getPlanStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Minha Conta</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>

          {/* Avatar Preview */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-xl border">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {fullName || 'Usuário'}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="geral" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="geral" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="assinatura" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Assinatura</span>
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Geral */}
            <TabsContent value="geral" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize seu nome e foto de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Nome completo
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="h-12"
                        disabled={isSubmittingProfile}
                        maxLength={100}
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        className="h-12 bg-muted/50"
                        disabled
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground">
                        O email não pode ser alterado.
                      </p>
                    </div>


                    <Button
                      type="submit"
                      className="w-full h-12"
                      disabled={isSubmittingProfile}
                    >
                      {isSubmittingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Tab: Assinatura */}
            <TabsContent value="assinatura">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Assinatura da Empresa
                  </CardTitle>
                  <CardDescription>
                    Informações sobre o plano de {currentOrganization?.name || 'sua empresa'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan Info Card */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Plano Atual</p>
                        <div className="flex items-center gap-2">
                          {planTier === 'pro' && (
                            <Crown className="h-5 w-5 text-amber-500" />
                          )}
                          <span className="text-2xl font-bold text-foreground">
                            {getPlanDisplayName()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <div className={`flex items-center gap-1.5 ${planStatus.color}`}>
                          <planStatus.icon className="h-4 w-4" />
                          <span className="font-medium">{planStatus.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action based on role */}
                  {isOwnerOrAdmin ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Como administrador, você pode gerenciar a assinatura da empresa.
                      </p>
                      <Button 
                        onClick={() => navigate('/assinatura')}
                        className="w-full"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Gerenciar Assinatura
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">Gerido pelo administrador</p>
                          <p className="text-sm text-muted-foreground">
                            Entre em contato com o administrador da sua empresa para alterar o plano.
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Alterar Senha
                  </CardTitle>
                  <CardDescription>
                    Atualize sua senha de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Nova Senha
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12"
                        disabled={isSubmittingPassword}
                        minLength={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        Confirmar Nova Senha
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12"
                        disabled={isSubmittingPassword}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12"
                      disabled={isSubmittingPassword || !newPassword || !confirmPassword}
                    >
                      {isSubmittingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          Atualizar Senha
                        </>
                      )}
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