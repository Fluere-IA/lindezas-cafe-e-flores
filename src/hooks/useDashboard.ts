import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  pendingOrders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface DailySales {
  date: string;
  total: number;
  orders: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: number;
  mode: string;
  tableNumber: number | null;
  status: string;
  total: number;
  createdAt: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Get today's orders
      const { data: todayOrders, error } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);

      if (error) throw error;

      const completedOrders = todayOrders?.filter(o => o.status === 'completed') || [];
      const pendingOrders = todayOrders?.filter(o => o.status === 'pending' || o.status === 'preparing') || [];
      
      const todaySales = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const averageTicket = completedOrders.length > 0 ? todaySales / completedOrders.length : 0;

      return {
        todaySales,
        todayOrders: completedOrders.length,
        averageTicket,
        pendingOrders: pendingOrders.length,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['top-products'],
    queryFn: async (): Promise<TopProduct[]> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          subtotal,
          product_id,
          products (name)
        `)
        .gte('created_at', thirtyDaysAgo);

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<string, TopProduct>();
      
      orderItems?.forEach((item: any) => {
        const existing = productMap.get(item.product_id);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalRevenue += Number(item.subtotal);
        } else {
          productMap.set(item.product_id, {
            productId: item.product_id,
            productName: item.products?.name || 'Produto',
            totalQuantity: item.quantity,
            totalRevenue: Number(item.subtotal),
          });
        }
      });

      // Sort by quantity and get top 5
      return Array.from(productMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);
    },
  });
}

export function useDailySales() {
  return useQuery({
    queryKey: ['daily-sales'],
    queryFn: async (): Promise<DailySales[]> => {
      const sevenDaysAgo = subDays(new Date(), 6);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, created_at, status')
        .gte('created_at', startOfDay(sevenDaysAgo).toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Group by day
      const dailyMap = new Map<string, { total: number; orders: number }>();
      
      // Initialize all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap.set(date, { total: 0, orders: 0 });
      }

      orders?.forEach((order) => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(date);
        if (existing) {
          existing.total += Number(order.total);
          existing.orders += 1;
        }
      });

      return Array.from(dailyMap.entries()).map(([date, data]) => ({
        date: format(new Date(date), 'dd/MM'),
        total: data.total,
        orders: data.orders,
      }));
    },
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['recent-orders'],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        mode: order.mode,
        tableNumber: order.table_number,
        status: order.status,
        total: Number(order.total),
        createdAt: order.created_at,
      }));
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
