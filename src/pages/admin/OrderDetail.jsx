import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { InvoiceDownloadButton } from '../../lib/Invoice';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/Toast';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'processing', label: 'Processing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_LABELS = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  cod: 'Cash on Delivery',
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-sm text-[#0e1a12]/50 w-36 shrink-0">{label}</span>
      <span className="text-sm text-[#0e1a12] font-medium">{value}</span>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        toast.error('Failed to load order.');
        navigate('/admin/orders');
      } else {
        setOrder(data);
        setNewStatus(data.status);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id, navigate, toast]);

  async function handleStatusUpdate() {
    if (!order || newStatus === order.status) return;
    setStatusLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update status.');
    } else {
      setOrder((prev) => ({ ...prev, status: newStatus }));
      toast.success('Order status updated.');
    }
    setStatusLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) return null;

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items ?? [];
  const subtotal = Number(order.subtotal) || 0;
  const discount = Number(order.discount) || 0;
  const deliveryFee = Number(order.delivery_fee) || 0;
  const total = Number(order.total) || subtotal - discount + deliveryFee;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-[#0e1a12]/40 hover:text-[#0e1a12] transition-colors"
              aria-label="Back to orders"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#0e1a12]">Order #{order.order_number}</h1>
            <Badge status={order.status} />
          </div>
          <p className="text-sm text-[#0e1a12]/50 mt-1 ml-8">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-BD', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="sm:ml-auto">
          <InvoiceDownloadButton order={order} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0e1a12]">Order Items</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item, idx) => {
                const unitPrice = item.sale_price ?? item.price ?? 0;
                return (
                  <div key={item.id ?? idx} className="flex items-center gap-4 px-6 py-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[#1a5c38]/10 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0e1a12] truncate">{item.name}</p>
                      <p className="text-xs text-[#0e1a12]/50 mt-0.5">
                        {[item.color, item.size].filter(Boolean).join(' · ')} · Qty: {item.qty}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{formatCurrency(unitPrice * item.qty)}</p>
                      <p className="text-xs text-[#0e1a12]/50">{formatCurrency(unitPrice)} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm text-[#0e1a12]/70">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#0e1a12]/70">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#0e1a12] pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-[#0e1a12] mb-4">Payment Information</h2>
            <InfoRow
              label="Method"
              value={PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
            />
            <InfoRow label="Sender Number" value={order.payment_sender_number} />
            <InfoRow label="Transaction ID" value={order.payment_trx_id} />
            <InfoRow label="Note" value={order.payment_note} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-[#0e1a12] mb-4">Customer</h2>
            <InfoRow label="Name" value={order.customer_name} />
            <InfoRow label="Phone" value={order.customer_phone} />
            <InfoRow label="Email" value={order.customer_email} />
            <InfoRow label="Address" value={order.customer_address} />
            <InfoRow
              label="District"
              value={order.district === 'dhaka' ? 'Dhaka' : 'Outside Dhaka'}
            />
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-[#0e1a12]">Update Status</h2>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] bg-white"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={statusLoading || newStatus === order.status}
              className="w-full bg-[#1a5c38] text-white font-semibold py-2.5 rounded-lg hover:bg-[#2a7d50] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {statusLoading ? 'Updating…' : 'Update Status'}
            </button>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-semibold text-[#0e1a12] mb-2">Order Notes</h2>
              <p className="text-sm text-[#0e1a12]/70">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
