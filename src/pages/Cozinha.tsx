import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Hash,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '@/lib/errorLogger';

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

// Hook to track real-time seconds for each order
function useRealtimeSeconds(orders: Order[]) {
  const [secondsMap, setSecondsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (orders.length === 0) {
      setSecondsMap({});
      return;
    }

    // Initialize with current elapsed seconds
    const initial: Record<string, number> = {};
    orders.forEach(order => {
      const created = new Date(order.created_at);
      const now = new Date();
      initial[order.id] = Math.floor((now.getTime() - created.getTime()) / 1000);
    });
    setSecondsMap(initial);

    // Update every second
    const interval = setInterval(() => {
      setSecondsMap(prev => {
        const updated = { ...prev };
        orders.forEach(order => {
          if (updated[order.id] !== undefined) {
            updated[order.id] = updated[order.id] + 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  return secondsMap;
}

function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getWaitingColor(seconds: number): string {
  const minutes = seconds / 60;
  if (minutes < 5) return 'hsl(217, 91%, 53%)'; // primary blue
  if (minutes < 10) return '#eab308';
  if (minutes < 15) return '#f97316';
  return '#dc2626';
}

// Component for pending orders with real-time timer
const PendingOrdersGrid = ({ 
  orders, 
  formatTime, 
  processingId, 
  onMarkReady 
}: { 
  orders: Order[]; 
  formatTime: (dateString: string) => string;
  processingId: string | null;
  onMarkReady: (order: Order) => void;
}) => {
  const secondsMap = useRealtimeSeconds(orders);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((order) => {
        const seconds = secondsMap[order.id] ?? 0;
        const elapsed = Math.floor(seconds / 60);
        const isUrgent = elapsed >= 15;
        const isProcessing = processingId === order.id;

        return (
          <Card 
            key={order.id} 
            className={`overflow-hidden transition-all duration-300 hover:shadow-xl bg-white/90 backdrop-blur-sm ${
              isUrgent 
                ? 'border-2 border-red-500 ring-4 ring-red-500/20 animate-pulse' 
                : 'border border-lindezas-gold/30 hover:border-lindezas-gold/60'
            }`}
          >
            <CardHeader className={`pb-3 ${
              isUrgent 
                ? 'bg-gradient-to-r from-red-500/20 to-red-400/10' 
                : 'bg-gradient-to-r from-lindezas-gold/20 to-lindezas-cream'
            }`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-display font-bold text-lindezas-forest">
                  {order.table_number ? `Mesa ${order.table_number}` : 'Balcão'}
                </CardTitle>
              </div>
              {/* Waiting Time Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((seconds / 1200) * 100, 100)}%`,
                      backgroundColor: getWaitingColor(seconds),
                    }}
                  />
                </div>
                <div className={`flex items-center gap-2 text-sm mt-2 ${
                  isUrgent ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                }`}>
                  <span>{formatTime(order.created_at)}</span>
                  <span>•</span>
                  <span className="font-bold font-mono">{formatTimeDisplay(seconds)}</span>
                  {isUrgent && (
                    <Badge className="bg-red-500 border-0 gap-1 animate-bounce" style={{ color: '#ffffff' }}>
                      <AlertCircle className="h-3 w-3" />
                      Atrasado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Order Notes */}
              {order.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className="text-sm font-medium text-yellow-800">
                    📝 {order.notes}
                  </p>
                </div>
              )}
              
              <div className="space-y-1 bg-lindezas-cream/50 rounded-xl p-3">
                {order.order_items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b border-lindezas-gold/20 last:border-0"
                  >
                    <span 
                      className="font-bold text-lg min-w-[2.5rem] text-center rounded-lg py-1 bg-primary text-primary-foreground"
                    >
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-base text-foreground">
                      {item.product?.name}
                    </span>
                  </div>
                ))}
              </div>

                <Button
                  onClick={() => onMarkReady(order)}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full h-14 text-lg font-bold gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                style={{ color: '#ffffff' }}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Marcar como Feito
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const Cozinha = () => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const { data: pendingOrders = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['kitchen-orders-pending'],
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

  const { data: readyOrders = [], isLoading: isLoadingReady } = useQuery({
    queryKey: ['kitchen-orders-ready'],
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
        .eq('status', 'ready')
        .order('created_at', { ascending: false });

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
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders-pending'] });
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders-ready'] });
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

      queryClient.invalidateQueries({ queryKey: ['kitchen-orders-pending'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders-ready'] });
    } catch (error) {
      logError(error, 'Error marking order ready');
      toast.error('Erro ao atualizar pedido');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-lindezas-cream">
      <DashboardHeader />

      <main className="p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-background border-2 border-border shadow-md">
              <Package className="h-6 w-6 text-primary" />
            </div>
            Cozinha
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os pedidos em tempo real</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-white border border-border shadow-md rounded-xl p-1.5">
            <TabsTrigger 
              value="pending" 
              className="gap-2 rounded-lg font-semibold transition-all shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="h-4 w-4" />
              <span>Pendentes</span>
              {pendingOrders.length > 0 && (
                <Badge className="ml-1 border-0 bg-primary text-primary-foreground data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="ready" 
              className="gap-2 rounded-lg font-semibold transition-all shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Feitos</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Orders Tab */}
          <TabsContent value="pending">
            {isLoadingPending && (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground font-medium">Carregando pedidos...</p>
                </div>
              </div>
            )}

            {!isLoadingPending && pendingOrders.length === 0 && (
              <Card className="border-dashed border-2 border-primary/30 max-w-md mx-auto mt-12 bg-card">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-success flex items-center justify-center mb-4 shadow-lg">
                    <CheckCircle2 className="h-10 w-10 text-success-foreground" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">Tudo em dia!</p>
                  <p className="text-muted-foreground mt-2">
                    Nenhum pedido pendente no momento
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoadingPending && pendingOrders.length > 0 && (
              <PendingOrdersGrid 
                orders={pendingOrders} 
                formatTime={formatTime}
                processingId={processingId}
                onMarkReady={handleMarkReady}
              />
            )}
          </TabsContent>

          {/* Ready Orders Tab (History) */}
          <TabsContent value="ready">
            {isLoadingReady && (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground font-medium">Carregando pedidos...</p>
                </div>
              </div>
            )}

            {!isLoadingReady && readyOrders.length === 0 && (
              <Card className="border-dashed border-2 border-border max-w-md mx-auto mt-12 bg-card">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg">
                    <Package className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">Nenhum pedido entregue</p>
                  <p className="text-muted-foreground mt-2">
                    Os pedidos entregues aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readyOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className="overflow-hidden border border-lindezas-gold/40 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader className="pb-3 bg-gradient-to-r from-lindezas-gold/20 to-lindezas-cream">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-display font-bold text-foreground">
                        {order.table_number ? `Mesa ${order.table_number}` : 'Balcão'}
                      </CardTitle>
                      <Badge className="border-0 shadow-md gap-1 bg-accent text-accent-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                        Entregue
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <div className="p-1.5 rounded-full bg-lindezas-gold/20">
                        <Clock className="h-3.5 w-3.5 text-lindezas-gold" />
                      </div>
                      <span>Pedido às {formatTime(order.created_at)}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    {/* Order Notes */}
                    {order.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
                        <p className="text-sm font-medium text-yellow-800">
                          📝 {order.notes}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-1 bg-lindezas-cream/50 rounded-xl p-3">
                      {order.order_items.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center gap-3 py-2 border-b border-lindezas-gold/20 last:border-0"
                        >
                          <span className="font-bold text-xl min-w-[2.5rem] text-center rounded-lg py-1 bg-primary text-primary-foreground">
                            {item.quantity}x
                          </span>
                          <span className="font-medium text-base text-foreground">
                            {item.product?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Cozinha;
