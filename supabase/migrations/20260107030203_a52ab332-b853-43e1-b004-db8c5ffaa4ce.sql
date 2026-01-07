-- Drop existing problematic policies on organization_members
DROP POLICY IF EXISTS "Members can view their organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can manage organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Authenticated users can insert their first membership" ON public.organization_members;

-- Drop existing policies on organizations that might cause issues
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create their own organization" ON public.organizations;

-- Create security definer function to check if user belongs to an organization (avoids recursion)
CREATE OR REPLACE FUNCTION public.user_belongs_to_org_safe(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Create security definer function to check if user is org owner
CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = 'owner'
  )
$$;

-- Create security definer function to get user's organization IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
$$;

-- RLS Policies for organizations table
-- Anyone authenticated can create an organization (for signup flow)
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can view organizations they belong to, or master admins see all
CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.is_master_admin(auth.uid()) OR
  id IN (SELECT public.get_user_org_ids(auth.uid()))
);

-- Owners and master admins can update organizations
CREATE POLICY "Owners can update their organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  public.is_master_admin(auth.uid()) OR
  public.is_org_owner(auth.uid(), id)
);

-- RLS Policies for organization_members table
-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
ON public.organization_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_master_admin(auth.uid()));

-- Authenticated users can insert their first membership (during signup)
CREATE POLICY "Users can insert their own membership"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Owners can manage members of their organization
CREATE POLICY "Owners can manage organization members"
ON public.organization_members
FOR ALL
TO authenticated
USING (
  public.is_master_admin(auth.uid()) OR
  public.is_org_owner(auth.uid(), organization_id)
);