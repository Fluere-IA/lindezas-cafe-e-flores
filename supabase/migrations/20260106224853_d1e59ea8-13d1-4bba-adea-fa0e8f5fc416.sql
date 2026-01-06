-- Add DELETE policy for products table
-- Allows organization members to delete products from their own organization

CREATE POLICY "Org members can delete products"
ON public.products
FOR DELETE
USING (
  is_master_admin(auth.uid()) 
  OR user_belongs_to_org(auth.uid(), organization_id)
);