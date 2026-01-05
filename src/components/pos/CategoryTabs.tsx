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
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={cn(
              'category-tab flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm',
              activeFilter === tab.id && 'active'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
