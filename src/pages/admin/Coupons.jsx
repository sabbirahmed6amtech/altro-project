import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCoupons } from '../../hooks/useCoupons';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useToast } from '../../components/Toast';

const EMPTY_FORM = {
  code: '',
  discount_type: 'percent',
  discount_value: '',
  min_order: '',
  is_active: true,
  expires_at: '',
};

export default function Coupons() {
  const { coupons, loading, refresh } = useCoupons();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(coupon) {
    setForm({
      code: coupon.code ?? '',
      discount_type: coupon.discount_type ?? 'percent',
      discount_value: coupon.discount_value ?? '',
      min_order: coupon.min_order ?? '',
      is_active: coupon.is_active ?? true,
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
    });
    setEditId(coupon.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.discount_value) {
      toast.error('Code and discount value are required.');
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order: form.min_order ? Number(form.min_order) : null,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
    };
    const { error } = editId
      ? await supabase.from('coupons').update(payload).eq('id', editId)
      : await supabase.from('coupons').insert([payload]);

    if (error) {
      toast.error('Failed to save coupon.');
    } else {
      toast.success(editId ? 'Coupon updated.' : 'Coupon created.');
      setModalOpen(false);
      refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('coupons').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete coupon.');
    } else {
      toast.success('Coupon deleted.');
      setDeleteTarget(null);
      refresh();
    }
    setDeleteLoading(false);
  }

  const inputClass =
    'w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]';

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#c9f230] text-[#0e1a12] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-lime-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0e1a12]">
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 text-[#0e1a12]/40">
            <p className="font-medium">No coupons yet</p>
            <button onClick={openCreate} className="mt-2 text-sm text-[#1a5c38] font-semibold hover:underline">
              Create your first coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-[#0e1a12]/50 uppercase tracking-wide">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Min. Order</th>
                  <th className="px-6 py-3">Expires</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1a5c38] font-mono tracking-wide">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {coupon.discount_type === 'percent'
                        ? `${coupon.discount_value}%`
                        : formatCurrency(coupon.discount_value)}
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/60">
                      {coupon.min_order ? formatCurrency(coupon.min_order) : '—'}
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/60">
                      {coupon.expires_at
                        ? new Date(coupon.expires_at).toLocaleDateString('en-BD')
                        : 'No expiry'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={coupon.is_active ? 'success' : 'error'}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-[#1a5c38]/30 text-[#1a5c38] hover:bg-[#1a5c38]/5 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(coupon)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Coupon' : 'New Coupon'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save Coupon</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">Code *</label>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className={inputClass}
              placeholder="SAVE20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                className={inputClass}
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (৳)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                Value *
              </label>
              <input
                type="number"
                min="0"
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                className={inputClass}
                placeholder={form.discount_type === 'percent' ? '10' : '100'}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
              Minimum Order (৳)
            </label>
            <input
              type="number"
              min="0"
              value={form.min_order}
              onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
              Expiry Date
            </label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 accent-[#1a5c38]"
            />
            <span className="text-sm font-medium text-[#0e1a12]">Active</span>
          </label>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Coupon"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-[#0e1a12]/70">
          Delete coupon <strong className="text-[#0e1a12]">{deleteTarget?.code}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
