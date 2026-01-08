import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Loader2 } from 'lucide-react';

interface HeatmapData {
  hour: number;
  day: string;
  count: number;
}

interface HeatmapChartProps {
  data: HeatmapData[] | null | undefined;
  isLoading: boolean;
  periodLabel: string;
}

const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8h to 21h

export function HeatmapChart({ data, isLoading, periodLabel }: HeatmapChartProps) {
  const getIntensity = (count: number, maxCount: number): string => {
    if (count === 0 || maxCount === 0) return 'bg-muted';
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'bg-red-500';
    if (ratio > 0.6) return 'bg-orange-500';
    if (ratio > 0.4) return 'bg-amber-400';
    if (ratio > 0.2) return 'bg-yellow-300';
    return 'bg-green-200';
  };

  const maxCount = data ? Math.max(...data.map(d => d.count), 1) : 1;

  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  data?.forEach(d => {
    dataMap.set(`${d.day}-${d.hour}`, d.count);
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Mapa de Calor
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Horários de pico • {periodLabel}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Header row with hours */}
              <div className="flex mb-1">
                <div className="w-10 flex-shrink-0" />
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    className="flex-1 text-center text-xs text-muted-foreground min-w-[28px]"
                  >
                    {hour}h
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {days.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <div className="w-10 flex-shrink-0 text-xs text-muted-foreground text-right pr-2">
                    {day}
                  </div>
                  {hours.map(hour => {
                    const count = dataMap.get(`${dayIndex}-${hour}`) || 0;
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`flex-1 h-6 rounded-sm min-w-[28px] transition-colors ${getIntensity(count, maxCount)}`}
                        title={`${day} ${hour}h: ${count} pedidos`}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>Baixo</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded-sm bg-green-200" />
                  <div className="w-4 h-4 rounded-sm bg-yellow-300" />
                  <div className="w-4 h-4 rounded-sm bg-amber-400" />
                  <div className="w-4 h-4 rounded-sm bg-orange-500" />
                  <div className="w-4 h-4 rounded-sm bg-red-500" />
                </div>
                <span>Alto</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
