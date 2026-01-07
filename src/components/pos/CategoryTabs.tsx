import { Coffee, Flower2, Sandwich, Cake } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CategoryFilter = 'bebidas' | 'salgados' | 'sobremesas' | 'flores';

interface CategoryTabsProps {
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
}

const tabs = [
  { id: 'bebidas' as const, label: 'Bebidas', icon: Coffee },
  { id: 'salgados' as const, label: 'Salgados', icon: Sandwich },
  { id: 'sobremesas' as const, label: 'Sobremesas', icon: Cake },
  { id: 'flores' as const, label: 'Flores', icon: Flower2 },
];

export function CategoryTabs({ activeFilter, onFilterChange }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border-2 active:scale-95",
              isActive 
                ? "bg-primary text-primary-foreground border-primary shadow-md" 
                : "bg-white text-foreground border-border/40 hover:border-primary/50 hover:shadow-sm"
            )}
          >
            <Icon 
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                isActive ? "text-primary-foreground" : "text-primary"
              )}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
