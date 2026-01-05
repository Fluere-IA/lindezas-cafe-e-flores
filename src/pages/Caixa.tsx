import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Hash, 
  Search, 
  CreditCard, 
  Banknote, 
  QrCode,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Minus,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_paid: boolean;
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

interface ItemWithOrder extends OrderItem {
  orderNumber: number;
  orderTime: string;
  orderId: string;
}

type PaymentMode = 'full' | 'by-items' | 'by-people';

const Caixa = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [searchedTable, setSearchedTable] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);
  const queryClient = useQueryClient();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const { data: orders = [], isLoading } = useQuery({
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
            is_paid,
            product:products (name)
          )
        `)
        .eq('table_number', searchedTable)
        .in('status', ['ready', 'pending'])
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
    resetPaymentState();
  };

  const resetPaymentState = () => {
    setPaymentMode('full');
    setNumberOfPeople(2);
    setSelectedItems(new Set());
    setSelectedPaymentMethod(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handlePayment = async (method: 'dinheiro' | 'cartao' | 'pix') => {
    if (orders.length === 0) return;
    
    if (paymentMode === 'by-items' && selectedItems.size === 0) {
      toast.error('Selecione os itens a serem pagos');
      return;
    }

    setIsProcessing(true);
    try {
      const methodLabels = {
        dinheiro: 'Dinheiro',
        cartao: 'Cartão',
        pix: 'PIX'
      };

      if (paymentMode === 'by-items') {
        // Partial payment - mark selected items as paid
        const selectedItemIds = Array.from(selectedItems);
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .update({ 
            is_paid: true, 
            paid_at: new Date().toISOString(),
            payment_method: method 
          })
          .in('id', selectedItemIds);

        if (itemsError) throw itemsError;

        const selectedTotal = unpaidItems
          .filter(item => selectedItems.has(item.id))
          .reduce((sum, item) => sum + Number(item.subtotal), 0);

        toast.success(`Pagamento registrado!`, {
          description: `${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'itens'} - ${methodLabels[method]} - ${formatPrice(selectedTotal)}`,
        });

        // Check if all items are now paid
        const remainingUnpaid = unpaidItems.filter(item => !selectedItems.has(item.id));
        if (remainingUnpaid.length === 0) {
          const orderIds = orders.map(o => o.id);
          await supabase
            .from('orders')
            .update({ status: 'paid', notes: `Pago via ${method}` })
            .in('id', orderIds);

          setSearchedTable(null);
          setTableNumber('');
        }
        
        resetPaymentState();
        queryClient.invalidateQueries({ queryKey: ['table-orders'] });
      } else if (paymentMode === 'by-people') {
        toast.success(`Pagamento de 1 pessoa registrado!`, {
          description: `${methodLabels[method]} - ${formatPrice(perPersonAmount)}`,
        });
        resetPaymentState();
      } else {
        // Full payment
        const allItemIds = unpaidItems.map(item => item.id);
        
        if (allItemIds.length > 0) {
          await supabase
            .from('order_items')
            .update({ 
              is_paid: true, 
              paid_at: new Date().toISOString(),
              payment_method: method 
            })
            .in('id', allItemIds);
        }

        const orderIds = orders.map(o => o.id);
        
        const { error } = await supabase
          .from('orders')
          .update({ status: 'paid', notes: `Pago via ${method}` })
          .in('id', orderIds);

        if (error) throw error;

        toast.success(`Conta fechada!`, {
          description: `Mesa ${searchedTable} - ${methodLabels[method]} - ${formatPrice(totalGeral)}`,
        });

        setSearchedTable(null);
        setTableNumber('');
        queryClient.invalidateQueries({ queryKey: ['table-orders'] });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate totals
  const allItems: ItemWithOrder[] = orders.flatMap(order => 
    order.order_items.map(item => ({
      ...item,
      orderNumber: order.order_number,
      orderTime: order.created_at,
      orderId: order.id,
    }))
  );

  const unpaidItems = allItems.filter(item => !item.is_paid);
  const paidItems = allItems.filter(item => item.is_paid);
  const totalGeral = unpaidItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const totalPago = paidItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
  
  const selectedTotal = paymentMode === 'by-items' 
    ? unpaidItems.filter(item => selectedItems.has(item.id)).reduce((sum, item) => sum + Number(item.subtotal), 0)
    : totalGeral;

  const perPersonAmount = paymentMode === 'by-people' ? totalGeral / numberOfPeople : 0;

  const getPaymentTotal = () => {
    if (paymentMode === 'by-items') return selectedTotal;
    if (paymentMode === 'by-people') return perPersonAmount;
    return totalGeral;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="p-4 max-w-2xl mx-auto space-y-4">
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
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Mesa {searchedTable}
                    <Badge variant="secondary" className="font-normal">
                      {unpaidItems.length} {unpaidItems.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </CardTitle>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(totalGeral)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Paid Items Summary */}
                {paidItems.length > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">{paidItems.length} {paidItems.length === 1 ? 'item já pago' : 'itens já pagos'}</span>
                    </div>
                    <span className="font-medium text-green-700">{formatPrice(totalPago)}</span>
                  </div>
                )}

                {/* Unpaid Items List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {unpaidItems.map((item, index) => (
                    <div 
                      key={`${item.id}-${index}`}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all ${
                        paymentMode === 'by-items'
                          ? selectedItems.has(item.id)
                            ? 'bg-primary/15 border-2 border-primary'
                            : 'bg-muted/50 hover:bg-muted cursor-pointer border-2 border-transparent'
                          : 'bg-muted/50'
                      }`}
                      onClick={() => paymentMode === 'by-items' && toggleItemSelection(item.id)}
                    >
                      {paymentMode === 'by-items' && (
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          className="pointer-events-none"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.quantity}x {item.product?.name}</p>
                      </div>
                      <p className="font-semibold text-primary whitespace-nowrap">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                {unpaidItems.length === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
                    <p className="font-medium text-green-600">Conta fechada!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Options */}
            {unpaidItems.length > 0 && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  {/* How to pay */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Como deseja pagar?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMode === 'full' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setPaymentMode('full'); setSelectedItems(new Set()); }}
                        className="h-auto py-3 flex-col gap-1"
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-xs">Conta toda</span>
                      </Button>
                      <Button
                        variant={paymentMode === 'by-items' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMode('by-items')}
                        className="h-auto py-3 flex-col gap-1"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-xs">Por itens</span>
                      </Button>
                      <Button
                        variant={paymentMode === 'by-people' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setPaymentMode('by-people'); setSelectedItems(new Set()); }}
                        className="h-auto py-3 flex-col gap-1"
                      >
                        <Users className="h-5 w-5" />
                        <span className="text-xs">Dividir igual</span>
                      </Button>
                    </div>
                  </div>

                  {/* By Items Selection Info */}
                  {paymentMode === 'by-items' && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {selectedItems.size === 0 
                            ? 'Toque nos itens acima para selecionar'
                            : `${selectedItems.size} ${selectedItems.size === 1 ? 'item selecionado' : 'itens selecionados'}`
                          }
                        </span>
                        {selectedItems.size > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItems(new Set())}
                            className="h-7 px-2 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>
                      {selectedItems.size > 0 && (
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatPrice(selectedTotal)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* By People Selector */}
                  {paymentMode === 'by-people' && (
                    <div className="bg-primary/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Dividir entre:</span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))}
                            disabled={numberOfPeople <= 2}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-xl font-bold w-8 text-center">{numberOfPeople}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setNumberOfPeople(Math.min(20, numberOfPeople + 1))}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="text-muted-foreground">pessoas</span>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Valor por pessoa:</span>
                        <span className="text-2xl font-bold text-primary">{formatPrice(perPersonAmount)}</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Payment Method */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Forma de pagamento</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={selectedPaymentMethod === 'dinheiro' ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentMethod('dinheiro')}
                        disabled={isProcessing || (paymentMode === 'by-items' && selectedItems.size === 0)}
                        className="h-14 flex-col gap-1"
                      >
                        <Banknote className="h-5 w-5" />
                        <span className="text-xs">Dinheiro</span>
                      </Button>
                      <Button
                        variant={selectedPaymentMethod === 'cartao' ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentMethod('cartao')}
                        disabled={isProcessing || (paymentMode === 'by-items' && selectedItems.size === 0)}
                        className="h-14 flex-col gap-1"
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-xs">Cartão</span>
                      </Button>
                      <Button
                        variant={selectedPaymentMethod === 'pix' ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentMethod('pix')}
                        disabled={isProcessing || (paymentMode === 'by-items' && selectedItems.size === 0)}
                        className="h-14 flex-col gap-1"
                      >
                        <QrCode className="h-5 w-5" />
                        <span className="text-xs">PIX</span>
                      </Button>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <Button
                    className="w-full h-14 text-lg"
                    size="lg"
                    onClick={() => selectedPaymentMethod && handlePayment(selectedPaymentMethod)}
                    disabled={
                      isProcessing || 
                      !selectedPaymentMethod || 
                      (paymentMode === 'by-items' && selectedItems.size === 0)
                    }
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Confirmar {formatPrice(getPaymentTotal())}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Caixa;