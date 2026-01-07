import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, UserPlus, ArrowLeft, Building2, User, Lock } from 'lucide-react';

const cadastroSchema = z.object({
  nomeResponsavel: z.string().trim().max(100).optional().or(z.literal('')),
  email: z.string().trim().email('Email inválido').max(255),
  telefone: z.string().trim().max(15).optional().or(z.literal('')),
  nomeEmpresa: z.string().trim().max(100).optional().or(z.literal('')),
  tipoEstabelecimento: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type CadastroFormData = z.infer<typeof cadastroSchema>;

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

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  // Track if we just completed signup to prevent redirect loop
  const justSignedUp = useRef(false);
  
  const [formData, setFormData] = useState<CadastroFormData>({
    nomeResponsavel: '',
    email: '',
    telefone: '',
    nomeEmpresa: '',
    tipoEstabelecimento: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CadastroFormData, string>>>({});
  
  const { signUp, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Only redirect if authenticated AND we didn't just sign up
  useEffect(() => {
    if (!isLoading && isAuthenticated && !justSignedUp.current) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (field: keyof CadastroFormData, value: string) => {
    let formattedValue = value;
    if (field === 'telefone') {
      formattedValue = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const result = cadastroSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof CadastroFormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof CadastroFormData;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const createOrganization = async (userId: string) => {
    // Use defaults if fields are empty
    const companyName = formData.nomeEmpresa || `Empresa ${Date.now().toString(36)}`;
    
    // Generate slug from company name
    const slug = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName,
        slug: uniqueSlug,
        phone: formData.telefone || null,
        type: formData.tipoEstabelecimento || null,
        owner_name: formData.nomeResponsavel || null,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add user as owner of the organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) throw memberError;

    return org.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error, data } = await signUp(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: 'Email já cadastrado',
            description: 'Este email já está em uso. Tente fazer login.',
            variant: 'destructive',
          });
        } else if (error.message.includes('password') || error.message.includes('weak') || error.message.includes('leaked') || error.message.includes('compromised') || error.status === 422) {
          toast({
            title: 'Senha muito fraca',
            description: 'Use uma senha mais forte com letras, números e caracteres especiais.',
            variant: 'destructive',
          });
        } else {
          console.error('Signup error:', error);
          toast({
            title: 'Erro',
            description: error.message || 'Não foi possível criar a conta. Tente novamente.',
            variant: 'destructive',
          });
        }
        return;
      }

      // Wait for session to be fully established
      const userId = data?.user?.id;
      if (!userId) {
        toast({
          title: 'Erro',
          description: 'Erro ao obter dados do usuário. Tente fazer login.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Wait for auth state to propagate - necessary for RLS policies
      // Increase delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force refresh session to ensure token is valid
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        toast({
          title: 'Erro de sessão',
          description: 'Não foi possível estabelecer a sessão. Tente fazer login.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }
      
      // Wait a bit more after refresh
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create organization with company data
      try {
        const orgId = await createOrganization(userId);
        
        // Store the organization id for auto-selection
        localStorage.setItem('currentOrganizationId', orgId);

        // Send welcome email (non-blocking)
        supabase.functions.invoke('send-welcome-email', {
          body: {
            email: formData.email,
            name: formData.nomeResponsavel,
            companyName: formData.nomeEmpresa,
          },
        }).catch(err => console.error('Error sending welcome email:', err));
        
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Vamos configurar seu estabelecimento.',
        });
        
        // Mark that we just signed up to prevent redirect to dashboard
        justSignedUp.current = true;
        
        // Redirect to onboarding
        navigate('/onboarding');
      } catch (orgError: any) {
        console.error('Error creating organization:', orgError);
        toast({
          title: 'Conta criada!',
          description: 'Configure sua organização nas configurações.',
        });
        navigate('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--servire-blue-dark))] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
      </div>

      {/* Back to Home Link */}
      <div className="relative z-10 p-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>

      {/* Signup Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <span className="text-4xl font-bold text-primary-foreground tracking-tight">
                Servire
              </span>
            </Link>
            <p className="text-primary-foreground/70 mt-2">
              Crie sua conta e comece seu teste grátis de 7 dias
            </p>
            {selectedPlan && (
              <span className="inline-block mt-2 px-3 py-1 bg-primary-foreground/20 rounded-full text-primary-foreground text-sm">
                Plano selecionado: <strong className="capitalize">{selectedPlan}</strong>
              </span>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl shadow-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados do Responsável */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <User className="h-4 w-4" />
                  <span>Dados do Responsável</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nomeResponsavel" className="text-foreground text-sm">
                      Nome completo
                    </Label>
                    <Input
                      id="nomeResponsavel"
                      value={formData.nomeResponsavel}
                      onChange={(e) => handleChange('nomeResponsavel', e.target.value)}
                      placeholder="Seu nome"
                      className={`h-11 ${errors.nomeResponsavel ? 'border-destructive' : 'border-input'}`}
                      disabled={isSubmitting}
                    />
                    {errors.nomeResponsavel && (
                      <p className="text-xs text-destructive">{errors.nomeResponsavel}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telefone" className="text-foreground text-sm">
                      Telefone/WhatsApp
                    </Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className={`h-11 ${errors.telefone ? 'border-destructive' : 'border-input'}`}
                      disabled={isSubmitting}
                    />
                    {errors.telefone && (
                      <p className="text-xs text-destructive">{errors.telefone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados da Empresa */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Building2 className="h-4 w-4" />
                  <span>Dados da Empresa</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nomeEmpresa" className="text-foreground text-sm">
                      Nome do estabelecimento
                    </Label>
                    <Input
                      id="nomeEmpresa"
                      value={formData.nomeEmpresa}
                      onChange={(e) => handleChange('nomeEmpresa', e.target.value)}
                      placeholder="Nome do seu negócio"
                      className={`h-11 ${errors.nomeEmpresa ? 'border-destructive' : 'border-input'}`}
                      disabled={isSubmitting}
                    />
                    {errors.nomeEmpresa && (
                      <p className="text-xs text-destructive">{errors.nomeEmpresa}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tipoEstabelecimento" className="text-foreground text-sm">
                      Tipo de estabelecimento
                    </Label>
                    <Select
                      value={formData.tipoEstabelecimento}
                      onValueChange={(value) => handleChange('tipoEstabelecimento', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        className={`h-11 ${errors.tipoEstabelecimento ? 'border-destructive' : 'border-input'}`}
                      >
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
                    {errors.tipoEstabelecimento && (
                      <p className="text-xs text-destructive">{errors.tipoEstabelecimento}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados de Acesso */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Lock className="h-4 w-4" />
                  <span>Dados de Acesso</span>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className={`h-11 ${errors.email ? 'border-destructive' : 'border-input'}`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-foreground text-sm">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder="••••••••"
                        className={`h-11 pr-10 ${errors.password ? 'border-destructive' : 'border-input'}`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-foreground text-sm">
                      Confirmar senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className={`h-11 ${errors.confirmPassword ? 'border-destructive' : 'border-input'}`}
                      disabled={isSubmitting}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[hsl(var(--servire-blue-dark))] hover:bg-[hsl(var(--servire-blue))] text-primary-foreground font-semibold text-base mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Criar conta grátis
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Ao criar sua conta, você concorda com nossos{' '}
                <Link to="/termos-de-uso" className="text-primary hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
              </p>
            </form>

            <div className="mt-5 pt-5 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/auth" className="text-primary hover:text-primary/80 font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-sm text-primary-foreground/50">
            © 2024 Servire. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}