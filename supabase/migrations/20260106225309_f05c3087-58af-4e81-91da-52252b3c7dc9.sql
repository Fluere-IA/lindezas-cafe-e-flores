-- Add missing RLS policies for complete security coverage

-- 1. Orders DELETE policy - only master admins can delete orders (protect order history)
CREATE POLICY "Master admins can delete orders"
ON public.orders
FOR DELETE
USING (is_master_admin(auth.uid()));

-- 2. Payments UPDATE policy - only master admins can update payments (audit trail protection)
CREATE POLICY "Master admins can update payments"
ON public.payments
FOR UPDATE
USING (is_master_admin(auth.uid()));

-- 3. Payments DELETE policy - only master admins can delete payments (prevent fraud cover-up)
CREATE POLICY "Master admins can delete payments"
ON public.payments
FOR DELETE
USING (is_master_admin(auth.uid()));

-- 4. Organizations UPDATE policy for owners - allow org owners to update their org details
CREATE POLICY "Org owners can update their organization"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
);