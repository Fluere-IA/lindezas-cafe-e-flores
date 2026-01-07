import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { startOfDay, subDays, startOfMonth, endOfDay } from 'date-fns';

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
  };
}
