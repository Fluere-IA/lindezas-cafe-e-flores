import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Send, ChevronDown, ChevronUp, FileText } from 'lucide-react';
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
  const [showNotes, setShowNotes] = useState(false);
  
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasTableNumber = tableNumber.trim().length > 0;

  // Haptic feedback helper
  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-4 right-4 left-4 h-14 text-base font-semibold shadow-elevated z-50 gap-3 text-white transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #2D5A27 0%, #3d7a35 100%)' }}
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
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0 flex flex-col border-t-4 border-gold/50">
        {/* Compact Header */}
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2.5 font-display text-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              Pedido
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
              </span>
            </SheetTitle>
            
            {/* Table Number - Inline */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">Mesa</span>
              <Input
                placeholder="Nº"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="w-12 h-8 text-center font-bold text-sm border-2 border-gold/30 focus:border-gold bg-background rounded-lg placeholder:text-xs placeholder:font-normal"
                maxLength={2}
                inputMode="numeric"
              />
            </div>
          </div>
        </SheetHeader>

        {/* Collapsible Notes Section */}
        <div className="px-4 py-2 border-b border-border bg-secondary/30 shrink-0">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="w-full flex items-center justify-between text-sm py-1"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 text-gold" />
              Observações
              {notes && <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-medium">Preenchido</span>}
            </span>
            {showNotes ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          
          {showNotes && (
            <div className="pt-2 pb-1 animate-fade-in">
              <Textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value.slice(0, 200))}
                className="min-h-[50px] text-sm border border-border bg-background resize-none"
                maxLength={200}
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {notes.length}/200
              </p>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <ShoppingBag className="h-8 w-8 opacity-30" />
              </div>
              <p className="font-display text-base">Pedido vazio</p>
              <p className="text-xs mt-1">Toque nos produtos para adicionar</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-card rounded-xl border border-border/50 shadow-soft space-y-2"
              >
                {/* Product Name + Total Price */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm leading-snug flex-1">{item.product.name}</p>
                  <span className="font-bold text-sm text-gold whitespace-nowrap">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
                
                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  {/* Quantity Controls - Compact */}
                  <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
                    <button
                      onClick={() => {
                        vibrate();
                        onUpdateQuantity(item.product.id, item.quantity - 1);
                      }}
                      className="w-7 h-7 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center transition-colors active:scale-95 shadow-sm"
                    >
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => {
                        vibrate();
                        onUpdateQuantity(item.product.id, item.quantity + 1);
                      }}
                      className="w-7 h-7 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Unit Price + Delete */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(item.product.price)} cada
                    </span>
                    <button
                      onClick={() => {
                        vibrate();
                        onRemoveItem(item.product.id);
                      }}
                      className="w-6 h-6 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors active:scale-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Compact */}
        <div className="border-t-2 border-gold/20 px-4 py-3 bg-gradient-to-t from-gold/5 to-transparent shrink-0 space-y-3">
          {/* Total & Clear */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Total</span>
              {items.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-full hover:bg-destructive/10 border border-border"
                >
                  Limpar
                </button>
              )}
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {formatPrice(total)}
            </span>
          </div>

          {/* Submit Button */}
          <Button
            onClick={onCheckout}
            disabled={items.length === 0 || !hasTableNumber}
            size="lg"
            className={cn(
              'w-full h-12 text-base font-semibold gap-2 text-white shadow-elevated transition-all duration-300 active:scale-[0.98]',
              (items.length === 0 || !hasTableNumber) && 'opacity-50'
            )}
            style={{ background: 'linear-gradient(135deg, #2D5A27 0%, #3d7a35 100%)' }}
          >
            <Send className="h-4 w-4" />
            <span className="font-display">Enviar para Cozinha</span>
          </Button>
          
          {!hasTableNumber && items.length > 0 && (
            <p className="text-[11px] text-gold text-center font-medium">
              ⚠️ Informe o número da mesa
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
