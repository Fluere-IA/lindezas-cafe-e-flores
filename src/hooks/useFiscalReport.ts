import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format, startOfMonth, endOfMonth, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface FiscalReportRow {
  dataHora: string;
  pedidoNumero: number;
  mesa: string;
  produto: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  metodoPagamento: string;
  status: string;
}

type ExportFormat = 'csv' | 'xlsx';

export function useFiscalReport() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const fetchReportData = async (monthYear: string): Promise<FiscalReportRow[] | null> => {
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada.',
        variant: 'destructive',
      });
      return null;
    }

    const date = parse(monthYear, 'yyyy-MM', new Date());
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        unit_price,
        subtotal,
        payment_method,
        created_at,
        products (name),
        orders (
          order_number,
          table_number,
          status,
          mode
        )
      `)
      .eq('organization_id', currentOrganization.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!orderItems || orderItems.length === 0) {
      toast({
        title: 'Relatório Vazio',
        description: 'Não há vendas registradas neste período.',
        variant: 'default',
      });
      return null;
    }

    return orderItems.map((item) => {
      const order = item.orders as { order_number: number; table_number: number | null; status: string; mode: string } | null;
      const product = item.products as { name: string } | null;

      return {
        dataHora: format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        pedidoNumero: order?.order_number || 0,
        mesa: order?.table_number ? String(order.table_number) : (order?.mode === 'balcao' ? 'Balcão' : '-'),
        produto: product?.name || 'Produto não encontrado',
        quantidade: item.quantity,
        valorUnitario: Number(item.unit_price),
        valorTotal: Number(item.subtotal),
        metodoPagamento: translatePaymentMethod(item.payment_method),
        status: translateStatus(order?.status),
      };
    });
  };

  const generateReport = async (monthYear: string, exportFormat: ExportFormat = 'csv') => {
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const rows = await fetchReportData(monthYear);
      if (!rows) {
        setIsLoading(false);
        return;
      }

      const date = parse(monthYear, 'yyyy-MM', new Date());
      const monthName = format(date, 'MMMM-yyyy', { locale: ptBR });
      const fileName = `relatorio-fiscal-${currentOrganization.name.replace(/\s+/g, '-').toLowerCase()}-${monthName}`;

      const totalVendas = rows.reduce((sum, row) => sum + row.valorTotal, 0);
      const totalItens = rows.reduce((sum, row) => sum + row.quantidade, 0);

      if (exportFormat === 'xlsx') {
        generateXLSX(rows, monthYear, totalVendas, totalItens, fileName);
      } else {
        const csv = generateCSV(rows, monthYear, totalVendas, totalItens);
        downloadCSV(csv, fileName);
      }

      toast({
        title: 'Relatório Gerado',
        description: `${rows.length} registros exportados em ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error generating fiscal report:', error);
      toast({
        title: 'Erro ao Gerar Relatório',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { generateReport, isLoading };
}

function translatePaymentMethod(method: string | null): string {
  const methods: Record<string, string> = {
    cash: 'Dinheiro',
    card: 'Cartão',
    pix: 'PIX',
    credit: 'Crédito',
    debit: 'Débito',
  };
  return method ? methods[method] || method : 'Não informado';
}

function translateStatus(status: string | undefined): string {
  const statuses: Record<string, string> = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    completed: 'Concluído',
    paid: 'Pago',
    cancelled: 'Cancelado',
  };
  return status ? statuses[status] || status : '-';
}

function generateCSV(
  rows: FiscalReportRow[],
  monthYear: string,
  totalVendas: number,
  totalItens: number
): string {
  const date = parse(monthYear, 'yyyy-MM', new Date());
  const monthName = format(date, 'MMMM yyyy', { locale: ptBR });

  const BOM = '\uFEFF';

  const header = [
    `RELATÓRIO FISCAL - ${monthName.toUpperCase()}`,
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    `Total de Vendas: R$ ${totalVendas.toFixed(2).replace('.', ',')}`,
    `Total de Itens: ${totalItens}`,
    '',
  ].join('\n');

  const columns = [
    'Data/Hora',
    'Nº Pedido',
    'Mesa',
    'Produto',
    'Quantidade',
    'Valor Unitário (R$)',
    'Valor Total (R$)',
    'Forma de Pagamento',
    'Status',
  ];

  const dataRows = rows.map((row) =>
    [
      row.dataHora,
      row.pedidoNumero,
      row.mesa,
      `"${row.produto.replace(/"/g, '""')}"`,
      row.quantidade,
      row.valorUnitario.toFixed(2).replace('.', ','),
      row.valorTotal.toFixed(2).replace('.', ','),
      row.metodoPagamento,
      row.status,
    ].join(';')
  );

  return BOM + header + columns.join(';') + '\n' + dataRows.join('\n');
}

function downloadCSV(csv: string, fileName: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateXLSX(
  rows: FiscalReportRow[],
  monthYear: string,
  totalVendas: number,
  totalItens: number,
  fileName: string
) {
  const date = parse(monthYear, 'yyyy-MM', new Date());
  const monthName = format(date, 'MMMM yyyy', { locale: ptBR });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Header rows
  const headerData = [
    [`RELATÓRIO FISCAL - ${monthName.toUpperCase()}`],
    [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
    [`Total de Vendas: R$ ${totalVendas.toFixed(2).replace('.', ',')}`],
    [`Total de Itens: ${totalItens}`],
    [],
    ['Data/Hora', 'Nº Pedido', 'Mesa', 'Produto', 'Quantidade', 'Valor Unitário (R$)', 'Valor Total (R$)', 'Forma de Pagamento', 'Status'],
  ];

  // Data rows
  const dataRows = rows.map((row) => [
    row.dataHora,
    row.pedidoNumero,
    row.mesa,
    row.produto,
    row.quantidade,
    row.valorUnitario,
    row.valorTotal,
    row.metodoPagamento,
    row.status,
  ]);

  const wsData = [...headerData, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // Data/Hora
    { wch: 10 }, // Nº Pedido
    { wch: 8 },  // Mesa
    { wch: 30 }, // Produto
    { wch: 12 }, // Quantidade
    { wch: 18 }, // Valor Unitário
    { wch: 16 }, // Valor Total
    { wch: 18 }, // Forma de Pagamento
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Relatório Fiscal');

  // Download
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
