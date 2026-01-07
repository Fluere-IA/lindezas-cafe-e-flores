import { Coffee, Flower2, Sandwich, Cake, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useProducts';

export type CategoryFilter = string;

interface CategoryTabsProps {
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
}

// Icon mapping for common category names
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bebidas: Coffee,
  salgados: Sandwich,
  sobremesas: Cake,
  doces: Cake,
  flores: Flower2,
  lanches: Sandwich,
  pratos: Sandwich,
  cafés: Coffee,
  cafe: Coffee,
  sucos: Coffee,
};

function getCategoryIcon(name: string) {
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return iconMap[normalized] || Tag;
}

export function CategoryTabs({ activeFilter, onFilterChange }: CategoryTabsProps) {
  const { data: categories = [], isLoading } = useCategories();

  // Show loading placeholders
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <div className="h-10 w-24 bg-muted animate-pulse rounded-full" />
        <div className="h-10 w-20 bg-muted animate-pulse rounded-full" />
        <div className="h-10 w-28 bg-muted animate-pulse rounded-full" />
      </div>
    );
  }

  // If no categories, show "Todos" tab only
  if (categories.length === 0) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <button
          className="flex items-center gap-1.5 whitespace-nowrap px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 border-2 bg-primary text-primary-foreground border-primary shadow-md"
        >
          <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
          <span>Todos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.name);
        const isActive = activeFilter === category.name.toLowerCase();
        return (
          <button
            key={category.id}
            onClick={() => onFilterChange(category.name.toLowerCase())}
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
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
