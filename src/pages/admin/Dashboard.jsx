import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

function StatCard({ label, value, icon, color, change }) {
  const positive = change >= 0;
  return (
    <div className="bg-white rounded-2xl p-6 flex items-start gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0e1a12]/50 font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#0e1a12] truncate">{value}</p>
        {change !== undefined && (
          <p className={`text-xs font-medium mt-0.5 ${positive ? 'text-green-600' : 'text-red-500'}`}>
            {positive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs last 30d
          </p>
        )}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d) => {
        const pct = (d.revenue / max) * 100;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-xs text-[#0e1a12]/50 truncate w-full text-center">{formatCurrency(d.revenue)}</span>
            <div className="w-full rounded-t-sm bg-[#1a5c38]/10 relative" style={{ height: '80px' }}>
              <div
                className="absolute bottom-0 w-full bg-[#1a5c38] rounded-t-sm transition-all duration-700"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-[#0e1a12]/50 truncate w-full text-center">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const COLORS = ['#1a5c38', '#c9f230', '#2a7d50', '#88b04b', '#5b8e3e', '#0e3320'];

  const segments = [];
  let cumulative = 0;
  data.forEach((d, i) => {
    const pct = (d.value / total) * 100;
    const startAngle = (cumulative / 100) * 360;
    cumulative += pct;
    const endAngle = (cumulative / 100) * 360;
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const r = 50;
    const cx = 60, cy = 60;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    segments.push({ d: `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`, color: COLORS[i % COLORS.length], label: d.label, pct });
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0">
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} />
        ))}
        <circle cx="60" cy="60" r="30" fill="white" />
      </svg>
      <div className="space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[#0e1a12]/70 capitalize">{s.label}</span>
            <span className="font-semibold text-[#0e1a12] ml-auto pl-4">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** For metrics where a decrease is desirable (e.g. pending orders), flip the sign so positive % = improvement */
function invertTrend(pct) {
  return pct !== undefined ? -pct : undefined;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, pending: 0 });
  const [changes, setChanges] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleNewOrder = useCallback((order) => {
    setActivityFeed((prev) => [order, ...prev].slice(0, 20));
    setStats((s) => ({ ...s, pending: s.pending + 1, orders: s.orders + 1 }));
  }, []);

  useRealtime(handleNewOrder);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

        const [ordersRes, productsRes, recentRes, prevPeriodRes] = await Promise.all([
          supabase
            .from('orders')
            .select('total, status, created_at', { count: 'exact' })
            .gte('created_at', thirtyDaysAgo),
          supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('is_active', true),
          supabase
            .from('orders')
            .select('id, order_number, customer_name, total, status, created_at')
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('orders')
            .select('total, status', { count: 'exact' })
            .gte('created_at', sixtyDaysAgo)
            .lt('created_at', thirtyDaysAgo),
        ]);

        const currentOrders = ordersRes.data ?? [];
        const prevOrders = prevPeriodRes.data ?? [];

        const currentRevenue = currentOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
        const prevRevenue = prevOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
        const currentPending = currentOrders.filter((o) => o.status === 'pending').length;
        const prevPending = prevOrders.filter((o) => o.status === 'pending').length;

        const pctChange = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

        setStats({
          orders: ordersRes.count ?? currentOrders.length,
          revenue: currentRevenue,
          products: productsRes.count ?? 0,
          pending: currentPending,
        });
        setChanges({
          orders: pctChange(ordersRes.count ?? currentOrders.length, prevPeriodRes.count ?? prevOrders.length),
          revenue: pctChange(currentRevenue, prevRevenue),
          pending: pctChange(currentPending, prevPending),
        });
        setRecentOrders(recentRes.data ?? []);

        // Monthly revenue - last 7 months
        const allOrdersRes = await supabase
          .from('orders')
          .select('id, total, created_at, items');
        const allOrders = allOrdersRes.data ?? [];
        const monthMap = {};
        const months = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-BD', { month: 'short' });
          monthMap[key] = { month: label, revenue: 0 };
          months.push(key);
        }
        allOrders.forEach((o) => {
          const key = o.created_at?.slice(0, 7);
          if (monthMap[key]) monthMap[key].revenue += Number(o.total) || 0;
        });
        setMonthlyRevenue(months.map((k) => monthMap[k]));

        // Category breakdown
        const catMap = {};
        allOrders.forEach((o) => {
          let items;
          try {
            items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items ?? [];
          } catch (parseErr) {
            console.warn('Failed to parse order items for order', o.id, parseErr);
            items = [];
          }
          if (!Array.isArray(items)) items = [];
          items.forEach((item) => {
            const cat = item.category || 'other';
            catMap[cat] = (catMap[cat] || 0) + 1;
          });
        });
        const cats = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([label, value]) => ({ label, value }));
        setCategoryBreakdown(cats);
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
      label: 'Total Orders (30d)',
      value: stats.orders.toLocaleString(),
      change: changes.orders,
      color: 'bg-[#1a5c38]/10',
      icon: (
        <svg className="w-6 h-6 text-[#1a5c38]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Revenue (30d)',
      value: formatCurrency(stats.revenue),
      change: changes.revenue,
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
      // Invert sign: fewer pending orders is an improvement (positive trend)
      change: invertTrend(changes.pending),
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-[#0e1a12] mb-4">Monthly Revenue</h2>
          {monthlyRevenue.length > 0 ? (
            <BarChart data={monthlyRevenue} />
          ) : (
            <p className="text-sm text-[#0e1a12]/40 text-center py-10">No revenue data yet</p>
          )}
        </div>

        {/* Category Donut Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-[#0e1a12] mb-4">Sales by Category</h2>
          {categoryBreakdown.length > 0 ? (
            <DonutChart data={categoryBreakdown} />
          ) : (
            <p className="text-sm text-[#0e1a12]/40 text-center py-10">No category data yet</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
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

        {/* Live Activity Feed */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#0e1a12]">Live Activity</h2>
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>
          {activityFeed.length === 0 ? (
            <div className="text-center py-10 px-4 text-[#0e1a12]/40">
              <p className="text-sm">Waiting for new orders…</p>
              <p className="text-xs mt-1">New orders will appear here in real time.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {activityFeed.map((order, i) => (
                <div key={order.id ?? i} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[#c9f230] shrink-0 ring-2 ring-[#1a5c38]/20" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0e1a12] truncate">
                      New order from {order.customer_name}
                    </p>
                    <p className="text-xs text-[#0e1a12]/50">
                      {order.order_number} · {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-[#0e1a12]/30 mt-0.5">
                      {new Date(order.created_at ?? new Date()).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
