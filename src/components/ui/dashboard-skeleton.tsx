import { Skeleton } from '@/components/ui/skeleton';

// Skeleton do Header reutilizável
function HeaderSkeleton() {
  return (
    <header className="bg-white border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </header>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-300">
      <HeaderSkeleton />

      <main className="flex-1 p-4 md:p-5 space-y-4">
        {/* Status Cards */}
        <div className="bg-white rounded-xl border border-border/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted/30 rounded-xl p-3 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="h-48 flex items-end gap-2 px-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton 
                  className="w-full rounded-t-md" 
                  style={{ height: `${Math.random() * 60 + 40}%` }} 
                />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Skeleton */}
        <div className="bg-white rounded-xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function CaixaSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-300">
      <HeaderSkeleton />

      <main className="flex-1 p-4 md:p-5 space-y-4">
        {/* Search bar */}
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>

        {/* Order card */}
        <div className="bg-white rounded-xl border border-border/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Payment buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

export function ConfiguracoesSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-300">
      <HeaderSkeleton />

      <main className="flex-1 p-4 md:p-5 space-y-6">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Section 1 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16 ml-1" />
          <div className="bg-white rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 ml-1" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Section 3 - Pro */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 ml-1" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/50 p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8 rounded" />
                  </div>
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function CozinhaSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-300">
      <HeaderSkeleton />

      <main className="flex-1 p-4 md:p-5 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Order cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              
              <Skeleton className="h-1.5 w-full rounded-full" />
              
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function PedidosSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-in fade-in duration-300">
      <HeaderSkeleton />

      <main className="flex-1 p-4 md:p-5 space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border/50 p-3 space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </main>

      {/* Cart button */}
      <div className="fixed bottom-4 right-4">
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-300">
      <HeaderSkeleton />

      <main className="flex-1 p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
