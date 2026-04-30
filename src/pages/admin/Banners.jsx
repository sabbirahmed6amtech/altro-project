import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useToast } from '../../components/Toast';

const BANNER_TYPES = [
  { value: 'hero_slide', label: 'Hero Slide' },
  { value: 'promo_banner', label: 'Promo Banner' },
  { value: 'category_banner', label: 'Category Banner' },
  { value: 'sale_banner', label: 'Sale Banner' },
];

const EMPTY_FORM = {
  type: 'hero_slide',
  title: '',
  image_url: '',
  cta_text: '',
  cta_url: '',
  sort_order: 0,
  is_active: true,
};

export default function Banners() {
  const { toast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadBanners() {
    setLoading(true);
    let query = supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (typeFilter) query = query.eq('type', typeFilter);
    const { data } = await query;
    setBanners(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadBanners();
  }, [typeFilter]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(banner) {
    setForm({
      type: banner.type ?? 'hero_slide',
      title: banner.title ?? '',
      image_url: banner.image_url ?? '',
      cta_text: banner.cta_text ?? '',
      cta_url: banner.cta_url ?? '',
      sort_order: banner.sort_order ?? 0,
      is_active: banner.is_active ?? true,
    });
    setEditId(banner.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.image_url.trim()) {
      toast.error('Image URL is required.');
      return;
    }
    setSaving(true);
    const payload = {
      type: form.type,
      title: form.title.trim() || null,
      image_url: form.image_url.trim(),
      cta_text: form.cta_text.trim() || null,
      cta_url: form.cta_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const { error } = editId
      ? await supabase.from('banners').update(payload).eq('id', editId)
      : await supabase.from('banners').insert([payload]);

    if (error) {
      toast.error('Failed to save banner.');
    } else {
      toast.success(editId ? 'Banner updated.' : 'Banner created.');
      setModalOpen(false);
      loadBanners();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('banners').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete banner.');
    } else {
      toast.success('Banner deleted.');
      setDeleteTarget(null);
      loadBanners();
    }
    setDeleteLoading(false);
  }

  async function handleToggleActive(banner) {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);
    if (error) {
      toast.error('Failed to update banner.');
    } else {
      loadBanners();
    }
  }

  const inputClass =
    'w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]';

  const typeLabel = (type) =>
    BANNER_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] bg-white flex-1 sm:flex-none sm:w-48"
        >
          <option value="">All Types</option>
          {BANNER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={openCreate}
          className="sm:ml-auto inline-flex items-center gap-2 bg-[#c9f230] text-[#0e1a12] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-lime-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Banner
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0e1a12]">
            {banners.length} banner{banners.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 text-[#0e1a12]/40">
            <p className="font-medium">No banners found</p>
            <button onClick={openCreate} className="mt-2 text-sm text-[#1a5c38] font-semibold hover:underline">
              Add your first banner
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {banners.map((banner) => (
              <div key={banner.id} className="flex items-center gap-4 px-6 py-4">
                {banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={banner.title ?? ''}
                    className="w-20 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-12 rounded-lg bg-[#1a5c38]/10 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0e1a12] truncate">
                    {banner.title || <span className="text-[#0e1a12]/40 italic">No title</span>}
                  </p>
                  <p className="text-xs text-[#0e1a12]/50 mt-0.5">
                    {typeLabel(banner.type)} · Sort: {banner.sort_order ?? 0}
                  </p>
                </div>
                <Badge variant={banner.is_active ? 'success' : 'error'}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#0e1a12]/20 text-[#0e1a12]/60 hover:bg-gray-100 transition-colors"
                  >
                    {banner.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEdit(banner)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#1a5c38]/30 text-[#1a5c38] hover:bg-[#1a5c38]/5 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(banner)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Banner' : 'New Banner'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save Banner</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className={inputClass}
            >
              {BANNER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              placeholder="Banner title (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">Image URL *</label>
            <input
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              className={inputClass}
              placeholder="https://…"
            />
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Preview"
                className="mt-2 h-24 rounded-lg object-cover w-full"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">CTA Text</label>
              <input
                value={form.cta_text}
                onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
                className={inputClass}
                placeholder="Shop Now"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">CTA URL</label>
              <input
                value={form.cta_url}
                onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))}
                className={inputClass}
                placeholder="/products"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">Sort Order</label>
            <input
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              className={inputClass}
              placeholder="0"
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
        title="Delete Banner"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-[#0e1a12]/70">
          Delete <strong className="text-[#0e1a12]">{deleteTarget?.title || 'this banner'}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
