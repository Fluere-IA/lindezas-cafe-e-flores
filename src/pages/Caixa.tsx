import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_paid: boolean;
  product: { name: string };
}

interface Order {
  id: string;
  order_number: number;
  table_number: number;
  total: number;
  paid_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  items_count: number;
  created_at: string;
}

interface ItemWithOrder extends OrderItem {
  orderNumber: number;
  orderId: string;
}

type PaymentMode = 'full' | 'by-items' | 'by-people' | 'by-value';

const Caixa = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [searchedTable, setSearchedTable] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [customValue, setCustomValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const parseInputValue = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned) / 100 : 0;
  };

  const formatInputValue = (value: string): string => {
    const numValue = parseInputValue(value);
    if (numValue === 0) return '';
    return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['table-orders', searchedTable],
    queryFn: async () => {
      if (!searchedTable) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, table_number, total, paid_amount, status, created_at,
          order_items ( id, quantity, unit_price, subtotal, is_paid, product:products (name) )
        `)
        .eq('table_number', searchedTable)
        .in('status', ['ready', 'pending'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as unknown as Order[]) || [];
    },
    enabled: searchedTable !== null,
  });

  // Fetch payments linked to current orders only
  const orderIds = orders.map(o => o.id);
  const { data: payments = [] } = useQuery({
    queryKey: ['order-payments', orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Payment[]) || [];
    },
    enabled: orderIds.length > 0,
  });

  const handleSearch = () => {
    const num = parseInt(tableNumber);
    if (!num || num < 1) {
      toast.error('Informe um número de mesa válido');
      return;
    }
    setSearchedTable(num);
    resetPaymentState();
    setShowHistory(false);
  };

  const resetPaymentState = () => {
    setPaymentMode('full');
    setNumberOfPeople(2);
    setCustomValue('');
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

  const handleDeleteItem = async (item: ItemWithOrder) => {
    if (!confirm(`Remover "${item.product?.name}" do pedido?`)) return;
    
    try {
      // Delete the order item
      await supabase
        .from('order_items')
        .delete()
        .eq('id', item.id);

      // Update the order total
      const order = orders.find(o => o.id === item.orderId);
      if (order) {
        const newTotal = Number(order.total) - Number(item.subtotal);
        await supabase
          .from('orders')
          .update({ total: Math.max(0, newTotal) })
          .eq('id', item.orderId);
      }

      queryClient.invalidateQueries({ queryKey: ['table-orders'] });
      toast.success('Item removido');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao remover item');
    }
  };

  // Calculate totals
  const allItems: ItemWithOrder[] = orders.flatMap(order => 
    order.order_items.map(item => ({
      ...item,
      orderNumber: order.order_number,
      orderId: order.id,
    }))
  );

  const unpaidItems = allItems.filter(item => !item.is_paid);
  const paidItemsTotal = allItems.filter(item => item.is_paid).reduce((sum, item) => sum + Number(item.subtotal), 0);
  const partialPayments = orders.reduce((sum, order) => sum + Number(order.paid_amount || 0), 0);
  
  const totalOriginal = allItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const totalPago = paidItemsTotal + partialPayments;
  const totalRestante = Math.max(0, totalOriginal - totalPago);
  
  const selectedTotal = unpaidItems.filter(item => selectedItems.has(item.id)).reduce((sum, item) => sum + Number(item.subtotal), 0);
  const customAmount = parseInputValue(customValue);

  // "Dividir por pessoas" - valor fixo por pessoa calculado uma única vez no total original
  // Não recalcula após pagamentos parciais
  const perPersonAmount = paymentMode === 'by-people' && numberOfPeople > 0 
    ? totalOriginal / numberOfPeople 
    : 0;
  
  // Quantas pessoas já pagaram (baseado no que já foi pago)
  const paidPeopleCount = totalPago > 0 ? Math.floor(totalPago / perPersonAmount) : 0;
  const remainingPeople = Math.max(0, numberOfPeople - paidPeopleCount);
  
  // O que cada pessoa deve pagar permanece fixo
  const personPaymentAmount = perPersonAmount;

  const getPaymentTotal = () => {
    if (paymentMode === 'by-items') return selectedTotal;
    if (paymentMode === 'by-people') return Math.min(personPaymentAmount, totalRestante);
    if (paymentMode === 'by-value') return Math.min(customAmount, totalRestante);
    return totalRestante;
  };

  const canPay = () => {
    if (!selectedPaymentMethod || totalRestante <= 0) return false;
    if (paymentMode === 'by-items' && selectedItems.size === 0) return false;
    if (paymentMode === 'by-value' && (customAmount <= 0 || customAmount > totalRestante)) return false;
    return true;
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'full': 'Conta toda',
      'by-items': 'Por itens',
      'by-people': 'Dividido',
      'by-value': 'Por valor'
    };
    return labels[type] || type;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'dinheiro': return <Banknote className="h-3 w-3" />;
      case 'cartao': return <CreditCard className="h-3 w-3" />;
      case 'pix': return <QrCode className="h-3 w-3" />;
      default: return null;
    }
  };

  const handlePayment = async (method: 'dinheiro' | 'cartao' | 'pix') => {
    if (orders.length === 0 || !canPay() || !searchedTable) return;

    setIsProcessing(true);
    try {
      const methodLabels = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };
      const paymentTotal = getPaymentTotal();

      // Record payment linked to first order (for history tracking)
      await supabase.from('payments').insert({
        table_number: searchedTable,
        order_id: orders[0].id,
        amount: paymentTotal,
        payment_method: method,
        payment_type: paymentMode,
        items_count: paymentMode === 'by-items' ? selectedItems.size : 0
      });

      if (paymentMode === 'by-items') {
        const selectedItemIds = Array.from(selectedItems);
        await supabase
          .from('order_items')
          .update({ is_paid: true, paid_at: new Date().toISOString(), payment_method: method })
          .in('id', selectedItemIds);

        toast.success(`Pagamento registrado!`, {
          description: `${methodLabels[method]} - ${formatPrice(selectedTotal)}`,
        });

        setSelectedItems(new Set());

      } else if (paymentMode === 'by-people' || paymentMode === 'by-value') {
        const totalOrdersValue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        
        for (const order of orders) {
          const proportion = Number(order.total) / totalOrdersValue;
          const orderPayment = paymentTotal * proportion;
          const newPaidAmount = Number(order.paid_amount || 0) + orderPayment;
          
          await supabase
            .from('orders')
            .update({ paid_amount: newPaidAmount })
            .eq('id', order.id);
        }

        toast.success(`Pagamento registrado!`, {
          description: `${methodLabels[method]} - ${formatPrice(paymentTotal)}`,
        });
        
        if (paymentMode === 'by-value') setCustomValue('');

      } else {
        if (unpaidItems.length > 0) {
          await supabase
            .from('order_items')
            .update({ is_paid: true, paid_at: new Date().toISOString(), payment_method: method })
            .in('id', unpaidItems.map(i => i.id));
        }

        for (const order of orders) {
          const remaining = Number(order.total) - Number(order.paid_amount || 0);
          if (remaining > 0) {
            await supabase
              .from('orders')
              .update({ paid_amount: Number(order.total) })
              .eq('id', order.id);
          }
        }
      }

      // Check if fully paid
      await queryClient.invalidateQueries({ queryKey: ['table-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['order-payments'] });
      
      const { data: updatedOrders } = await supabase
        .from('orders')
        .select(`id, total, paid_amount, order_items ( subtotal, is_paid )`)
        .eq('table_number', searchedTable)
        .in('status', ['ready', 'pending']);

      if (updatedOrders) {
        const newPaidItems = updatedOrders.flatMap(o => o.order_items).filter((i: any) => i.is_paid);
        const newPaidItemsTotal = newPaidItems.reduce((sum: number, i: any) => sum + Number(i.subtotal), 0);
        const newPartialPayments = updatedOrders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);
        const newTotalOriginal = updatedOrders.flatMap(o => o.order_items).reduce((sum: number, i: any) => sum + Number(i.subtotal), 0);
        const newRemaining = newTotalOriginal - newPaidItemsTotal - newPartialPayments;

        if (newRemaining <= 0.01) {
          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .in('id', updatedOrders.map(o => o.id));

          toast.success('Conta fechada!', { description: `Mesa ${searchedTable}` });
          setSearchedTable(null);
          setTableNumber('');
          queryClient.invalidateQueries({ queryKey: ['table-orders'] });
        }
      }

      setSelectedPaymentMethod(null);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Número da mesa"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 h-12 text-lg"
                  maxLength={2}
                />
              </div>
              <Button onClick={handleSearch} size="lg" className="h-12 px-6">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {searchedTable && !isLoading && orders.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Mesa {searchedTable} sem pedidos</p>
            </CardContent>
          </Card>
        )}

        {orders.length > 0 && (
          <>
            {/* Order Summary */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Mesa {searchedTable}</CardTitle>
                  <div className="text-right">
                    {totalPago > 0 && (
                      <p className="text-xs text-green-600">Pago: {formatPrice(totalPago)}</p>
                    )}
                    <span className="text-2xl font-bold text-primary">{formatPrice(totalRestante)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Payment History Toggle - only for current orders */}
                {payments.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between py-2 px-3 bg-green-500/10 rounded-lg text-sm hover:bg-green-500/15 transition-colors"
                  >
                    <span className="text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {payments.length} pagamento(s) registrado(s)
                    </span>
                    {showHistory ? <ChevronUp className="h-4 w-4 text-green-700" /> : <ChevronDown className="h-4 w-4 text-green-700" />}
                  </button>
                )}

                {/* Payment History List */}
                {showHistory && payments.length > 0 && (
                  <div className="space-y-1.5 py-2 px-1">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-1.5 px-2 bg-green-50 rounded text-xs border border-green-100">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatTime(payment.created_at)}</span>
                          <span className="text-green-700">{getPaymentTypeLabel(payment.payment_type)}</span>
                          {payment.items_count > 0 && (
                            <span className="text-muted-foreground">({payment.items_count} itens)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getMethodIcon(payment.payment_method)}
                          <span className="font-semibold text-green-700">{formatPrice(payment.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unpaid Items */}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {unpaidItems.map((item, index) => (
                    <div 
                      key={`${item.id}-${index}`}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all text-sm ${
                        paymentMode === 'by-items'
                          ? selectedItems.has(item.id)
                            ? 'bg-primary/15 border-2 border-primary'
                            : 'bg-muted/50 hover:bg-muted cursor-pointer border-2 border-transparent'
                          : 'bg-muted/50'
                      }`}
                      onClick={() => paymentMode === 'by-items' && toggleItemSelection(item.id)}
                    >
                      {paymentMode === 'by-items' && (
                        <Checkbox checked={selectedItems.has(item.id)} className="pointer-events-none" />
                      )}
                      <span className="flex-1 truncate">{item.quantity}x {item.product?.name}</span>
                      <span className="font-semibold text-primary">{formatPrice(item.subtotal)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {totalRestante <= 0 && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-1" />
                    <p className="font-medium text-green-600">Conta paga!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            {totalRestante > 0 && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  {/* Payment Mode */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { mode: 'full' as const, icon: CreditCard, label: 'Tudo' },
                      { mode: 'by-items' as const, icon: CheckCircle2, label: 'Itens' },
                      { mode: 'by-people' as const, icon: Users, label: 'Dividir' },
                      { mode: 'by-value' as const, icon: DollarSign, label: 'Valor' },
                    ].map(({ mode, icon: Icon, label }) => (
                      <Button
                        key={mode}
                        variant={paymentMode === mode ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { 
                          setPaymentMode(mode); 
                          setSelectedItems(new Set()); 
                          setCustomValue('');
                        }}
                        className="h-auto py-2 flex-col gap-0.5"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[10px]">{label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Mode-specific UI */}
                  {paymentMode === 'by-items' && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      {selectedItems.size === 0 
                        ? <span className="text-muted-foreground">Toque nos itens para selecionar</span>
                        : <div className="flex justify-between items-center">
                            <span>{selectedItems.size} selecionado(s)</span>
                            <span className="font-bold text-primary">{formatPrice(selectedTotal)}</span>
                          </div>
                      }
                    </div>
                  )}

                  {paymentMode === 'by-people' && (
                    <div className="bg-primary/10 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dividir entre:</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))} disabled={numberOfPeople <= 2 || paidPeopleCount > 0}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold w-6 text-center">{numberOfPeople}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumberOfPeople(numberOfPeople + 1)} disabled={paidPeopleCount > 0}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Separator className="bg-primary/20" />
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span>Valor por pessoa:</span>
                          <span className="font-bold text-primary text-lg">{formatPrice(personPaymentAmount)}</span>
                        </div>
                        {paidPeopleCount > 0 && (
                          <div className="flex justify-between items-center text-sm text-green-600">
                            <span>✓ Já pagaram:</span>
                            <span className="font-medium">{paidPeopleCount} pessoa(s)</span>
                          </div>
                        )}
                        {remainingPeople > 0 && (
                          <div className="flex justify-between items-center text-sm text-orange-600">
                            <span>Faltam:</span>
                            <span className="font-medium">{remainingPeople} pessoa(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMode === 'by-value' && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={formatInputValue(customValue)}
                          onChange={(e) => setCustomValue(e.target.value.replace(/[^\d]/g, ''))}
                          className="pl-10 h-12 text-xl font-bold text-right"
                        />
                      </div>
                      {customAmount > 0 && customAmount < totalRestante && (
                        <div className="flex justify-between text-sm pt-1">
                          <span className="text-muted-foreground">Restará:</span>
                          <span className="font-medium text-orange-600">{formatPrice(totalRestante - customAmount)}</span>
                        </div>
                      )}
                      {customAmount > totalRestante && (
                        <p className="text-xs text-destructive">Valor maior que o restante ({formatPrice(totalRestante)})</p>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Payment Method */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { method: 'dinheiro' as const, icon: Banknote, label: 'Dinheiro' },
                      { method: 'cartao' as const, icon: CreditCard, label: 'Cartão' },
                      { method: 'pix' as const, icon: QrCode, label: 'PIX' },
                    ].map(({ method, icon: Icon, label }) => (
                      <Button
                        key={method}
                        variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentMethod(method)}
                        disabled={isProcessing}
                        className="h-12 flex-col gap-0.5"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Confirm */}
                  <Button
                    className="w-full h-12 text-base"
                    onClick={() => selectedPaymentMethod && handlePayment(selectedPaymentMethod)}
                    disabled={isProcessing || !canPay()}
                  >
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar {formatPrice(getPaymentTotal())}</>
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