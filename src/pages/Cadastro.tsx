import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, UserPlus, ArrowLeft, Building2, User, Mail, Phone, Lock } from 'lucide-react';

const cadastroSchema = z.object({
  nomeResponsavel: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  telefone: z.string().trim().min(10, 'Telefone inválido').max(15),
  nomeEmpresa: z.string().trim().min(2, 'Nome da empresa deve ter no mínimo 2 caracteres').max(100),
  tipoEstabelecimento: z.string().min(1, 'Selecione o tipo de estabelecimento'),
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

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/selecionar-organizacao');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: 'Email já cadastrado',
            description: 'Este email já está em uso. Tente fazer login.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro',
            description: 'Não foi possível criar a conta. Tente novamente.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Conta criada!',
          description: 'Sua conta foi criada com sucesso. Você já pode acessar o sistema.',
        });
        navigate('/selecionar-organizacao');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1E40AF]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

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

      {/* Signup Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <span className="text-4xl font-bold text-white tracking-tight">
                Servire
              </span>
            </Link>
            <p className="text-white/70 mt-2">
              Crie sua conta e comece seu teste grátis de 7 dias
            </p>
            {selectedPlan && (
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                Plano selecionado: <strong className="capitalize">{selectedPlan}</strong>
              </span>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados do Responsável */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <User className="h-4 w-4" />
                  <span>Dados do Responsável</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nomeResponsavel" className="text-slate-700 text-sm">
                      Nome completo
                    </Label>
                    <Input
                      id="nomeResponsavel"
                      value={formData.nomeResponsavel}
                      onChange={(e) => handleChange('nomeResponsavel', e.target.value)}
                      placeholder="Seu nome"
                      className={`h-11 ${errors.nomeResponsavel ? 'border-red-500' : 'border-slate-200'}`}
                      disabled={isSubmitting}
                    />
                    {errors.nomeResponsavel && (
                      <p className="text-xs text-red-500">{errors.nomeResponsavel}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telefone" className="text-slate-700 text-sm">
                      Telefone/WhatsApp
                    </Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className={`h-11 ${errors.telefone ? 'border-red-500' : 'border-slate-200'}`}
                      disabled={isSubmitting}
                    />
                    {errors.telefone && (
                      <p className="text-xs text-red-500">{errors.telefone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados da Empresa */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Building2 className="h-4 w-4" />
                  <span>Dados da Empresa</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nomeEmpresa" className="text-slate-700 text-sm">
                      Nome do estabelecimento
                    </Label>
                    <Input
                      id="nomeEmpresa"
                      value={formData.nomeEmpresa}
                      onChange={(e) => handleChange('nomeEmpresa', e.target.value)}
                      placeholder="Nome do seu negócio"
                      className={`h-11 ${errors.nomeEmpresa ? 'border-red-500' : 'border-slate-200'}`}
                      disabled={isSubmitting}
                    />
                    {errors.nomeEmpresa && (
                      <p className="text-xs text-red-500">{errors.nomeEmpresa}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tipoEstabelecimento" className="text-slate-700 text-sm">
                      Tipo de estabelecimento
                    </Label>
                    <Select
                      value={formData.tipoEstabelecimento}
                      onValueChange={(value) => handleChange('tipoEstabelecimento', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        className={`h-11 ${errors.tipoEstabelecimento ? 'border-red-500' : 'border-slate-200'}`}
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
                      <p className="text-xs text-red-500">{errors.tipoEstabelecimento}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados de Acesso */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Lock className="h-4 w-4" />
                  <span>Dados de Acesso</span>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className={`h-11 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 text-sm">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder="••••••••"
                        className={`h-11 pr-10 ${errors.password ? 'border-red-500' : 'border-slate-200'}`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-slate-700 text-sm">
                      Confirmar senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className={`h-11 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}
                      disabled={isSubmitting}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold text-base mt-4"
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

              <p className="text-xs text-slate-500 text-center">
                Ao criar sua conta, você concorda com nossos{' '}
                <Link to="/termos-de-uso" className="text-[#2563EB] hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacidade" className="text-[#2563EB] hover:underline">
                  Política de Privacidade
                </Link>
              </p>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Já tem uma conta?{' '}
                <Link to="/auth" className="text-[#2563EB] hover:text-[#1E40AF] font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-sm text-white/50">
            © 2024 Servire. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}