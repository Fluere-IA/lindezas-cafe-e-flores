-- Add table configuration to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS table_count INTEGER DEFAULT 10;

-- Create organization invites table for team member management
CREATE TABLE public.organization_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Policies for organization_invites
CREATE POLICY "Org owners/admins can manage invites"
ON public.organization_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_invites.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  ) OR is_master_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_invites.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  ) OR is_master_admin(auth.uid())
);

-- Users can view invites sent to their email
CREATE POLICY "Users can view their pending invites"
ON public.organization_invites
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
);