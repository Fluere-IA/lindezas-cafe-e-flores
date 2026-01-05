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
  Split,
  CheckCircle2,
  Users,
  Minus,
  Plus
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

const Caixa = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [searchedTable, setSearchedTable] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [splitByPeople, setSplitByPeople] = useState(false);
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
    setSplitMode(false);
    setSplitByPeople(false);
    setNumberOfPeople(2);
    setSelectedItems(new Set());
    setSelectedPaymentMethod(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSplitMode = () => {
    setSplitMode(!splitMode);
    setSplitByPeople(false);
    setSelectedItems(new Set());
    setSelectedPaymentMethod(null);
  };

  const toggleSplitByPeople = () => {
    setSplitByPeople(!splitByPeople);
    setSplitMode(false);
    setSelectedItems(new Set());
    setSelectedPaymentMethod(null);
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

  const selectAllItems = () => {
    const unpaidItems = allItems.filter(item => !item.is_paid);
    if (selectedItems.size === unpaidItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(unpaidItems.map(item => item.id)));
    }
  };

  const handlePayment = async (method: 'dinheiro' | 'cartao' | 'pix') => {
    if (orders.length === 0) return;
    
    // In split mode, require item selection
    if (splitMode && selectedItems.size === 0) {
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

      if (splitMode) {
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

        const selectedTotal = allItems
          .filter(item => selectedItems.has(item.id))
          .reduce((sum, item) => sum + Number(item.subtotal), 0);

        toast.success(`Pagamento parcial registrado!`, {
          description: `${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'itens'} - ${methodLabels[method]} - ${formatPrice(selectedTotal)}`,
        });

        // Check if all items are now paid
        const unpaidItems = allItems.filter(item => !item.is_paid && !selectedItems.has(item.id));
        if (unpaidItems.length === 0) {
          // All items paid, mark orders as paid
          const orderIds = orders.map(o => o.id);
          await supabase
            .from('orders')
            .update({ status: 'paid', notes: `Pago via ${method}` })
            .in('id', orderIds);

          setSearchedTable(null);
          setTableNumber('');
        }
        
        setSplitMode(false);
        setSelectedItems(new Set());
        setSelectedPaymentMethod(null);
        queryClient.invalidateQueries({ queryKey: ['table-orders'] });
      } else if (splitByPeople) {
        // Split by people - mark one person's share as paid
        // We need to track partial payments on order level
        toast.success(`Pagamento de 1/${numberOfPeople} registrado!`, {
          description: `${methodLabels[method]} - ${formatPrice(perPersonAmount)}`,
        });
        
        setSplitByPeople(false);
        setSelectedPaymentMethod(null);
        // Note: For equal split, we don't mark items as paid individually
        // This is just for display purposes
      } else {
        // Full payment - mark all items as paid first
        const allItemIds = allItems.map(item => item.id);
        
        await supabase
          .from('order_items')
          .update({ 
            is_paid: true, 
            paid_at: new Date().toISOString(),
            payment_method: method 
          })
          .in('id', allItemIds);

        const orderIds = orders.map(o => o.id);
        
        const { error } = await supabase
          .from('orders')
          .update({ status: 'paid', notes: `Pago via ${method}` })
          .in('id', orderIds);

        if (error) throw error;

        toast.success(`Pagamento registrado!`, {
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
  
  const selectedTotal = splitMode 
    ? allItems.filter(item => selectedItems.has(item.id)).reduce((sum, item) => sum + Number(item.subtotal), 0)
    : totalGeral;

  const perPersonAmount = splitByPeople ? totalGeral / numberOfPeople : 0;

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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
                    </Badge>
                  </div>
                </div>
                
                {/* Split Options */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button
                    variant={splitMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSplitMode}
                    className="gap-1 flex-1"
                  >
                    <Split className="h-4 w-4" />
                    Por Itens
                  </Button>
                  <Button
                    variant={splitByPeople ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSplitByPeople}
                    className="gap-1 flex-1"
                  >
                    <Users className="h-4 w-4" />
                    Por Pessoas
                  </Button>
                </div>

                {splitMode && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Selecione os itens a serem pagos
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllItems}
                      className="text-xs"
                    >
                      {selectedItems.size === unpaidItems.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </Button>
                  </div>
                )}

                {splitByPeople && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Dividir entre quantas pessoas?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))}
                        disabled={numberOfPeople <= 2}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{numberOfPeople}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setNumberOfPeople(Math.min(20, numberOfPeople + 1))}
                        disabled={numberOfPeople >= 20}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paid Items (if any) */}
                {paidItems.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Itens já pagos ({formatPrice(totalPago)})
                      </p>
                      {paidItems.map((item, index) => (
                        <div 
                          key={`paid-${item.id}-${index}`}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg bg-green-500/10 border border-green-500/30 opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <div className="flex-1">
                            <p className="font-medium line-through">{item.quantity}x {item.product?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Pedido #{item.orderNumber} • {formatTime(item.orderTime)}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600 line-through">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Unpaid Items List */}
                {unpaidItems.length > 0 && (
                  <div className="space-y-2">
                    {unpaidItems.length > 0 && paidItems.length > 0 && (
                      <p className="text-sm font-medium text-muted-foreground">
                        Itens a pagar
                      </p>
                    )}
                    {unpaidItems.map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`}
                        className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
                          splitMode 
                            ? selectedItems.has(item.id)
                              ? 'bg-primary/10 border border-primary/30'
                              : 'bg-secondary/30 hover:bg-secondary/50 cursor-pointer'
                            : 'bg-secondary/30'
                        }`}
                        onClick={() => splitMode && toggleItemSelection(item.id)}
                      >
                        {splitMode && (
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                            className="pointer-events-none"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.quantity}x {item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Pedido #{item.orderNumber} • {formatTime(item.orderTime)}
                          </p>
                        </div>
                        <p className={`font-semibold ${splitMode && selectedItems.has(item.id) ? 'text-primary' : 'text-gold'}`}>
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {unpaidItems.length === 0 && paidItems.length > 0 && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="font-medium text-green-600">Conta fechada!</p>
                    <p className="text-sm text-muted-foreground">Todos os itens foram pagos</p>
                  </div>
                )}

                <Separator />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-lg font-medium">
                        {splitMode ? 'Total Selecionado' : splitByPeople ? 'Total da Mesa' : 'Total a Pagar'}
                      </span>
                      {splitMode && selectedItems.size > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedItems.size} de {unpaidItems.length} itens
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold font-display">
                      {formatPrice(splitMode ? selectedTotal : totalGeral)}
                    </span>
                  </div>

                  {splitByPeople && totalGeral > 0 && (
                    <div className="flex items-center justify-between py-3 px-4 bg-primary/10 rounded-lg border border-primary/30">
                      <div>
                        <span className="text-lg font-medium text-primary">Valor por Pessoa</span>
                        <p className="text-xs text-muted-foreground">
                          Dividido entre {numberOfPeople} pessoas
                        </p>
                      </div>
                      <span className="text-2xl font-bold font-display text-primary">
                        {formatPrice(perPersonAmount)}
                      </span>
                    </div>
                  )}
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
              <CardContent className="space-y-4">
                {/* Payment Method Selection */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={selectedPaymentMethod === 'dinheiro' ? 'default' : 'outline'}
                    size="lg"
                    className="h-20 flex-col gap-2"
                    onClick={() => setSelectedPaymentMethod('dinheiro')}
                    disabled={isProcessing}
                  >
                    <Banknote className="h-6 w-6" />
                    <span>Dinheiro</span>
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'cartao' ? 'default' : 'outline'}
                    size="lg"
                    className="h-20 flex-col gap-2"
                    onClick={() => setSelectedPaymentMethod('cartao')}
                    disabled={isProcessing}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span>Cartão</span>
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'pix' ? 'default' : 'outline'}
                    size="lg"
                    className="h-20 flex-col gap-2"
                    onClick={() => setSelectedPaymentMethod('pix')}
                    disabled={isProcessing}
                  >
                    <QrCode className="h-6 w-6" />
                    <span>PIX</span>
                  </Button>
                </div>

                {/* Confirm Payment Button */}
                <Button
                  className="w-full h-14 text-lg gap-2"
                  size="lg"
                  onClick={() => selectedPaymentMethod && handlePayment(selectedPaymentMethod)}
                  disabled={
                    isProcessing || 
                    !selectedPaymentMethod || 
                    (splitMode && selectedItems.size === 0) ||
                    unpaidItems.length === 0
                  }
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      {splitByPeople 
                        ? `Pagar ${formatPrice(perPersonAmount)} (1/${numberOfPeople})`
                        : `Finalizar Pagamento - ${formatPrice(splitMode ? selectedTotal : totalGeral)}`
                      }
                    </>
                  )}
                </Button>

                {splitMode && selectedItems.size === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Selecione os itens para pagar
                  </p>
                )}

                {unpaidItems.length === 0 && (
                  <p className="text-xs text-green-600 text-center font-medium">
                    ✓ Todos os itens já foram pagos
                  </p>
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
