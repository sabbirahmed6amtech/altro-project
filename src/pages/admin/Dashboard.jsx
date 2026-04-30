import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-[#0e1a12]/50 font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#0e1a12]">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ordersRes, productsRes, recentRes] = await Promise.all([
          supabase
            .from('orders')
            .select('total, status', { count: 'exact' }),
          supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('is_active', true),
          supabase
            .from('orders')
            .select('id, order_number, customer_name, total, status, created_at')
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        const orders = ordersRes.data ?? [];
        const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const pending = orders.filter((o) => o.status === 'pending').length;

        setStats({
          orders: ordersRes.count ?? orders.length,
          revenue,
          products: productsRes.count ?? 0,
          pending,
        });
        setRecentOrders(recentRes.data ?? []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Orders',
      value: stats.orders.toLocaleString(),
      color: 'bg-[#1a5c38]/10',
      icon: (
        <svg className="w-6 h-6 text-[#1a5c38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.revenue),
      color: 'bg-blue-50',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Active Products',
      value: stats.products.toLocaleString(),
      color: 'bg-purple-50',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
    },
    {
      label: 'Pending Orders',
      value: stats.pending.toLocaleString(),
      color: 'bg-yellow-50',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statItems.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0e1a12]">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-[#1a5c38] font-medium hover:underline"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-[#0e1a12]/40">
            <p className="font-medium">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-[#0e1a12]/50 uppercase tracking-wide">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-semibold text-[#1a5c38] hover:underline"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/70">{order.customer_name}</td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <Badge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/50">
                      {new Date(order.created_at).toLocaleDateString('en-BD', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
