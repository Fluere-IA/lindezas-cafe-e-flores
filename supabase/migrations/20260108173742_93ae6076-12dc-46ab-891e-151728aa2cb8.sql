-- Allow unauthenticated users to view pending invites by ID
-- This is needed for the invite acceptance flow where users aren't logged in yet
CREATE POLICY "Anyone can view pending invites by id"
ON public.organization_invites
FOR SELECT
USING (status = 'pending' AND expires_at > now());