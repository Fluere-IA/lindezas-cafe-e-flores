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
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border-2',
              isActive 
                ? 'bg-lindezas-forest text-white border-lindezas-forest shadow-lg scale-105' 
                : 'bg-white text-lindezas-espresso border-lindezas-gold/40 hover:border-lindezas-gold hover:bg-lindezas-cream hover:shadow-md'
            )}
          >
            <Icon className={cn(
              'h-4 w-4 transition-transform duration-300',
              isActive ? 'text-white' : 'text-lindezas-forest'
            )} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
