import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

interface InviteData {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  organization_name: string;
  status: string;
  expires_at: string;
}

export default function AceitarConvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const inviteId = searchParams.get('id');
  const tempPassword = searchParams.get('senha');
  
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'login' | 'success' | 'error'>('loading');
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState(tempPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

  useEffect(() => {
    if (!inviteId) {
      setError('Link de convite inválido.');
      setStep('error');
      setIsLoading(false);
      return;
    }

    loadInvite();
  }, [inviteId]);

  const loadInvite = async () => {
    try {
      // Fetch invite with organization name
      const { data, error: fetchError } = await supabase
        .from('organization_invites')
        .select(`
          id,
          email,
          role,
          organization_id,
          status,
          expires_at,
          organizations!organization_invites_organization_id_fkey (
            name
          )
        `)
        .eq('id', inviteId)
        .single();

      if (fetchError || !data) {
        setError('Convite não encontrado.');
        setStep('error');
        return;
      }

      if (data.status !== 'pending') {
        setError('Este convite já foi utilizado.');
        setStep('error');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Este convite expirou.');
        setStep('error');
        return;
      }

      setInvite({
        id: data.id,
        email: data.email,
        role: data.role,
        organization_id: data.organization_id,
        organization_name: (data.organizations as any)?.name || 'Organização',
        status: data.status,
        expires_at: data.expires_at,
      });
      
      setStep('login');
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Erro ao carregar convite.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!invite || !password || !fullName.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha seu nome e senha para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      let userId: string;

      // First, try to sign up (new user)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      console.log('SignUp response:', { signUpData, signUpError });

      // Check if user already exists - only check explicit error message
      const userAlreadyExists = signUpError?.message?.toLowerCase().includes('already registered') ||
                                signUpError?.message?.toLowerCase().includes('user already registered');

      if (userAlreadyExists) {
        // User exists, try to sign in with the provided password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password: password,
        });

        if (signInError) {
          // If password is wrong, show a more helpful message
          throw new Error('Usuário já existe. Marque a opção "Já possuo uma conta" e use sua senha atual.');
        }

        userId = signInData.user.id;
        
        // Update user metadata with full name
        await supabase.auth.updateUser({
          data: { full_name: fullName.trim() },
        });
      } else if (signUpError) {
        // Other signup errors
        console.error('SignUp error:', signUpError);
        throw new Error(signUpError.message);
      } else if (!signUpData.user) {
        throw new Error('Erro ao criar conta.');
      } else {
        // New user created successfully
        userId = signUpData.user.id;
        
        // For new users, we need to sign them in after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password: password,
        });
        
        if (signInError) {
          console.error('Auto sign-in error:', signInError);
          // Continue anyway, user was created
        }
      }

      // Map display role to database role
      const roleMap: Record<string, string> = {
        'Garçom': 'member',
        'Administrador': 'admin',
        'Admin': 'admin',
        'Cozinha': 'member',
        'Caixa': 'member',
      };
      const dbRole = roleMap[invite.role] || invite.role.toLowerCase();

      // Add user to organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invite.organization_id,
          user_id: userId,
          role: dbRole,
        });

      if (memberError) {
        // Check if already a member
        if (memberError.code === '23505') {
          console.log('User is already a member');
        } else {
          throw memberError;
        }
      }

      // Update invite status
      await supabase
        .from('organization_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      setStep('success');

      toast({
        title: 'Bem-vindo!',
        description: `Você agora faz parte de ${invite.organization_name}.`,
      });

      // Redirect to welcome page for member setup
      setTimeout(() => {
        navigate('/boas-vindas', { 
          replace: true,
          state: { 
            organizationName: invite.organization_name,
            fromInvite: true,
          } 
        });
      }, 2000);
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      toast({
        title: 'Erro ao aceitar convite',
        description: err.message || 'Verifique a senha e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const roleLabels: Record<string, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    waiter: 'Garçom',
    cashier: 'Caixa',
    kitchen: 'Cozinha',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando convite...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Inválido</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/auth')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Aceito!</h2>
            <p className="text-muted-foreground mb-4">
              Você agora faz parte de {invite?.organization_name}.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Convite para {invite?.organization_name}</CardTitle>
          <CardDescription>
            Você foi convidado como <strong>{roleLabels[invite?.role || ''] || invite?.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Seu Nome Completo</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={invite?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="password">
              {hasExistingAccount ? 'Sua Senha Atual' : 'Senha'}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={hasExistingAccount ? 'Digite sua senha atual' : 'Digite a senha enviada por e-mail'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {!hasExistingAccount && (
              <p className="text-xs text-muted-foreground">
                A senha foi enviada no e-mail de convite.
              </p>
            )}
            {hasExistingAccount && (
              <a 
                href="/recuperar-senha" 
                className="text-xs text-primary hover:underline"
              >
                Esqueceu sua senha?
              </a>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleAcceptInvite}
            disabled={isProcessing || !password || !fullName.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Aceitar Convite e Entrar'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao aceitar, você concorda com nossos{' '}
            <a href="/termos" className="text-primary hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
