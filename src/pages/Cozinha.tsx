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
      console.error('Error marking order ready:', error);
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
          <h1 className="text-3xl font-display font-bold text-lindezas-forest flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-lindezas-forest to-lindezas-forest/80 text-white shadow-lg">
              <Package className="h-6 w-6" />
            </div>
            Cozinha
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os pedidos em tempo real</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-white border border-lindezas-gold/30 shadow-md rounded-xl p-1.5">
            <TabsTrigger 
              value="pending" 
              className="gap-2 rounded-lg font-semibold transition-all shadow-sm"
              style={{ 
                backgroundColor: 'transparent',
                color: '#4A3728'
              }}
            >
              <Clock className="h-4 w-4" />
              <span>Pendentes</span>
              {pendingOrders.length > 0 && (
                <Badge className="ml-1 border-0" style={{ backgroundColor: '#2D5A27', color: '#ffffff' }}>
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="ready" 
              className="gap-2 rounded-lg font-semibold transition-all shadow-sm"
              style={{ 
                backgroundColor: 'transparent',
                color: '#4A3728'
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Prontos</span>
              {readyOrders.length > 0 && (
                <Badge className="ml-1 border-0" style={{ backgroundColor: '#16a34a', color: '#ffffff' }}>
                  {readyOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Orders Tab */}
          <TabsContent value="pending">
            {isLoadingPending && (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-lindezas-gold" />
                  <p className="text-muted-foreground font-medium">Carregando pedidos...</p>
                </div>
              </div>
            )}

            {!isLoadingPending && pendingOrders.length === 0 && (
              <Card className="border-dashed border-2 border-lindezas-forest/30 max-w-md mx-auto mt-12 bg-white/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-2xl font-display font-bold text-lindezas-forest">Tudo em dia!</p>
                  <p className="text-muted-foreground mt-2">
                    Nenhum pedido pendente no momento
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.created_at);
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
                          #{order.order_number}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {order.table_number && (
                            <Badge className="gap-1 bg-lindezas-forest text-white border-0 shadow-sm">
                              <Hash className="h-3 w-3" />
                              Mesa {order.table_number}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 text-sm mt-2 ${
                        isUrgent ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                      }`}>
                        <div className={`p-1.5 rounded-full ${isUrgent ? 'bg-red-500/20' : 'bg-lindezas-forest/10'}`}>
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <span>{formatTime(order.created_at)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-bold">{elapsed} min</span>
                        {isUrgent && (
                          <Badge className="bg-red-500 text-white border-0 gap-1 animate-bounce">
                            <AlertCircle className="h-3 w-3" />
                            Atrasado
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-1 bg-lindezas-cream/50 rounded-xl p-3">
                        {order.order_items.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-3 py-2 border-b border-lindezas-gold/20 last:border-0"
                          >
                            <span className="font-bold text-xl text-lindezas-gold min-w-[2.5rem] text-center bg-lindezas-forest rounded-lg py-1 text-white">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-base text-lindezas-forest">
                              {item.product?.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => handleMarkReady(order)}
                        disabled={isProcessing}
                        size="lg"
                        className="w-full h-14 text-lg font-bold gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
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
          </TabsContent>

          {/* Ready Orders Tab (History) */}
          <TabsContent value="ready">
            {isLoadingReady && (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                  <p className="text-muted-foreground font-medium">Carregando pedidos...</p>
                </div>
              </div>
            )}

            {!isLoadingReady && readyOrders.length === 0 && (
              <Card className="border-dashed border-2 border-lindezas-forest/30 max-w-md mx-auto mt-12 bg-white/80 backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-4 shadow-lg">
                    <Package className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-2xl font-display font-bold text-lindezas-forest">Nenhum pedido pronto</p>
                  <p className="text-muted-foreground mt-2">
                    Os pedidos prontos aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readyOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className="overflow-hidden border-2 border-green-500/50 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader className="pb-3 bg-gradient-to-r from-green-500/20 to-green-400/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-display font-bold text-lindezas-forest">
                        #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {order.table_number && (
                          <Badge className="gap-1 bg-lindezas-forest text-white border-0 shadow-sm">
                            <Hash className="h-3 w-3" />
                            Mesa {order.table_number}
                          </Badge>
                        )}
                        <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 shadow-md gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Pronto
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <div className="p-1.5 rounded-full bg-green-500/20">
                        <Clock className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <span>Pedido às {formatTime(order.created_at)}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="space-y-1 bg-green-50/50 rounded-xl p-3">
                      {order.order_items.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center gap-3 py-2 border-b border-green-200 last:border-0"
                        >
                          <span className="font-bold text-xl min-w-[2.5rem] text-center bg-green-600 rounded-lg py-1 text-white">
                            {item.quantity}x
                          </span>
                          <span className="font-medium text-base text-lindezas-forest">
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
