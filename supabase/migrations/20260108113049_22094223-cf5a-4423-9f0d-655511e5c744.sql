-- Create enum for audit event types
CREATE TYPE public.audit_event_type AS ENUM ('cancel', 'edit', 'void', 'delete', 'status_change', 'item_removed');

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number INTEGER,
  event_type audit_event_type NOT NULL,
  description TEXT NOT NULL,
  user_id UUID,
  user_email TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_order ON public.audit_logs(order_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only org members can read their audit logs
CREATE POLICY "Org members can read audit logs"
ON public.audit_logs
FOR SELECT
USING (
  is_master_admin(auth.uid()) OR 
  (organization_id IN (SELECT get_user_organizations(auth.uid())))
);

-- Allow inserts from authenticated users for their org
CREATE POLICY "Org members can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  is_master_admin(auth.uid()) OR 
  user_belongs_to_org(auth.uid(), organization_id)
);

-- Create function to log order status changes automatically
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event audit_event_type;
  desc_text TEXT;
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determine event type based on new status
    IF NEW.status = 'cancelled' THEN
      event := 'cancel';
      desc_text := 'Pedido cancelado';
    ELSE
      event := 'status_change';
      desc_text := 'Status alterado de ' || COALESCE(OLD.status, 'null') || ' para ' || NEW.status;
    END IF;

    INSERT INTO public.audit_logs (
      organization_id,
      order_id,
      order_number,
      event_type,
      description,
      user_id,
      old_values,
      new_values
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      NEW.order_number,
      event,
      desc_text,
      auth.uid(),
      jsonb_build_object('status', OLD.status, 'total', OLD.total, 'notes', OLD.notes),
      jsonb_build_object('status', NEW.status, 'total', NEW.total, 'notes', NEW.notes)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for order status changes
CREATE TRIGGER trigger_log_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();

-- Create function to log order item deletions
CREATE OR REPLACE FUNCTION public.log_order_item_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_num INTEGER;
BEGIN
  -- Get order number for the log
  SELECT order_number INTO order_num 
  FROM public.orders 
  WHERE id = OLD.order_id;

  INSERT INTO public.audit_logs (
    organization_id,
    order_id,
    order_number,
    event_type,
    description,
    user_id,
    old_values
  ) VALUES (
    OLD.organization_id,
    OLD.order_id,
    order_num,
    'item_removed',
    'Item removido do pedido',
    auth.uid(),
    jsonb_build_object(
      'product_id', OLD.product_id,
      'quantity', OLD.quantity,
      'unit_price', OLD.unit_price,
      'subtotal', OLD.subtotal
    )
  );

  RETURN OLD;
END;
$$;

-- Create trigger for order item deletions
CREATE TRIGGER trigger_log_order_item_deletion
BEFORE DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.log_order_item_deletion();