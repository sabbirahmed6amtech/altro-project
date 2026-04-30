import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../../components/Spinner';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  async function loadCustomers(searchVal) {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('customer_name, customer_phone, customer_email, customer_address, total, created_at')
      .order('created_at', { ascending: false });

    if (searchVal) {
      query = query.or(
        `customer_name.ilike.%${searchVal}%,customer_phone.ilike.%${searchVal}%`
      );
    }

    const { data } = await query;
    if (!data) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    // Aggregate by phone
    const map = new Map();
    for (const row of data) {
      const key = row.customer_phone;
      if (map.has(key)) {
        const existing = map.get(key);
        existing.orderCount += 1;
        existing.totalSpent += Number(row.total) || 0;
        if (new Date(row.created_at) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = row.created_at;
        }
      } else {
        map.set(key, {
          phone: row.customer_phone,
          name: row.customer_name,
          email: row.customer_email || '',
          address: row.customer_address || '',
          orderCount: 1,
          totalSpent: Number(row.total) || 0,
          lastOrderAt: row.created_at,
        });
      }
    }

    setCustomers(Array.from(map.values()));
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers('');
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    loadCustomers(searchInput);
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or phone…"
            className="flex-1 border border-[#0e1a12]/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-[#1a5c38] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2a7d50] transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0e1a12]">
            {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-[#0e1a12]/40">
            <p className="font-medium">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-[#0e1a12]/50 uppercase tracking-wide">
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3">Total Spent</th>
                  <th className="px-6 py-3">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.phone} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0e1a12]">{c.name}</p>
                      {c.email && (
                        <p className="text-xs text-[#0e1a12]/50">{c.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/70">{c.phone}</td>
                    <td className="px-6 py-4 font-semibold text-[#1a5c38]">{c.orderCount}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-6 py-4 text-[#0e1a12]/50">
                      {new Date(c.lastOrderAt).toLocaleDateString('en-BD', {
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
