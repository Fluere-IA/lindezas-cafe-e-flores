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
  Trash2,
  Shield,
  User,
  Loader2,
  Pencil,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_email?: string;
  profile?: {
    full_name: string | null;
  };
  hasLoggedIn?: boolean;
}

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Garçom',
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

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Member management states
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [deleteFromDatabase, setDeleteFromDatabase] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  
  // Edit form states
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editResetPassword, setEditResetPassword] = useState(false);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);

  // Add member form states
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Generate a random password with special characters
  const generatePassword = (setPassword: (p: string) => void) => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '@#$%&*!';
    
    let password = '';
    for (let i = 0; i < 5; i++) {
      password += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 2; i++) {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    password += specials.charAt(Math.floor(Math.random() * specials.length));
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setPassword(password);
  };

  // Fetch members with last sign in info
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['organization-members', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at');

      if (membersError) throw membersError;
      if (!membersData || membersData.length === 0) return [];

      const userIds = membersData.map(m => m.user_id);
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      return membersData.map(member => ({
        ...member,
        profile: profilesMap.get(member.user_id) || null,
      })) as Member[];
    },
    enabled: !!currentOrganization?.id,
  });

  const handleAddMember = async () => {
    if (!currentOrganization?.id || !user?.id || !newMemberEmail || !newMemberPassword) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }

    if (newMemberPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingMember(true);

    try {
      // First create an invite record for tracking
      const { data: inviteData, error: inviteError } = await supabase
        .from('organization_invites')
        .insert({
          organization_id: currentOrganization.id,
          email: newMemberEmail.toLowerCase(),
          role: newMemberRole,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.code === '23505') {
          toast({
            title: 'Membro já existe',
            description: 'Já existe um membro ou convite com este email.',
            variant: 'destructive',
          });
          return;
        }
        throw inviteError;
      }

      // Create user and add to org via edge function
      const { error: createError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: newMemberEmail.toLowerCase(),
          inviterName: user.user_metadata?.full_name || 'Um administrador',
          organizationName: currentOrganization.name,
          organizationId: currentOrganization.id,
          role: newMemberRole,
          inviteId: inviteData.id,
          tempPassword: newMemberPassword,
          memberName: newMemberName.trim() || undefined,
        },
      });

      if (createError) {
        console.error('Error creating member:', createError);
        throw new Error('Erro ao criar membro');
      }

      toast({
        title: 'Membro adicionado!',
        description: `${newMemberName || newMemberEmail} foi adicionado à equipe.`,
      });

      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberRole('member');
      setNewMemberPassword('');
      setAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
    } catch (error) {
      console.error('Add member error:', error);
      toast({
        title: 'Erro ao adicionar membro',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingMember(false);
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
    if (!memberToDelete || !currentOrganization?.id) return;

    setIsDeletingMember(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-member', {
        body: {
          memberId: memberToDelete.id,
          userId: memberToDelete.user_id,
          organizationId: currentOrganization.id,
          deleteFromDatabase,
        },
      });

      if (error) throw error;

      toast({
        title: deleteFromDatabase && data?.userDeleted 
          ? 'Membro e conta excluídos' 
          : 'Membro removido',
        description: data?.message,
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
      setDeleteFromDatabase(false);
      setIsDeletingMember(false);
    }
  };

  const openEditMemberDialog = (member: Member) => {
    setMemberToEdit(member);
    setEditName(member.profile?.full_name || '');
    setEditRole(member.role);
    setEditResetPassword(false);
    setEditNewPassword('');
    setEditDialogOpen(true);
  };

  const updateMember = async () => {
    if (!memberToEdit || !currentOrganization?.id) return;

    setIsUpdatingMember(true);

    try {
      const updates: Record<string, unknown> = {};
      
      if (editName && editName !== memberToEdit.profile?.full_name) {
        updates.name = editName;
      }
      
      if (editRole !== memberToEdit.role) {
        updates.role = editRole;
      }
      
      if (editResetPassword && editNewPassword) {
        updates.resetPassword = true;
        updates.newPassword = editNewPassword;
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: 'Nenhuma alteração',
          description: 'Nenhum dado foi alterado.',
        });
        setEditDialogOpen(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-member', {
        body: {
          memberId: memberToEdit.id,
          userId: memberToEdit.user_id,
          organizationId: currentOrganization.id,
          organizationName: currentOrganization.name,
          updates,
        },
      });

      if (error) throw error;

      toast({
        title: 'Membro atualizado!',
        description: data?.emailSent 
          ? 'As novas credenciais foram enviadas por email.'
          : 'Dados do membro foram atualizados.',
      });

      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      setEditDialogOpen(false);
      setMemberToEdit(null);
    } catch (error) {
      console.error('Update member error:', error);
      toast({
        title: 'Erro ao atualizar membro',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingMember(false);
    }
  };

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

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Membro</DialogTitle>
                <DialogDescription>
                  Crie uma conta e adicione um novo membro à sua equipe. O membro receberá as credenciais por email.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Membro</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nome completo"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="member">Garçom</SelectItem>
                      <SelectItem value="cashier">Caixa</SelectItem>
                      <SelectItem value="kitchen">Cozinha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha inicial"
                        value={newMemberPassword}
                        onChange={(e) => setNewMemberPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => generatePassword(setNewMemberPassword)}
                    >
                      Gerar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta senha será enviada no email. O membro poderá alterá-la depois.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleAddMember}
                    disabled={isAddingMember || !newMemberEmail || !newMemberPassword}
                  >
                    {isAddingMember ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loadingMembers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Membros</CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'membro' : 'membros'} na equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum membro encontrado.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Adicione membros à sua equipe clicando no botão acima.
                  </p>
                </div>
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {member.user_id === user?.id 
                                ? 'Você' 
                                : member.profile?.full_name || `Membro ${member.user_id.slice(0, 6)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {roleLabels[member.role] || member.role}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {member.role !== 'owner' && member.user_id !== user?.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditMemberDialog(member)}
                            className="text-muted-foreground hover:text-primary"
                            title="Editar membro"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteMemberDialog(member)}
                            className="text-destructive hover:text-destructive"
                            title="Remover membro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Member Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteFromDatabase(false);
          }
        }}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Remover membro?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover{' '}
                <strong>{memberToDelete?.profile?.full_name || 'este membro'}</strong> da equipe?
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="deleteFromDb"
                checked={deleteFromDatabase}
                onChange={(e) => setDeleteFromDatabase(e.target.checked)}
                className="h-4 w-4 rounded border-destructive text-destructive focus:ring-destructive"
              />
              <label 
                htmlFor="deleteFromDb" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Também excluir a conta do usuário permanentemente
              </label>
            </div>
            
            {deleteFromDatabase && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Esta ação é irreversível! O usuário perderá acesso a todas as organizações e seus dados serão excluídos.</span>
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingMember}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={removeMember} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeletingMember}
              >
                {isDeletingMember ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : deleteFromDatabase ? (
                  'Excluir Permanentemente'
                ) : (
                  'Remover da Equipe'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Membro</DialogTitle>
              <DialogDescription>
                Atualize os dados de {memberToEdit?.profile?.full_name || 'este membro'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nome</Label>
                <Input
                  id="editName"
                  type="text"
                  placeholder="Nome completo"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRole">Função</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="member">Garçom</SelectItem>
                    <SelectItem value="cashier">Caixa</SelectItem>
                    <SelectItem value="kitchen">Cozinha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="resetPassword"
                    checked={editResetPassword}
                    onChange={(e) => {
                      setEditResetPassword(e.target.checked);
                      if (!e.target.checked) {
                        setEditNewPassword('');
                      }
                    }}
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                  />
                  <label 
                    htmlFor="resetPassword" 
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Redefinir senha
                  </label>
                </div>

                {editResetPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="newPassword"
                          type={showEditPassword ? 'text' : 'password'}
                          placeholder="Nova senha"
                          value={editNewPassword}
                          onChange={(e) => setEditNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => generatePassword(setEditNewPassword)}
                      >
                        Gerar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A nova senha será enviada por email ao membro.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={updateMember}
                  disabled={isUpdatingMember || (editResetPassword && !editNewPassword)}
                >
                  {isUpdatingMember ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
