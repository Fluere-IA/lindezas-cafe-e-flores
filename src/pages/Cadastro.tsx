import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';

// Simplified schema - only email and password required
// Organization is auto-created by database trigger
const cadastroSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type CadastroFormData = z.infer<typeof cadastroSchema>;

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  // Track if we just completed signup to prevent redirect loop
  const justSignedUp = useRef(false);
  
  const [formData, setFormData] = useState<CadastroFormData>({
    email: '',
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

  const handleChange = (field: keyof CadastroFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      // The database trigger automatically creates an organization
      // Wait briefly to ensure the trigger has executed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send welcome email (non-blocking)
      supabase.functions.invoke('send-welcome-email', {
        body: {
          email: formData.email,
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
        <div className="w-full max-w-md">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dados de Acesso */}
              <div className="space-y-4">
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>

              {/* Terms */}
              <p className="text-xs text-center text-muted-foreground">
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

            {/* Login Link */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link 
                  to="/auth" 
                  className="font-semibold text-primary hover:underline"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-primary-foreground/50 text-xs mt-6">
            © {new Date().getFullYear()} Servire. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
