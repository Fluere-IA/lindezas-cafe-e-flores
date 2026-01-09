-- Corrigir política de SELECT para organization_members
-- Atualmente só permite ver o próprio registro, precisa ver todos da org

-- Remover política restritiva
DROP POLICY IF EXISTS "om_select_own" ON organization_members;

-- Criar nova política que permite ver todos os membros da mesma organização
CREATE POLICY "om_select_org_members" ON organization_members
FOR SELECT
USING (
  is_master_admin(auth.uid()) 
  OR organization_id IN (SELECT get_user_organizations(auth.uid()))
);