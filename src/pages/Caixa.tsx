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
  X,
  DollarSign
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

type PaymentMode = 'full' | 'by-items' | 'by-people' | 'by-value';

const Caixa = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [searchedTable, setSearchedTable] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [paidPeople, setPaidPeople] = useState(0);
  const [customValue, setCustomValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix' | null>(null);
  const queryClient = useQueryClient();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

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
    setPaidPeople(0);
    setCustomValue('');
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
  const remainingAfterPaid = paymentMode === 'by-people' ? totalGeral - (perPersonAmount * paidPeople) : totalGeral;
  const customAmount = parseInputValue(customValue);
  const remainingAfterCustom = totalGeral - customAmount;

  const getPaymentTotal = () => {
    if (paymentMode === 'by-items') return selectedTotal;
    if (paymentMode === 'by-people') return perPersonAmount;
    if (paymentMode === 'by-value') return Math.min(customAmount, totalGeral);
    return totalGeral;
  };

  const canPay = () => {
    if (!selectedPaymentMethod) return false;
    if (paymentMode === 'by-items' && selectedItems.size === 0) return false;
    if (paymentMode === 'by-value' && (customAmount <= 0 || customAmount > totalGeral)) return false;
    if (paymentMode === 'by-people' && paidPeople >= numberOfPeople) return false;
    return true;
  };

  const handlePayment = async (method: 'dinheiro' | 'cartao' | 'pix') => {
    if (orders.length === 0 || !canPay()) return;

    setIsProcessing(true);
    try {
      const methodLabels = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };
      const paymentTotal = getPaymentTotal();

      if (paymentMode === 'by-items') {
        const selectedItemIds = Array.from(selectedItems);
        
        await supabase
          .from('order_items')
          .update({ is_paid: true, paid_at: new Date().toISOString(), payment_method: method })
          .in('id', selectedItemIds);

        toast.success(`Pagamento registrado!`, {
          description: `${methodLabels[method]} - ${formatPrice(selectedTotal)}`,
        });

        const remainingUnpaid = unpaidItems.filter(item => !selectedItems.has(item.id));
        if (remainingUnpaid.length === 0) {
          await supabase.from('orders').update({ status: 'paid' }).in('id', orders.map(o => o.id));
          setSearchedTable(null);
          setTableNumber('');
        }
        
        resetPaymentState();
        queryClient.invalidateQueries({ queryKey: ['table-orders'] });

      } else if (paymentMode === 'by-people') {
        const newPaidPeople = paidPeople + 1;
        setPaidPeople(newPaidPeople);
        
        toast.success(`Pagamento ${newPaidPeople}/${numberOfPeople} registrado!`, {
          description: `${methodLabels[method]} - ${formatPrice(perPersonAmount)}`,
        });

        if (newPaidPeople >= numberOfPeople) {
          // All people paid, close the bill
          await supabase.from('order_items').update({ is_paid: true, paid_at: new Date().toISOString(), payment_method: method }).in('id', unpaidItems.map(i => i.id));
          await supabase.from('orders').update({ status: 'paid' }).in('id', orders.map(o => o.id));
          
          toast.success('Conta fechada!', { description: `Mesa ${searchedTable} - Total: ${formatPrice(totalGeral)}` });
          setSearchedTable(null);
          setTableNumber('');
          queryClient.invalidateQueries({ queryKey: ['table-orders'] });
        }
        setSelectedPaymentMethod(null);

      } else if (paymentMode === 'by-value') {
        toast.success(`Pagamento parcial registrado!`, {
          description: `${methodLabels[method]} - ${formatPrice(customAmount)}`,
        });

        if (customAmount >= totalGeral) {
          await supabase.from('order_items').update({ is_paid: true, paid_at: new Date().toISOString(), payment_method: method }).in('id', unpaidItems.map(i => i.id));
          await supabase.from('orders').update({ status: 'paid' }).in('id', orders.map(o => o.id));
          setSearchedTable(null);
          setTableNumber('');
          queryClient.invalidateQueries({ queryKey: ['table-orders'] });
        }
        
        setCustomValue('');
        setSelectedPaymentMethod(null);

      } else {
        // Full payment
        if (unpaidItems.length > 0) {
          await supabase.from('order_items').update({ is_paid: true, paid_at: new Date().toISOString(), payment_method: method }).in('id', unpaidItems.map(i => i.id));
        }
        await supabase.from('orders').update({ status: 'paid' }).in('id', orders.map(o => o.id));

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
                  onKeyDown={handleKeyPress}
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
                  <span className="text-2xl font-bold text-primary">{formatPrice(totalGeral)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {paidItems.length > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 bg-green-500/10 rounded-lg text-sm">
                    <span className="text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {paidItems.length} pago(s)
                    </span>
                    <span className="font-medium text-green-700">{formatPrice(totalPago)}</span>
                  </div>
                )}

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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            {unpaidItems.length > 0 && (
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
                          setPaidPeople(0);
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
                    <div className="bg-primary/10 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pessoas:</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))} disabled={numberOfPeople <= 2}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold w-6 text-center">{numberOfPeople}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumberOfPeople(numberOfPeople + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span>Cada um paga:</span>
                        <span className="font-bold text-primary text-lg">{formatPrice(perPersonAmount)}</span>
                      </div>
                      {paidPeople > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">{paidPeople} já pagou</span>
                            <span className="font-medium">Falta: {formatPrice(remainingAfterPaid)}</span>
                          </div>
                        </>
                      )}
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
                      {customAmount > 0 && customAmount < totalGeral && (
                        <div className="flex justify-between text-sm pt-1">
                          <span className="text-muted-foreground">Restará:</span>
                          <span className="font-medium text-orange-600">{formatPrice(remainingAfterCustom)}</span>
                        </div>
                      )}
                      {customAmount > totalGeral && (
                        <p className="text-xs text-destructive">Valor maior que o total</p>
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