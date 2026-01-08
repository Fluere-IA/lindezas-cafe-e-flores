import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useProducts';

export type CategoryFilter = string;

interface CategoryTabsProps {
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
}

export function CategoryTabs({ activeFilter, onFilterChange }: CategoryTabsProps) {
  const { data: categories = [], isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <div className="h-9 w-20 bg-muted animate-pulse rounded-full" />
        <div className="h-9 w-16 bg-muted animate-pulse rounded-full" />
        <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <button className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground">
          Todos
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {categories.map((category) => {
        const isActive = activeFilter === category.name.toLowerCase();
        return (
          <button
            key={category.id}
            onClick={() => onFilterChange(category.name.toLowerCase())}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-white text-foreground border border-border/50 hover:border-primary/40"
            )}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
