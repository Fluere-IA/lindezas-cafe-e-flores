import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Hash, 
  Search, 
  Receipt, 
  CreditCard, 
  Banknote, 
  QrCode,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  order_number: number;
  table_number: number;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

const Caixa = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [searchedTable, setSearchedTable] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['table-orders', searchedTable],
    queryFn: async () => {
      if (!searchedTable) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          table_number,
          total,
          status,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            subtotal,
            product:products (name)
          )
        `)
        .eq('table_number', searchedTable)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as unknown as Order[]) || [];
    },
    enabled: searchedTable !== null,
  });

  const handleSearch = () => {
    const num = parseInt(tableNumber);
    if (!num || num < 1) {
      toast.error('Informe um número de mesa válido');
      return;
    }
    setSearchedTable(num);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePayment = async (method: 'dinheiro' | 'cartao' | 'pix') => {
    if (orders.length === 0) return;
    
    setIsProcessing(true);
    try {
      const orderIds = orders.map(o => o.id);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', notes: `Pago via ${method}` })
        .in('id', orderIds);

      if (error) throw error;

      const methodLabels = {
        dinheiro: 'Dinheiro',
        cartao: 'Cartão',
        pix: 'PIX'
      };

      toast.success(`Pagamento registrado!`, {
        description: `Mesa ${searchedTable} - ${methodLabels[method]} - ${formatPrice(totalGeral)}`,
      });

      setSearchedTable(null);
      setTableNumber('');
      queryClient.invalidateQueries({ queryKey: ['table-orders'] });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate totals
  const allItems = orders.flatMap(order => 
    order.order_items.map(item => ({
      ...item,
      orderNumber: order.order_number,
      orderTime: order.created_at,
    }))
  );

  const totalGeral = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Search by Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Buscar Mesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Número da mesa"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onKeyDown={handleKeyPress}
                  className="pl-9 h-12 text-lg"
                  maxLength={2}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="h-12 px-6"
              >
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {searchedTable && !isLoading && orders.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum pedido pendente</p>
              <p className="text-sm text-muted-foreground">
                Mesa {searchedTable} não possui pedidos em aberto
              </p>
            </CardContent>
          </Card>
        )}

        {orders.length > 0 && (
          <>
            {/* Order Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Mesa {searchedTable}
                  </CardTitle>
                  <Badge variant="secondary">
                    {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items List */}
                <div className="space-y-2">
                  {allItems.map((item, index) => (
                    <div 
                      key={`${item.id}-${index}`}
                      className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.quantity}x {item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Pedido #{item.orderNumber} • {formatTime(item.orderTime)}
                        </p>
                      </div>
                      <p className="font-semibold text-gold">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold font-display">
                    {formatPrice(totalGeral)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-20 flex-col gap-2"
                    onClick={() => handlePayment('dinheiro')}
                    disabled={isProcessing}
                  >
                    <Banknote className="h-6 w-6" />
                    <span>Dinheiro</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-20 flex-col gap-2"
                    onClick={() => handlePayment('cartao')}
                    disabled={isProcessing}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span>Cartão</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-20 flex-col gap-2"
                    onClick={() => handlePayment('pix')}
                    disabled={isProcessing}
                  >
                    <QrCode className="h-6 w-6" />
                    <span>PIX</span>
                  </Button>
                </div>

                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processando...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Caixa;
