-- Drop existing overly permissive payment policies
DROP POLICY IF EXISTS "Authenticated users can read payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON payments;

-- Create role-based RLS for SELECT (cashiers and admins only)
CREATE POLICY "Cashiers and admins can read payments"
ON payments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'cashier'::app_role)
);

-- Create role-based RLS for INSERT (cashiers and admins only)
CREATE POLICY "Cashiers and admins can create payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'cashier'::app_role)
);