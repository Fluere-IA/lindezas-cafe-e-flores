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

interface ClosedBillSummary {
  tableNumber: number;
  totalAmount: number;
  payments: Payment[];
  items: ItemWithOrder[];
  closedAt: Date;
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
  const [closedBillSummary, setClosedBillSummary] = useState<ClosedBillSummary | null>(null);
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
          // Fetch final payments for summary before updating status
          const { data: finalPayments } = await supabase
            .from('payments')
            .select('*')
            .in('order_id', updatedOrders.map(o => o.id))
            .order('created_at', { ascending: true });

          // Save summary before clearing
          setClosedBillSummary({
            tableNumber: searchedTable,
            totalAmount: newTotalOriginal,
            payments: (finalPayments as Payment[]) || [],
            items: allItems,
            closedAt: new Date()
          });

          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .in('id', updatedOrders.map(o => o.id));

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
    <div className="min-h-screen bg-lindezas-cream">
      <DashboardHeader />

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="mb-2">
          <h1 className="text-3xl font-display font-bold text-lindezas-forest flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lindezas-cream border-2 border-lindezas-gold/40 shadow-md">
              <CreditCard className="h-6 w-6" style={{ color: '#2D5A27' }} />
            </div>
            Caixa
          </h1>
          <p className="text-muted-foreground mt-1">Gerenciar pagamentos por mesa</p>
        </div>

        {/* Search */}
        <Card className="border border-lindezas-gold/30 bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-lindezas-gold" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Número da mesa"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-14 text-xl font-semibold border-2 border-lindezas-gold/30 focus:border-lindezas-gold bg-lindezas-cream/50 rounded-xl text-lindezas-espresso placeholder:text-lindezas-espresso/40"
                  maxLength={2}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="h-14 px-8 bg-gradient-to-r from-lindezas-forest to-lindezas-forest/90 hover:from-lindezas-forest/90 hover:to-lindezas-forest text-white shadow-lg rounded-xl"
              >
                <Search className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Closed Bill Summary */}
        {closedBillSummary && (
          <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-green-100/50 shadow-xl overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-500/20 to-green-400/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-display font-bold text-green-800">Conta Fechada!</CardTitle>
                </div>
                <Badge className="bg-lindezas-forest text-white border-0 px-3 py-1 text-sm">
                  Mesa {closedBillSummary.tableNumber}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Items consumed */}
              <div>
                <h4 className="text-sm font-semibold text-lindezas-forest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-lindezas-gold"></span>
                  Itens consumidos
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {closedBillSummary.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex justify-between text-sm py-2 px-3 bg-white rounded-lg border border-green-200">
                      <span className="text-lindezas-espresso font-medium">{item.quantity}x {item.product?.name}</span>
                      <span className="font-bold text-lindezas-forest">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-green-300" />

              {/* Payments summary */}
              <div>
                <h4 className="text-sm font-semibold text-lindezas-forest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Pagamentos realizados
                </h4>
                <div className="space-y-1.5">
                  {closedBillSummary.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-green-200 text-sm">
                      <div className="flex items-center gap-2 text-lindezas-espresso">
                        {getMethodIcon(payment.payment_method)}
                        <span className="capitalize font-medium">{payment.payment_method}</span>
                        <span className="text-muted-foreground text-xs">
                          ({getPaymentTypeLabel(payment.payment_type)})
                        </span>
                      </div>
                      <span className="font-bold text-green-700">{formatPrice(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-green-300" />

              {/* Total */}
              <div className="flex justify-between items-center bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-4">
                <span className="font-semibold text-lindezas-forest">Total pago:</span>
                <span className="text-3xl font-display font-bold text-green-700">
                  {formatPrice(closedBillSummary.totalAmount)}
                </span>
              </div>

              <Button 
                className="w-full h-12 bg-lindezas-forest hover:bg-lindezas-forest/90 text-white font-semibold rounded-xl shadow-lg" 
                onClick={() => setClosedBillSummary(null)}
              >
                Nova consulta
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-lindezas-gold" />
            <p className="text-muted-foreground mt-3 font-medium">Buscando pedidos...</p>
          </div>
        )}

        {searchedTable && !isLoading && orders.length === 0 && (
          <Card className="border-2 border-dashed border-lindezas-gold/40 bg-white/80">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-lindezas-cream flex items-center justify-center mb-3">
                <AlertCircle className="h-8 w-8 text-lindezas-gold" />
              </div>
              <p className="font-display font-bold text-xl text-lindezas-forest">Mesa {searchedTable} sem pedidos</p>
              <p className="text-muted-foreground mt-1">Nenhum pedido em aberto para esta mesa</p>
            </CardContent>
          </Card>
        )}

        {orders.length > 0 && (
          <>
            {/* Order Summary */}
            <Card className="border border-lindezas-gold/30 bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-lindezas-gold/20 to-lindezas-cream">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      className="border-0 px-3 py-1.5 text-base font-bold"
                      style={{ backgroundColor: '#2D5A27', color: '#ffffff' }}
                    >
                      Mesa {searchedTable}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {totalPago > 0 && (
                      <p className="text-xs text-green-600 font-semibold">Pago: {formatPrice(totalPago)}</p>
                    )}
                    <span className="text-3xl font-display font-bold text-lindezas-gold">{formatPrice(totalRestante)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {/* Payment History Toggle - only for current orders */}
                {payments.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between py-3 px-4 bg-gradient-to-r from-green-500/15 to-green-400/10 rounded-xl text-sm hover:from-green-500/20 hover:to-green-400/15 transition-all border border-green-300/50"
                  >
                    <span className="text-green-700 flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      {payments.length} pagamento(s) registrado(s)
                    </span>
                    {showHistory ? <ChevronUp className="h-4 w-4 text-green-700" /> : <ChevronDown className="h-4 w-4 text-green-700" />}
                  </button>
                )}

                {/* Payment History List */}
                {showHistory && payments.length > 0 && (
                  <div className="space-y-2 py-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg text-sm border border-green-200">
                        <div className="flex items-center gap-2 text-lindezas-espresso">
                          <Clock className="h-3.5 w-3.5 text-green-600" />
                          <span className="font-medium">{formatTime(payment.created_at)}</span>
                          <span className="text-green-700 font-semibold">{getPaymentTypeLabel(payment.payment_type)}</span>
                          {payment.items_count > 0 && (
                            <span className="text-muted-foreground">({payment.items_count} itens)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.payment_method)}
                          <span className="font-bold text-green-700">{formatPrice(payment.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unpaid Items */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {unpaidItems.map((item, index) => (
                    <div 
                      key={`${item.id}-${index}`}
                      className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all text-sm ${
                        paymentMode === 'by-items'
                          ? selectedItems.has(item.id)
                            ? 'bg-lindezas-gold/20 border-2 border-lindezas-gold shadow-md'
                            : 'bg-lindezas-cream hover:bg-lindezas-gold/10 cursor-pointer border-2 border-transparent'
                          : 'bg-lindezas-cream/70'
                      }`}
                      onClick={() => paymentMode === 'by-items' && toggleItemSelection(item.id)}
                    >
                      {paymentMode === 'by-items' && (
                        <Checkbox 
                          checked={selectedItems.has(item.id)} 
                          className="pointer-events-none"
                          style={{
                            border: '2px solid #2D5A27',
                            backgroundColor: selectedItems.has(item.id) ? '#2D5A27' : '#ffffff'
                          }}
                        />
                      )}
                      <span className="flex-1 truncate font-medium text-lindezas-espresso">{item.quantity}x {item.product?.name}</span>
                      <span className="font-bold text-lindezas-forest">{formatPrice(item.subtotal)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {totalRestante <= 0 && (
                  <div className="text-center py-6 bg-gradient-to-r from-green-100 to-green-50 rounded-xl">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-2 shadow-lg">
                      <CheckCircle2 className="h-7 w-7 text-white" />
                    </div>
                    <p className="font-display font-bold text-xl text-green-700">Conta paga!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            {totalRestante > 0 && (
              <Card className="border border-lindezas-gold/30 bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardContent className="pt-5 space-y-4">
                  {/* Payment Mode */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { mode: 'full' as const, icon: CreditCard, label: 'Tudo' },
                      { mode: 'by-items' as const, icon: CheckCircle2, label: 'Itens' },
                      { mode: 'by-people' as const, icon: Users, label: 'Dividir' },
                      { mode: 'by-value' as const, icon: DollarSign, label: 'Valor' },
                    ].map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => { 
                          setPaymentMode(mode); 
                          setSelectedItems(new Set()); 
                          setCustomValue('');
                        }}
                        className="h-auto py-3 flex flex-col items-center justify-center gap-1 rounded-xl font-semibold transition-all"
                        style={{
                          backgroundColor: paymentMode === mode ? '#2D5A27' : '#F5F0E8',
                          color: paymentMode === mode ? '#ffffff' : '#4A3728',
                          border: paymentMode === mode ? 'none' : '2px solid rgba(212, 168, 75, 0.4)',
                          boxShadow: paymentMode === mode ? '0 4px 12px rgba(45, 90, 39, 0.3)' : 'none'
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mode-specific UI */}
                  {paymentMode === 'by-items' && (
                    <div className="bg-lindezas-cream rounded-xl p-4 text-sm border border-lindezas-gold/30">
                      {selectedItems.size === 0 
                        ? <span className="text-muted-foreground font-medium">Toque nos itens acima para selecionar</span>
                        : <div className="flex justify-between items-center">
                            <span className="font-semibold text-lindezas-espresso">{selectedItems.size} selecionado(s)</span>
                            <span className="font-bold text-lg text-lindezas-gold">{formatPrice(selectedTotal)}</span>
                          </div>
                      }
                    </div>
                  )}

                  {paymentMode === 'by-people' && (
                    <div className="bg-gradient-to-r from-lindezas-gold/20 to-lindezas-cream rounded-xl p-4 space-y-3 border border-lindezas-gold/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-lindezas-espresso">Dividir entre:</span>
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg border-2 border-lindezas-gold/50 hover:bg-lindezas-gold/20" 
                            onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))} 
                            disabled={numberOfPeople <= 2 || paidPeopleCount > 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-xl w-8 text-center text-lindezas-forest">{numberOfPeople}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg border-2 border-lindezas-gold/50 hover:bg-lindezas-gold/20" 
                            onClick={() => setNumberOfPeople(numberOfPeople + 1)} 
                            disabled={paidPeopleCount > 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Separator className="bg-lindezas-gold/30" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-lindezas-espresso">Valor por pessoa:</span>
                          <span className="font-bold text-xl text-lindezas-gold">{formatPrice(personPaymentAmount)}</span>
                        </div>
                        {paidPeopleCount > 0 && (
                          <div className="flex justify-between items-center text-sm bg-green-100 rounded-lg px-3 py-2">
                            <span className="text-green-700 font-medium">✓ Já pagaram:</span>
                            <span className="font-bold text-green-700">{paidPeopleCount} pessoa(s)</span>
                          </div>
                        )}
                        {remainingPeople > 0 && (
                          <div className="flex justify-between items-center text-sm bg-orange-100 rounded-lg px-3 py-2">
                            <span className="text-orange-700 font-medium">Faltam:</span>
                            <span className="font-bold text-orange-700">{remainingPeople} pessoa(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMode === 'by-value' && (
                    <div className="bg-lindezas-cream rounded-xl p-4 space-y-3 border border-lindezas-gold/30">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lindezas-forest font-bold text-lg">R$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={formatInputValue(customValue)}
                          onChange={(e) => setCustomValue(e.target.value.replace(/[^\d]/g, ''))}
                          className="pl-12 h-14 text-2xl font-bold text-right border-2 border-lindezas-gold/40 focus:border-lindezas-gold rounded-xl bg-white text-lindezas-forest"
                        />
                      </div>
                      {customAmount > 0 && customAmount < totalRestante && (
                        <div className="flex justify-between text-sm pt-1 bg-orange-100 rounded-lg px-3 py-2">
                          <span className="text-orange-700 font-medium">Restará:</span>
                          <span className="font-bold text-orange-700">{formatPrice(totalRestante - customAmount)}</span>
                        </div>
                      )}
                      {customAmount > totalRestante && (
                        <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">Valor maior que o restante ({formatPrice(totalRestante)})</p>
                      )}
                    </div>
                  )}

                  <Separator className="bg-lindezas-gold/30" />

                  {/* Payment Method */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { method: 'dinheiro' as const, icon: Banknote, label: 'Dinheiro' },
                      { method: 'cartao' as const, icon: CreditCard, label: 'Cartão' },
                      { method: 'pix' as const, icon: QrCode, label: 'PIX' },
                    ].map(({ method, icon: Icon, label }) => (
                      <button
                        key={method}
                        onClick={() => setSelectedPaymentMethod(method)}
                        disabled={isProcessing}
                        className="h-14 flex flex-col items-center justify-center gap-1 rounded-xl font-semibold transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: selectedPaymentMethod === method ? '#D4A84B' : '#F5F0E8',
                          color: selectedPaymentMethod === method ? '#2D5A27' : '#4A3728',
                          border: selectedPaymentMethod === method ? 'none' : '2px solid rgba(212, 168, 75, 0.4)',
                          boxShadow: selectedPaymentMethod === method ? '0 4px 12px rgba(212, 168, 75, 0.4)' : 'none'
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Confirm */}
                  <Button
                    className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => selectedPaymentMethod && handlePayment(selectedPaymentMethod)}
                    disabled={isProcessing || !canPay()}
                  >
                    {isProcessing ? (
                      <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processando...</>
                    ) : (
                      <><CheckCircle2 className="h-5 w-5 mr-2" /> Confirmar {formatPrice(getPaymentTotal())}</>
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