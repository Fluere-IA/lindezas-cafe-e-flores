import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const emailSchema = z.string().trim().email('Email inválido');

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setIsSubmitting(true);
    setError(undefined);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      });
      
      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível enviar o email. Tente novamente.',
          variant: 'destructive',
        });
      } else {
        setEmailSent(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir a senha.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1E40AF] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      {/* Back to Login Link */}
      <div className="relative z-10 p-6">
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>

      {/* Card */}
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
              Recuperar acesso à sua conta
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {emailSent ? (
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  Email enviado!
                </h2>
                <p className="text-slate-600 mb-6">
                  Enviamos um link para <strong>{email}</strong>. Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                </p>
                <Link to="/auth">
                  <Button className="w-full h-12 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Mail className="h-12 w-12 text-[#1E40AF] mx-auto mb-3" />
                  <h2 className="text-xl font-semibold text-slate-800">
                    Esqueceu sua senha?
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Digite seu email e enviaremos um link para redefinir sua senha.
                  </p>
                </div>

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
                        setError(undefined);
                      }}
                      placeholder="seu@email.com"
                      className={`h-12 ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-[#2563EB]'}`}
                      disabled={isSubmitting}
                    />
                    {error && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Enviar link de recuperação
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <Link 
                    to="/auth" 
                    className="text-sm text-[#2563EB] hover:text-[#1E40AF] font-medium"
                  >
                    Voltar ao login
                  </Link>
                </div>
              </>
            )}
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
