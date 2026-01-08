-- Adicionar política para permitir que owners/admins da organização deletem membros (exceto owners)
CREATE POLICY "org_admins_can_delete_members"
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  -- O membro sendo deletado não pode ser owner
  role <> 'owner'
  AND
  -- O usuário logado deve ser owner ou admin da mesma organização
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);