import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2, AlertTriangle, Edit, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditEvent {
  id: string;
  type: 'cancel' | 'edit' | 'delete' | 'void';
  description: string;
  user: string;
  timestamp: Date;
  orderId?: string;
}

interface AuditCardProps {
  data: AuditEvent[] | null | undefined;
  isLoading: boolean;
  periodLabel: string;
}

const eventConfig = {
  cancel: { icon: X, label: 'Cancelamento', color: 'bg-red-100 text-red-700' },
  edit: { icon: Edit, label: 'Edição', color: 'bg-amber-100 text-amber-700' },
  delete: { icon: Trash2, label: 'Exclusão', color: 'bg-red-100 text-red-700' },
  void: { icon: AlertTriangle, label: 'Estorno', color: 'bg-orange-100 text-orange-700' },
};

export function AuditCard({ data, isLoading, periodLabel }: AuditCardProps) {
  const hasEvents = data && data.length > 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Auditoria Anti-Fraude
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Monitoramento de alterações • {periodLabel}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasEvents ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {data.map((event) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;
              return (
                <div 
                  key={event.id} 
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className={`p-1.5 rounded-full ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={config.color}>
                        {config.label}
                      </Badge>
                      {event.orderId && (
                        <span className="text-xs text-muted-foreground">
                          Pedido #{event.orderId}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{event.user}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(event.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="p-3 rounded-full bg-emerald-100 mb-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">Nenhuma alteração suspeita</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tudo em ordem no período selecionado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
