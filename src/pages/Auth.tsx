import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

const emailSchema = z.string().trim().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, user, isAuthenticated, isLoading } = useAuth();
  const { getRedirectPath } = useRoleBasedRedirect();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on user role
      getRedirectPath(user.id).then(path => navigate(path));
    }
  }, [isAuthenticated, isLoading, user, navigate, getRedirectPath]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Erro de autenticação',
            description: 'Email ou senha incorretos.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro',
            description: 'Não foi possível fazer login. Tente novamente.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso.',
        });
        // Role-based redirect is handled by useEffect when user state updates
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show loading state - render form immediately

  return (
    <div className="min-h-screen flex flex-col bg-[#1E40AF] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      {/* Back to Home Link */}
      <div className="relative z-10 p-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <span className="text-4xl font-bold text-white tracking-tight">
                Servire
              </span>
            </Link>
            <p className="text-white/70 mt-3">
              Entre na sua conta para continuar
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="seu@email.com"
                  className={`h-12 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-[#2563EB]'}`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`h-12 pr-12 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-[#2563EB]'}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="text-right mb-4">
                <Link 
                  to="/recuperar-senha" 
                  className="text-sm text-[#2563EB] hover:text-[#1E40AF] font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Ainda não tem conta?{' '}
                <Link to="/cadastro" className="text-[#2563EB] hover:text-[#1E40AF] font-medium">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-8 text-center text-sm text-white/50">
            © 2024 Servire. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
