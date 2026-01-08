import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileSpreadsheet, Download, Loader2, Lock, FileText } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFiscalReport } from '@/hooks/useFiscalReport';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

export function FiscalReportCard() {
  const navigate = useNavigate();
  const { hasAccess } = useSubscriptionContext();
  const isPro = hasAccess('pro');
  const { generateReport, isLoading } = useFiscalReport();

  // Generate last 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
    };
  });

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const handleDownload = (format: 'csv' | 'xlsx') => {
    if (isPro) {
      generateReport(selectedMonth, format);
    } else {
      navigate('/assinatura');
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          Área do Contador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Baixe o relatório mensal de vendas para enviar ao seu contador. 
          Compatível com a maioria dos sistemas contábeis (CSV/Excel).
        </p>

        <div className="flex flex-col gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="sm:w-[200px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isPro ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleDownload('xlsx')}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Baixar Excel (.xlsx)
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleDownload('csv')}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar CSV
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => navigate('/assinatura')}
              className="bg-muted text-muted-foreground flex-1 sm:flex-none"
            >
              <Lock className="h-4 w-4 mr-2" />
              Recurso Pro
            </Button>
          )}
        </div>

        {!isPro && (
          <p className="text-xs text-muted-foreground">
            Faça upgrade para o plano Pro para desbloquear a exportação fiscal.{' '}
            <button 
              onClick={() => navigate('/assinatura')}
              className="text-primary underline hover:no-underline"
            >
              Ver planos
            </button>
          </p>
        )}

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>O relatório inclui:</strong> Data/Hora, Nº do Pedido, Mesa, Produto, 
            Quantidade, Valor Unitário, Valor Total, Forma de Pagamento e Status.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
