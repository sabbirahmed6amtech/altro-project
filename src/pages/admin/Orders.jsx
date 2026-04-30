import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'processing', label: 'Processing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 20;

export default function Orders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState('');

  const { orders, loading, total } = useOrders({ status, search, page, pageSize: PAGE_SIZE });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(inputValue);
    setPage(1);
  }

  function handleStatusChange(e) {
    setStatus(e.target.value);
    setPage(1);
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by order #, name or phone…"
            className="flex-1 border border-[#0e1a12]/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-[#1a5c38] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2a7d50] transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={handleStatusChange}
          className="border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0e1a12]">
            {total} order{total !== 1 ? 's' : ''}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-[#0e1a12]/40">
            <p className="font-medium">No orders found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-[#0e1a12]/50 uppercase tracking-wide">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1a5c38]">
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/70">{order.customer_name}</td>
                    <td className="px-6 py-4 text-[#0e1a12]/50">{order.customer_phone}</td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4 text-[#0e1a12]/60 capitalize">
                      {order.payment_method}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/50 whitespace-nowrap">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-[#0e1a12]/50">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-[#0e1a12]/20 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-[#0e1a12]/20 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
