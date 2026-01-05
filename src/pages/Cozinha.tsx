import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  order_number: number;
  table_number: number | null;
  status: string;
  created_at: string;
  notes: string | null;
  order_items: OrderItem[];
}

const Cozinha = () => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedMinutes = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          table_number,
          status,
          created_at,
          notes,
          order_items (
            id,
            quantity,
            product:products (name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as unknown as Order[]) || [];
    },
  });

  // Realtime subscription for orders
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Refetch orders on any change
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleMarkReady = async (order: Order) => {
    setProcessingId(order.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', order.id);

      if (error) throw error;

      toast.success(`Pedido #${order.order_number} pronto!`, {
        description: order.table_number ? `Mesa ${order.table_number}` : undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    } catch (error) {
      console.error('Error marking order ready:', error);
      toast.error('Erro ao atualizar pedido');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="secondary" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <ChefHat className="h-6 w-6" />
              <h1 className="font-display text-xl font-bold">Cozinha</h1>
            </div>
          </div>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </Badge>
        </div>
      </header>

      <main className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <Card className="border-dashed max-w-md mx-auto mt-12">
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-xl font-medium">Tudo em dia!</p>
              <p className="text-muted-foreground mt-1">
                Nenhum pedido pendente no momento
              </p>
            </CardContent>
          </Card>
        )}

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const elapsed = getElapsedMinutes(order.created_at);
            const isUrgent = elapsed >= 15;
            const isProcessing = processingId === order.id;

            return (
              <Card 
                key={order.id} 
                className={`overflow-hidden transition-all ${
                  isUrgent ? 'border-destructive ring-2 ring-destructive/20' : ''
                }`}
              >
                <CardHeader className={`pb-2 ${isUrgent ? 'bg-destructive/10' : 'bg-secondary/30'}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">
                      #{order.order_number}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {order.table_number && (
                        <Badge variant="outline" className="gap-1">
                          <Hash className="h-3 w-3" />
                          Mesa {order.table_number}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    isUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(order.created_at)}</span>
                    <span className="mx-1">•</span>
                    <span>{elapsed} min</span>
                    {isUrgent && (
                      <>
                        <AlertCircle className="h-4 w-4 ml-1" />
                        <span>Atrasado</span>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                      >
                        <span className="font-bold text-lg text-primary min-w-[2rem]">
                          {item.quantity}x
                        </span>
                        <span className="font-medium text-base">
                          {item.product?.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Ready Button */}
                  <Button
                    onClick={() => handleMarkReady(order)}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    Marcar como Pronto
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Cozinha;
