-- FIRST: Remove ALL existing policies on organization_members to prevent conflicts
DROP POLICY IF EXISTS "Members can view their organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can manage organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Authenticated users can insert their first membership" ON public.organization_members;
DROP POLICY IF EXISTS "Master admins can manage all members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert themselves as member" ON public.organization_members;

-- SECOND: Remove ALL existing policies on organizations
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Master admins can do everything with organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org owners can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Anyone authenticated can create organizations" ON public.organizations;

-- THIRD: Create clean RLS policies for organizations
-- Anyone authenticated can create an organization
CREATE POLICY "org_insert_authenticated"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can view their own organizations OR master admins see all
CREATE POLICY "org_select_members"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.is_master_admin(auth.uid()) OR
  id IN (SELECT public.get_user_organizations(auth.uid()))
);

-- Owners and master admins can update organizations
CREATE POLICY "org_update_owners"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  public.is_master_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = id 
    AND om.user_id = auth.uid() 
    AND om.role = 'owner'
  )
);

-- Master admins can delete organizations
CREATE POLICY "org_delete_admins"
ON public.organizations
FOR DELETE
TO authenticated
USING (public.is_master_admin(auth.uid()));

-- FOURTH: Create clean RLS policies for organization_members
-- Users can view their own memberships
CREATE POLICY "om_select_own"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_master_admin(auth.uid())
);

-- Users can insert themselves as members (for signup)
CREATE POLICY "om_insert_self"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Master admins can update/delete any membership
CREATE POLICY "om_update_admins"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "om_delete_admins"
ON public.organization_members
FOR DELETE
TO authenticated
USING (public.is_master_admin(auth.uid()));