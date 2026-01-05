import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Send, Hash } from 'lucide-react';
import { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface CartSheetProps {
  items: CartItem[];
  total: number;
  tableNumber: string;
  onTableNumberChange: (table: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartSheet({
  items,
  total,
  tableNumber,
  onTableNumberChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartSheetProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasTableNumber = tableNumber.trim().length > 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-4 right-4 left-4 h-14 text-base font-semibold shadow-lg z-50 gap-3"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Ver Pedido</span>
          {itemCount > 0 && (
            <>
              <span className="mx-2">•</span>
              <span>{formatPrice(total)}</span>
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {itemCount}
              </span>
            </>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl px-0 flex flex-col">
        <SheetHeader className="px-4 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Seu Pedido
            </SheetTitle>
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Limpar tudo
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-left">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </p>
        </SheetHeader>

        {/* Table Number */}
        <div className="px-4 py-3 border-b border-border bg-secondary/20 shrink-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">Mesa</p>
            <div className="w-20 relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nº"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="pl-9 h-10 text-center font-semibold"
                maxLength={2}
                inputMode="numeric"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingBag className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-base font-medium">Seu pedido está vazio</p>
              <p className="text-sm">Toque nos produtos para adicionar</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.product.price)} cada
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gold min-w-[70px] text-right">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-4 space-y-4 bg-background shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-lg">Total</span>
            <span className="font-display text-2xl font-bold">
              {formatPrice(total)}
            </span>
          </div>

          <Button
            onClick={onCheckout}
            disabled={items.length === 0 || !hasTableNumber}
            size="lg"
            className={cn(
              'w-full h-14 text-lg font-semibold gap-2',
              (items.length === 0 || !hasTableNumber) && 'opacity-50'
            )}
          >
            <Send className="h-5 w-5" />
            Enviar para Cozinha
          </Button>
          {!hasTableNumber && items.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Informe o número da mesa
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
