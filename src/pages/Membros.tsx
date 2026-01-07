import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  Check, 
  X, 
  Trash2,
  Shield,
  User,
  Loader2
} from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_email?: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
  cashier: 'Caixa',
  kitchen: 'Cozinha',
};

const roleColors: Record<string, string> = {
  owner: 'bg-amber-500',
  admin: 'bg-purple-500',
  member: 'bg-blue-500',
  cashier: 'bg-green-500',
  kitchen: 'bg-orange-500',
};

export default function Membros() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['organization-members', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at');

      if (error) throw error;
      return data as Member[];
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch pending invites
  const { data: invites = [], isLoading: loadingInvites } = useQuery({
    queryKey: ['organization-invites', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('organization_invites')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invite[];
    },
    enabled: !!currentOrganization?.id,
  });

  const handleInvite = async () => {
    if (!currentOrganization?.id || !user?.id || !inviteEmail) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsInviting(true);

    try {
      // Check if already a member or invited
      const existingMember = members.find(m => m.user_id === inviteEmail);
      if (existingMember) {
        toast({
          title: 'Usuário já é membro',
          description: 'Este usuário já faz parte da organização.',
          variant: 'destructive',
        });
        return;
      }

      const existingInvite = invites.find(i => i.email.toLowerCase() === inviteEmail.toLowerCase());
      if (existingInvite) {
        toast({
          title: 'Convite já enviado',
          description: 'Já existe um convite pendente para este email.',
          variant: 'destructive',
        });
        return;
      }

      // Create invite
      const { data: inviteData, error } = await supabase
        .from('organization_invites')
        .insert({
          organization_id: currentOrganization.id,
          email: inviteEmail.toLowerCase(),
          role: inviteRole,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invite email via edge function
      try {
        const inviteUrl = `${window.location.origin}/auth?invite=${inviteData.id}`;
        await supabase.functions.invoke('send-invite-email', {
          body: {
            to: inviteEmail.toLowerCase(),
            inviterName: user.user_metadata?.full_name || 'Um administrador',
            organizationName: currentOrganization.name,
            role: inviteRole,
            inviteUrl,
          },
        });
        console.log('Invite email sent successfully');
      } catch (emailError) {
        console.error('Error sending invite email:', emailError);
        // Don't fail the invite if email fails
      }

      toast({
        title: 'Convite enviado!',
        description: `Um convite foi enviado para ${inviteEmail}`,
      });

      setInviteEmail('');
      setInviteRole('member');
      setInviteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
    } catch (error) {
      console.error('Invite error:', error);
      toast({
        title: 'Erro ao enviar convite',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: 'Convite cancelado',
      });

      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
    } catch (error) {
      console.error('Cancel invite error:', error);
      toast({
        title: 'Erro ao cancelar convite',
        variant: 'destructive',
      });
    }
  };

  const openDeleteMemberDialog = (member: Member) => {
    if (member.role === 'owner') {
      toast({
        title: 'Não é possível remover o proprietário',
        variant: 'destructive',
      });
      return;
    }
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const removeMember = async () => {
    if (!memberToDelete) return;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      toast({
        title: 'Membro removido',
      });

      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    } catch (error) {
      console.error('Remove member error:', error);
      toast({
        title: 'Erro ao remover membro',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const isLoading = loadingMembers || loadingInvites;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6" />
              Equipe
            </h1>
            <p className="text-muted-foreground">
              Gerencie os membros da sua organização
            </p>
          </div>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Membro</DialogTitle>
                <DialogDescription>
                  Envie um convite por email para adicionar alguém à sua equipe.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="cashier">Caixa</SelectItem>
                      <SelectItem value="kitchen">Cozinha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleInvite}
                    disabled={isInviting || !inviteEmail}
                  >
                    {isInviting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Convite
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Membros Ativos</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? 'membro' : 'membros'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    Nenhum membro encontrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${roleColors[member.role] || 'bg-gray-500'}`}>
                            {member.role === 'owner' || member.role === 'admin' ? (
                              <Shield className="w-5 h-5" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.user_id === user?.id ? 'Você' : `Membro ${member.id.slice(0, 6)}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {roleLabels[member.role] || member.role}
                            </p>
                          </div>
                        </div>

                        {member.role !== 'owner' && member.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteMemberDialog(member)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Invites */}
            {invites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Convites Pendentes</CardTitle>
                  <CardDescription>
                    {invites.length} {invites.length === 1 ? 'convite aguardando' : 'convites aguardando'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <p className="text-sm text-muted-foreground">
                              {roleLabels[invite.role] || invite.role} • Expira em{' '}
                              {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelInvite(invite.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Delete Member Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Remover membro?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este membro da equipe?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={removeMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
