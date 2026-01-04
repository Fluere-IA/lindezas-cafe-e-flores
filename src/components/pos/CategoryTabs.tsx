import { Coffee, Flower2, LayoutGrid } from 'lucide-react';
import { CategoryFilter } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
}

const tabs = [
  { id: 'all' as const, label: 'Todos', icon: LayoutGrid },
  { id: 'cafeteria' as const, label: 'Cafeteria', icon: Coffee },
  { id: 'flores' as const, label: 'Flores', icon: Flower2 },
];

export function CategoryTabs({ activeFilter, onFilterChange }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
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
