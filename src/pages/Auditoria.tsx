import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PlanGuard } from '@/components/subscription/PlanGuard';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldCheck,
  Loader2,
  Search,
  Calendar,
  Filter,
  X,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow, format, startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type EventType = 'all' | 'cancel' | 'edit' | 'void' | 'delete' | 'status_change' | 'item_removed';
type PeriodFilter = 'today' | 'week' | 'month' | 'all';

interface AuditLog {
  id: string;
  order_number: number | null;
  event_type: string;
  description: string;
  user_email: string | null;
  user_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

const eventConfig: Record<string, { icon: typeof Edit; label: string; color: string }> = {
  cancel: { icon: X, label: 'Cancelamento', color: 'bg-red-100 text-red-700 border-red-200' },
  edit: { icon: Edit, label: 'Edição', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  delete: { icon: Trash2, label: 'Exclusão', color: 'bg-red-100 text-red-700 border-red-200' },
  void: { icon: AlertTriangle, label: 'Estorno', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  status_change: { icon: RefreshCw, label: 'Status', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  item_removed: { icon: Trash2, label: 'Item Removido', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function AuditoriaContent() {
  const { currentOrganization } = useOrganization();
  const [period, setPeriod] = useState<PeriodFilter>('week');
  const [eventType, setEventType] = useState<EventType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfDay(now) };
      case 'all':
        return { start: null, end: null };
      default:
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', currentOrganization?.id, period, eventType, searchQuery, page],
    queryFn: async () => {
      if (!currentOrganization?.id) return { logs: [], total: 0 };

      const dateRange = getDateRange();

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end.toISOString());
      }

      if (eventType !== 'all') {
        query = query.eq('event_type', eventType);
      }

      if (searchQuery) {
        const orderNum = parseInt(searchQuery);
        if (!isNaN(orderNum)) {
          query = query.eq('order_number', orderNum);
        }
      }

      const { data: logs, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return { logs: [], total: 0 };
      }

      return { logs: logs as AuditLog[], total: count || 0 };
    },
    enabled: !!currentOrganization?.id,
  });

  const logs = data?.logs || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const clearFilters = () => {
    setPeriod('week');
    setEventType('all');
    setSearchQuery('');
    setPage(0);
  };

  const hasActiveFilters = period !== 'week' || eventType !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            Auditoria Anti-Fraude
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo de alterações e cancelamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {totalCount} registros
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Período
              </label>
              <Select value={period} onValueChange={(v) => { setPeriod(v as PeriodFilter); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Type Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Tipo de Evento
              </label>
              <Select value={eventType} onValueChange={(v) => { setEventType(v as EventType); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cancel">Cancelamentos</SelectItem>
                  <SelectItem value="status_change">Mudança de Status</SelectItem>
                  <SelectItem value="item_removed">Itens Removidos</SelectItem>
                  <SelectItem value="edit">Edições</SelectItem>
                  <SelectItem value="void">Estornos</SelectItem>
                  <SelectItem value="delete">Exclusões</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Nº do Pedido
              </label>
              <Input
                placeholder="Ex: 123"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                type="number"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-emerald-100 mb-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium">Nenhum registro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveFilters ? 'Tente ajustar os filtros' : 'Ainda não há eventos de auditoria'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const config = eventConfig[log.event_type] || eventConfig.edit;
                const Icon = config.icon;
                return (
                  <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full border ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={config.color}>
                            {config.label}
                          </Badge>
                          {log.order_number && (
                            <span className="text-sm font-medium">
                              Pedido #{log.order_number}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1.5">{log.description}</p>
                        
                        {/* Show old/new values if available */}
                        {(log.old_values || log.new_values) && (
                          <div className="mt-2 text-xs bg-muted/50 rounded p-2 space-y-1">
                            {log.old_values && (
                              <div className="text-muted-foreground">
                                <span className="font-medium">Antes:</span>{' '}
                                {Object.entries(log.old_values)
                                  .filter(([, v]) => v !== null)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')}
                              </div>
                            )}
                            {log.new_values && (
                              <div className="text-muted-foreground">
                                <span className="font-medium">Depois:</span>{' '}
                                {Object.entries(log.new_values)
                                  .filter(([, v]) => v !== null)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{log.user_email || 'Sistema'}</span>
                          <span>•</span>
                          <span title={format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}>
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Auditoria() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <PlanGuard
          requiredPlan="pro"
          featureName="Auditoria Anti-Fraude"
          description="Acompanhe todas as alterações, cancelamentos e estornos com histórico detalhado. Disponível no plano Pro."
        >
          <AuditoriaContent />
        </PlanGuard>
      </main>
    </div>
  );
}
