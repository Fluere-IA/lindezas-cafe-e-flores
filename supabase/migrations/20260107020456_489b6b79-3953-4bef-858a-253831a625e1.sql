-- =====================================================
-- PERFORMANCE INDEXES FOR MULTI-TENANT SCALABILITY
-- =====================================================

-- Organizations lookup by slug (for URL routing)
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Organization members - fast user-to-org lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org ON public.organization_members(user_id, organization_id);

-- Products - filtered queries per organization
CREATE INDEX IF NOT EXISTS idx_products_org_active ON public.products(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_org_category ON public.products(organization_id, category_id);

-- Categories - per organization lookups
CREATE INDEX IF NOT EXISTS idx_categories_org_id ON public.categories(organization_id);

-- Orders - dashboard and status queries
CREATE INDEX IF NOT EXISTS idx_orders_org_created ON public.orders(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON public.orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_org_status_created ON public.orders(organization_id, status, created_at DESC);

-- Order items - sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_org_created ON public.order_items(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Payments - financial reports
CREATE INDEX IF NOT EXISTS idx_payments_org_created ON public.payments(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- User roles - auth lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Organization invites - lookup by email
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON public.organization_invites(organization_id);