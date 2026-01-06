-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables
ALTER TABLE public.categories ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create function to check if user is master admin (has 'admin' role in user_roles)
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Create function to get user's organization IDs
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = _user_id
$$;

-- Create function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  ) OR public.is_master_admin(_user_id)
$$;

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Master admins can do everything with organizations"
ON public.organizations FOR ALL
USING (public.is_master_admin(auth.uid()))
WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Members can view their organizations"
ON public.organizations FOR SELECT
USING (id IN (SELECT public.get_user_organizations(auth.uid())));

-- Organization members policies
CREATE POLICY "Master admins can manage all members"
ON public.organization_members FOR ALL
USING (public.is_master_admin(auth.uid()))
WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Users can view members of their organizations"
ON public.organization_members FOR SELECT
USING (organization_id IN (SELECT public.get_user_organizations(auth.uid())));

CREATE POLICY "Org owners can manage members"
ON public.organization_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);

-- Drop existing policies and recreate with org filtering
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Users can read categories from their org or master admin sees all"
ON public.categories FOR SELECT
USING (
  public.is_master_admin(auth.uid()) 
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Org admins can update categories"
ON public.categories FOR UPDATE
USING (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Org admins can delete categories"
ON public.categories FOR DELETE
USING (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

-- Products policies
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

CREATE POLICY "Users can read products from their org or master admin sees all"
ON public.products FOR SELECT
USING (
  public.is_master_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org members can insert products"
ON public.products FOR INSERT
WITH CHECK (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Org members can update products"
ON public.products FOR UPDATE
USING (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

-- Orders policies
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

CREATE POLICY "Users can read orders from their org or master admin sees all"
ON public.orders FOR SELECT
USING (
  public.is_master_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org members can create orders"
ON public.orders FOR INSERT
WITH CHECK (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Org members can update orders"
ON public.orders FOR UPDATE
USING (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

-- Order items policies
DROP POLICY IF EXISTS "Anyone can read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can delete order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order_items" ON public.order_items;

CREATE POLICY "Users can read order_items from their org"
ON public.order_items FOR SELECT
USING (
  public.is_master_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org members can insert order_items"
ON public.order_items FOR INSERT
WITH CHECK (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Org members can update order_items"
ON public.order_items FOR UPDATE
USING (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Org members can delete order_items"
ON public.order_items FOR DELETE
USING (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

-- Payments policies
DROP POLICY IF EXISTS "Anyone can read payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can create payments" ON public.payments;

CREATE POLICY "Users can read payments from their org"
ON public.payments FOR SELECT
USING (
  public.is_master_admin(auth.uid())
  OR organization_id IN (SELECT public.get_user_organizations(auth.uid()))
);

CREATE POLICY "Org members can create payments"
ON public.payments FOR INSERT
WITH CHECK (
  public.is_master_admin(auth.uid())
  OR public.user_belongs_to_org(auth.uid(), organization_id)
);

-- Add update trigger for organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();