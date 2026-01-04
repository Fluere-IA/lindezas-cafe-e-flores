import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Banknote, QrCode } from 'lucide-react';
import { CartItem, POSMode } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CartSidebarProps {
  items: CartItem[];
  total: number;
  mode: POSMode;
  tableNumber: number | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartSidebar({
  items,
  total,
  mode,
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartSidebarProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  return (
    <aside className="w-96 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">
              {mode === 'mesa' ? `Mesa ${tableNumber || '--'}` : 'Balcão'}
            </h2>
          </div>
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {items.length} {items.length === 1 ? 'item' : 'itens'} no pedido
        </p>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum item no pedido</p>
            <p className="text-xs">Clique nos produtos para adicionar</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.product.id}
              className="cart-item animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.product.price)} cada
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="w-7 h-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors ml-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              
              <div className="w-20 text-right">
                <p className="text-sm font-semibold text-gold">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Checkout */}
      <div className="border-t border-border p-4 space-y-4 bg-secondary/20">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-display text-2xl font-bold text-foreground">
            {formatPrice(total)}
          </span>
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            disabled={items.length === 0}
          >
            <Banknote className="h-4 w-4" />
            <span className="text-[10px]">Dinheiro</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            disabled={items.length === 0}
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-[10px]">Cartão</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            disabled={items.length === 0}
          >
            <QrCode className="h-4 w-4" />
            <span className="text-[10px]">Pix</span>
          </Button>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={onCheckout}
          disabled={items.length === 0}
          className={cn(
            'w-full h-12 text-base font-semibold',
            'bg-primary hover:bg-primary/90',
            items.length === 0 && 'opacity-50'
          )}
        >
          Finalizar Pedido
        </Button>
      </div>
    </aside>
  );
}
