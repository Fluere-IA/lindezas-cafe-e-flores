import { useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Email do proprietário - altere para o seu email
const OWNER_EMAIL = 'leo.fluere@gmail.com';

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-support-email', {
        body: {
          userName: formData.name,
          userEmail: formData.email,
          message: formData.message,
          ownerEmail: OWNER_EMAIL,
        },
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Você receberá uma confirmação por e-mail.",
      });

      setFormData({ name: '', email: '', message: '' });
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending support email:', error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-card border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="bg-primary p-4">
            <h3 className="text-primary-foreground font-semibold">Suporte</h3>
            <p className="text-primary-foreground/80 text-sm">Como podemos ajudar?</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-name">Nome</Label>
              <Input
                id="support-name"
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-email">E-mail</Label>
              <Input
                id="support-email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-message">Mensagem</Label>
              <Textarea
                id="support-message"
                placeholder="Descreva sua dúvida ou problema..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar mensagem
                </>
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
