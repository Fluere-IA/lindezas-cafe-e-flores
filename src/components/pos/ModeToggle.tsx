import { Store, Users } from 'lucide-react';
import { POSMode } from '@/types';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
  mode: POSMode;
  onModeChange: (mode: POSMode) => void;
  tableNumber: number | null;
  onTableChange: (table: number | null) => void;
}

export function ModeToggle({ mode, onModeChange, tableNumber, onTableChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="mode-toggle flex">
        <button
          onClick={() => {
            onModeChange('balcao');
            onTableChange(null);
          }}
          className={cn('mode-toggle-button flex items-center gap-2', mode === 'balcao' && 'active')}
        >
          <Store className="h-4 w-4" />
          <span>Balcão</span>
        </button>
        <button
          onClick={() => onModeChange('mesa')}
          className={cn('mode-toggle-button flex items-center gap-2', mode === 'mesa' && 'active')}
        >
          <Users className="h-4 w-4" />
          <span>Mesa</span>
        </button>
      </div>
      
      {mode === 'mesa' && (
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="text-sm text-muted-foreground">Mesa Nº</span>
          <input
            type="number"
            min="1"
            max="99"
            value={tableNumber || ''}
            onChange={(e) => onTableChange(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="--"
            className="w-16 h-9 text-center rounded-lg border border-border bg-card text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}
    </div>
  );
}
