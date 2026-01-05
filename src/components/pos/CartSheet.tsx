import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Send, Hash, MessageSquare } from 'lucide-react';
import { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  notes: string;
  onTableNumberChange: (table: string) => void;
  onNotesChange: (notes: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartSheet({
  items,
  total,
  tableNumber,
  notes,
  onTableNumberChange,
  onNotesChange,
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
          className="fixed bottom-4 right-4 left-4 h-14 text-base font-semibold shadow-elevated z-50 gap-3 bg-gradient-to-r from-primary to-forest-light hover:from-forest-light hover:to-primary transition-all duration-300"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="font-display text-lg">Pedido</span>
          {itemCount > 0 && (
            <>
              <span className="mx-2 opacity-50">•</span>
              <span className="font-semibold">{formatPrice(total)}</span>
              <span className="ml-auto bg-gold text-forest px-2.5 py-0.5 rounded-full text-sm font-bold">
                {itemCount}
              </span>
            </>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-0 flex flex-col border-t-4 border-gold/50">
        <SheetHeader className="px-5 pb-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-3 font-display text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            Pedido
          </SheetTitle>
          <p className="text-sm text-muted-foreground text-left pl-[52px]">
            {items.length} {items.length === 1 ? 'item selecionado' : 'itens selecionados'}
          </p>
        </SheetHeader>

        {/* Table Number and Notes */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-gold/5 to-gold/10 shrink-0 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gold" />
              <p className="text-sm font-medium">Mesa</p>
            </div>
            <div className="w-20 relative">
              <Input
                placeholder="Nº"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="h-11 text-center font-bold text-lg border-2 border-gold/30 focus:border-gold bg-background"
                maxLength={2}
                inputMode="numeric"
              />
            </div>
          </div>
          
          {/* Order Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gold" />
              <p className="text-sm font-medium">Observações</p>
            </div>
            <Textarea
              placeholder="Ex: Sem cebola, ponto da carne, alergias..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value.slice(0, 500))}
              className="min-h-[60px] text-sm border-2 border-gold/30 focus:border-gold bg-background resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 opacity-30" />
              </div>
              <p className="text-base font-display text-lg">Pedido vazio</p>
              <p className="text-sm mt-1">Toque nos produtos para adicionar</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.product.id}
                className="p-4 bg-card rounded-2xl border border-border/50 shadow-soft animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Product name - full width */}
                <p className="font-medium text-sm leading-tight mb-2">{item.product.name}</p>
                
                {/* Controls row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground mr-2">
                      {formatPrice(item.product.price)}
                    </p>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors border border-border/50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors border border-primary/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="font-display text-base font-bold text-gold">
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
              </div>
            ))
          )}
        </div>

        <div className="border-t-2 border-gold/20 p-5 space-y-4 bg-gradient-to-t from-gold/5 to-transparent shrink-0">
          {items.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={onClearCart}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-4 py-2 rounded-full hover:bg-destructive/10 border border-border"
              >
                Limpar tudo
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-base">Total do pedido</span>
            <span className="font-display text-3xl font-bold text-primary">
              {formatPrice(total)}
            </span>
          </div>

          <Button
            onClick={onCheckout}
            disabled={items.length === 0 || !hasTableNumber}
            size="lg"
            className={cn(
              'w-full h-14 text-lg font-semibold gap-3 bg-gradient-to-r from-primary to-forest-light hover:from-forest-light hover:to-primary shadow-elevated transition-all duration-300',
              (items.length === 0 || !hasTableNumber) && 'opacity-50'
            )}
          >
            <Send className="h-5 w-5" />
            <span className="font-display">Enviar para Cozinha</span>
          </Button>
          {!hasTableNumber && items.length > 0 && (
            <p className="text-xs text-gold text-center font-medium">
              ⚠️ Informe o número da mesa para continuar
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
