import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PartyPopper, Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemberTour } from '@/components/onboarding/MemberTour';

const passwordRequirements = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'Uma letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Uma letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'Um número', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'Um caractere especial (!@#$%&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function BoasVindasMembro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { getRedirectPath } = useRoleBasedRedirect();
  
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipPasswordChange, setSkipPasswordChange] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const organizationName = location.state?.organizationName || 'sua nova equipe';

  // Pre-fill name from user metadata
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const allRequirementsMet = passwordRequirements.every(req => req.test(newPassword));
  const canSubmit = fullName.trim() && (skipPasswordChange || (allRequirementsMet && passwordsMatch));

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;

    setIsSubmitting(true);

    try {
      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Update auth user metadata
      const updateData: { data: { full_name: string }; password?: string } = {
        data: { full_name: fullName.trim() },
      };

      // Update password if provided
      if (!skipPasswordChange && newPassword) {
        updateData.password = newPassword;
      }

      const { error: authError } = await supabase.auth.updateUser(updateData);

      if (authError) {
        // Check for leaked password error
        if (authError.status === 422 || authError.message?.includes('leaked')) {
          toast({
            title: 'Senha comprometida',
            description: 'Esta senha foi encontrada em vazamentos de dados. Escolha uma senha mais única.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        throw authError;
      }

      toast({
        title: skipPasswordChange ? 'Perfil atualizado!' : 'Configuração concluída!',
        description: skipPasswordChange 
          ? 'Seu nome foi salvo. Você pode alterar sua senha depois em Perfil.'
          : 'Seu nome e nova senha foram salvos.',
      });

      // Show tour instead of redirecting immediately
      setShowTour(true);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTourComplete = async () => {
    if (!user) return;
    
    // Save tour completed preference
    await supabase
      .from('profiles')
      .update({ tour_completed: true })
      .eq('id', user.id);
    
    const redirectPath = await getRedirectPath(user.id);
    navigate(redirectPath, { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showTour) {
    return (
      <MemberTour 
        onComplete={handleTourComplete} 
        onSkip={handleTourComplete} 
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo(a)!</CardTitle>
          <CardDescription>
            Você agora faz parte de <strong>{organizationName}</strong>. 
            Configure seu perfil para começar.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Seu Nome</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Como você quer ser chamado(a)"
            />
          </div>

          {/* Password Section */}
          {!skipPasswordChange && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Crie uma senha segura"
                    className="pr-10"
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
              </div>

              {/* Password Requirements */}
              {newPassword && (
                <div className="space-y-1.5">
                  {passwordRequirements.map((req) => {
                    const isMet = req.test(newPassword);
                    return (
                      <div 
                        key={req.id} 
                        className={cn(
                          "flex items-center gap-2 text-xs transition-colors",
                          isMet ? "text-green-600" : "text-muted-foreground"
                        )}
                      >
                        {isMet ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
                {confirmPassword && (
                  <p className={cn(
                    "text-xs",
                    passwordsMatch ? "text-green-600" : "text-destructive"
                  )}>
                    {passwordsMatch ? "✓ Senhas coincidem" : "✗ As senhas não coincidem"}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Skip Password Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skipPassword"
              checked={skipPasswordChange}
              onChange={(e) => setSkipPasswordChange(e.target.checked)}
              className="h-4 w-4 rounded border-muted-foreground"
            />
            <label htmlFor="skipPassword" className="text-sm text-muted-foreground cursor-pointer">
              Manter a senha atual (alterar depois)
            </label>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Começar a Usar'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Você pode alterar essas informações a qualquer momento em seu Perfil.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
