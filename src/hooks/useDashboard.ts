import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  pendingOrders: number;
  lastWeekSales: number;
  lastWeekOrders: number;
  salesGrowth: number;
  ordersGrowth: number;
}

export interface CurrentStatus {
  activeTables: number[];
  pendingOrders: number;
  readyOrders: number;
  totalOpenAmount: number;
  oldestPendingMinutes: number | null;
  pendingOrdersList: { orderNumber: number; tableNumber: number | null; minutesWaiting: number }[];
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

export interface PaymentMethodStats {
  method: string;
  total: number;
  count: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();
      
      // Same day last week
      const lastWeekDay = subDays(today, 7);
      const startOfLastWeekDay = startOfDay(lastWeekDay).toISOString();
      const endOfLastWeekDay = endOfDay(lastWeekDay).toISOString();

      // Get today's orders (paid status means completed)
      const { data: todayOrders, error } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);

      if (error) throw error;

      // Get last week same day orders
      const { data: lastWeekOrders } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', startOfLastWeekDay)
        .lte('created_at', endOfLastWeekDay);

      const completedOrders = todayOrders?.filter(o => o.status === 'paid') || [];
      const pendingOrders = todayOrders?.filter(o => o.status === 'pending' || o.status === 'ready') || [];
      
      const todaySales = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const averageTicket = completedOrders.length > 0 ? todaySales / completedOrders.length : 0;

      const lastWeekCompleted = lastWeekOrders?.filter(o => o.status === 'paid') || [];
      const lastWeekSales = lastWeekCompleted.reduce((sum, order) => sum + Number(order.total), 0);

      // Calculate growth percentages
      const salesGrowth = lastWeekSales > 0 
        ? ((todaySales - lastWeekSales) / lastWeekSales) * 100 
        : todaySales > 0 ? 100 : 0;
      
      const ordersGrowth = lastWeekCompleted.length > 0 
        ? ((completedOrders.length - lastWeekCompleted.length) / lastWeekCompleted.length) * 100 
        : completedOrders.length > 0 ? 100 : 0;

      return {
        todaySales,
        todayOrders: completedOrders.length,
        averageTicket,
        pendingOrders: pendingOrders.length,
        lastWeekSales,
        lastWeekOrders: lastWeekCompleted.length,
        salesGrowth,
        ordersGrowth,
      };
    },
    refetchInterval: 30000,
  });
}

export function useCurrentStatus() {
  return useQuery({
    queryKey: ['current-status'],
    queryFn: async (): Promise<CurrentStatus> => {
      // Get all open orders (pending or ready)
      const { data: openOrders, error } = await supabase
        .from('orders')
        .select('order_number, table_number, status, total, paid_amount, created_at')
        .in('status', ['pending', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const now = new Date();
      
      const activeTables = [...new Set(
        openOrders
          ?.filter(o => o.table_number !== null)
          .map(o => o.table_number as number)
      )].sort((a, b) => a - b);

      const pendingOrdersData = openOrders?.filter(o => o.status === 'pending') || [];
      const readyOrders = openOrders?.filter(o => o.status === 'ready').length || 0;
      
      const totalOpenAmount = openOrders?.reduce((sum, o) => {
        return sum + (Number(o.total) - Number(o.paid_amount || 0));
      }, 0) || 0;

      // Calculate waiting times for pending orders
      const pendingOrdersList = pendingOrdersData.map(o => {
        const createdAt = new Date(o.created_at);
        const minutesWaiting = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
        return {
          orderNumber: o.order_number,
          tableNumber: o.table_number,
          minutesWaiting,
        };
      }).sort((a, b) => b.minutesWaiting - a.minutesWaiting);

      const oldestPendingMinutes = pendingOrdersList.length > 0 
        ? pendingOrdersList[0].minutesWaiting 
        : null;

      return {
        activeTables,
        pendingOrders: pendingOrdersData.length,
        readyOrders,
        totalOpenAmount,
        oldestPendingMinutes,
        pendingOrdersList,
      };
    },
    refetchInterval: 10000,
  });
}

export function usePaymentMethodStats() {
  return useQuery({
    queryKey: ['payment-method-stats'],
    queryFn: async (): Promise<PaymentMethodStats[]> => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      
      const { data: payments, error } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .gte('created_at', startOfToday);

      if (error) throw error;

      const methodMap = new Map<string, { total: number; count: number }>();
      
      payments?.forEach((p) => {
        const existing = methodMap.get(p.payment_method);
        if (existing) {
          existing.total += Number(p.amount);
          existing.count += 1;
        } else {
          methodMap.set(p.payment_method, { total: Number(p.amount), count: 1 });
        }
      });

      return Array.from(methodMap.entries()).map(([method, data]) => ({
        method,
        total: data.total,
        count: data.count,
      }));
    },
    refetchInterval: 30000,
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['top-products'],
    queryFn: async (): Promise<TopProduct[]> => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();

      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          subtotal,
          product_id,
          products (name)
        `)
        .gte('created_at', startOfToday);

      if (error) throw error;

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

      return Array.from(productMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);
    },
    refetchInterval: 30000,
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
        .eq('status', 'paid');

      if (error) throw error;

      const dailyMap = new Map<string, { total: number; orders: number }>();
      
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
        .limit(8);

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
    refetchInterval: 10000,
  });
}
