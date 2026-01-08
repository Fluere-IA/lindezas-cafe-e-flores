import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { startOfDay, subDays, startOfMonth, endOfDay, getDay, getHours } from 'date-fns';

export type PeriodFilter = 'today' | 'week' | 'month';

interface DREData {
  receitaBruta: number;
  custos: number;
  lucroOperacional: number;
  margemLucro: number;
}

interface ABCProduct {
  name: string;
  revenue: number;
  quantity: number;
  percentage: number;
  classification: 'A' | 'B' | 'C';
}

interface HeatmapData {
  hour: number;
  day: string;
  count: number;
}

interface AuditEvent {
  id: string;
  type: 'cancel' | 'edit' | 'delete' | 'void';
  description: string;
  user: string;
  timestamp: Date;
  orderId?: string;
}

export function useReports() {
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const { currentOrganization } = useOrganization();

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfDay(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [period]);

  const periodLabel = useMemo(() => {
    switch (period) {
      case 'today':
        return 'Hoje';
      case 'week':
        return 'Últimos 7 dias';
      case 'month':
        return 'Este Mês';
      default:
        return '';
    }
  }, [period]);

  // Fetch DRE data
  const dreQuery = useQuery({
    queryKey: ['reports-dre', currentOrganization?.id, dateRange.start, dateRange.end],
    queryFn: async (): Promise<DREData | null> => {
      if (!currentOrganization?.id) return null;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, paid_amount')
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .in('status', ['completed', 'paid']);

      if (error) {
        console.error('Error fetching DRE data:', error);
        return null;
      }

      const receitaBruta = orders?.reduce((sum, order) => sum + (order.paid_amount || order.total || 0), 0) || 0;
      // CMV estimado em 35% (padrão do setor de alimentação)
      const custos = receitaBruta * 0.35;
      const lucroOperacional = receitaBruta - custos;
      const margemLucro = receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0;

      return {
        receitaBruta,
        custos,
        lucroOperacional,
        margemLucro,
      };
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch ABC Curve data
  const abcQuery = useQuery({
    queryKey: ['reports-abc', currentOrganization?.id, dateRange.start, dateRange.end],
    queryFn: async (): Promise<ABCProduct[] | null> => {
      if (!currentOrganization?.id) return null;

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          subtotal,
          products (name)
        `)
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (error) {
        console.error('Error fetching ABC data:', error);
        return null;
      }

      // Aggregate by product
      const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();

      orderItems?.forEach((item) => {
        const productName = (item.products as { name: string } | null)?.name || 'Produto Desconhecido';
        const existing = productMap.get(item.product_id);
        
        if (existing) {
          existing.revenue += item.subtotal || 0;
          existing.quantity += item.quantity || 0;
        } else {
          productMap.set(item.product_id, {
            name: productName,
            revenue: item.subtotal || 0,
            quantity: item.quantity || 0,
          });
        }
      });

      // Convert to array and sort by revenue
      const products = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10

      const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

      // Calculate percentage and classify ABC
      let accumulatedPercentage = 0;
      const classifiedProducts: ABCProduct[] = products.map((product) => {
        const percentage = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
        accumulatedPercentage += percentage;

        let classification: 'A' | 'B' | 'C';
        if (accumulatedPercentage <= 80) {
          classification = 'A';
        } else if (accumulatedPercentage <= 95) {
          classification = 'B';
        } else {
          classification = 'C';
        }

        return {
          ...product,
          percentage,
          classification,
        };
      });

      return classifiedProducts;
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch Heatmap data
  const heatmapQuery = useQuery({
    queryKey: ['reports-heatmap', currentOrganization?.id, dateRange.start, dateRange.end],
    queryFn: async (): Promise<HeatmapData[] | null> => {
      if (!currentOrganization?.id) return null;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at')
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (error) {
        console.error('Error fetching heatmap data:', error);
        return null;
      }

      // Aggregate orders by day of week and hour
      const heatmapMap = new Map<string, number>();

      orders?.forEach((order) => {
        const date = new Date(order.created_at);
        const dayOfWeek = getDay(date); // 0-6 (Sunday to Saturday)
        const hour = getHours(date);
        
        // Only count business hours (8-21)
        if (hour >= 8 && hour <= 21) {
          const key = `${dayOfWeek}-${hour}`;
          heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
        }
      });

      // Convert to array
      const result: HeatmapData[] = [];
      for (let day = 0; day <= 6; day++) {
        for (let hour = 8; hour <= 21; hour++) {
          const key = `${day}-${hour}`;
          result.push({
            day: String(day),
            hour,
            count: heatmapMap.get(key) || 0,
          });
        }
      }

      return result;
    },
    enabled: !!currentOrganization?.id,
  });

  // Fetch Audit data from dedicated audit_logs table
  const auditQuery = useQuery({
    queryKey: ['reports-audit', currentOrganization?.id, dateRange.start, dateRange.end],
    queryFn: async (): Promise<AuditEvent[] | null> => {
      if (!currentOrganization?.id) return null;

      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('id, order_number, event_type, description, user_email, created_at')
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching audit data:', error);
        return null;
      }

      // Map event_type from DB enum to our UI type
      const typeMap: Record<string, 'cancel' | 'edit' | 'delete' | 'void'> = {
        'cancel': 'cancel',
        'edit': 'edit',
        'void': 'void',
        'delete': 'delete',
        'status_change': 'edit',
        'item_removed': 'delete',
      };

      return logs?.map((log) => ({
        id: log.id,
        type: typeMap[log.event_type] || 'edit',
        description: log.description,
        user: log.user_email || 'Sistema',
        timestamp: new Date(log.created_at),
        orderId: log.order_number ? String(log.order_number) : undefined,
      })) || [];
    },
    enabled: !!currentOrganization?.id,
  });

  return {
    period,
    setPeriod,
    periodLabel,
    dre: {
      data: dreQuery.data,
      isLoading: dreQuery.isLoading,
    },
    abc: {
      data: abcQuery.data,
      isLoading: abcQuery.isLoading,
    },
    heatmap: {
      data: heatmapQuery.data,
      isLoading: heatmapQuery.isLoading,
    },
    audit: {
      data: auditQuery.data,
      isLoading: auditQuery.isLoading,
    },
  };
}
