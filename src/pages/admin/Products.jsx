import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useToast } from '../../components/Toast';

export default function Products() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  async function loadAll(searchVal) {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (searchVal) query = query.ilike('name', `%${searchVal}%`);
    const { data } = await query;
    setProducts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll('');
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setSearchTerm(searchInput);
    loadAll(searchInput);
  }

  async function handleToggleActive(product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    if (error) {
      toast.error('Failed to update product.');
    } else {
      toast.success(`Product ${product.is_active ? 'deactivated' : 'activated'}.`);
      loadAll(searchTerm);
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete product.');
    } else {
      toast.success('Product deleted.');
      setDeleteTarget(null);
      loadAll(searchTerm);
  }

  const isLoading = loading;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="flex-1 border border-[#0e1a12]/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] focus:border-transparent bg-white"
          />
          <button
            type="submit"
            className="bg-[#1a5c38] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2a7d50] transition-colors shrink-0"
          >
            Search
          </button>
        </form>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="inline-flex items-center gap-2 bg-[#c9f230] text-[#0e1a12] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-lime-300 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0e1a12]">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-[#0e1a12]/40">
            <p className="font-medium">No products found</p>
            <button
              onClick={() => navigate('/admin/products/new')}
              className="mt-4 text-sm text-[#1a5c38] font-semibold hover:underline"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-[#0e1a12]/50 uppercase tracking-wide">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#1a5c38]/10 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-[#0e1a12]">{product.name}</p>
                          {product.featured && (
                            <span className="text-xs text-[#1a5c38] font-medium">Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#0e1a12]/60 capitalize">
                      {product.category || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">
                        {formatCurrency(product.sale_price ?? product.price)}
                      </span>
                      {product.sale_price && (
                        <span className="ml-2 text-xs text-[#0e1a12]/40 line-through">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={product.is_active ? 'success' : 'error'}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-[#0e1a12]/20 text-[#0e1a12]/60 hover:bg-gray-100 transition-colors"
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-[#1a5c38]/30 text-[#1a5c38] hover:bg-[#1a5c38]/5 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-[#0e1a12]/70">
          Are you sure you want to delete{' '}
          <strong className="text-[#0e1a12]">{deleteTarget?.name}</strong>? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
