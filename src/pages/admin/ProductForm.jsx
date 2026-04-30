import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import { useToast } from '../../components/Toast';

const CATEGORIES = ['panjabi', 'shirts', 't-shirts', 'bottoms', 'accessories'];

function ArrayField({ label, fields, append, remove, register, fieldKey, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">{label}</label>
      <div className="space-y-2">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex gap-2">
            <input
              {...register(`${fieldKey}.${idx}.value`)}
              placeholder={placeholder}
              className="flex-1 border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="px-2 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Remove"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ value: '' })}
          className="text-sm text-[#1a5c38] font-medium hover:underline"
        >
          + Add {label.toLowerCase().replace(' *', '')}
        </button>
      </div>
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const imageInputRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      price: '',
      sale_price: '',
      stock: '',
      category: '',
      tags: [],
      colors: [],
      sizes: [],
      images: [],
      is_active: true,
      is_featured: false,
    },
  });

  const tagsField = useFieldArray({ control, name: 'tags' });
  const colorsField = useFieldArray({ control, name: 'colors' });
  const sizesField = useFieldArray({ control, name: 'sizes' });
  const imagesField = useFieldArray({ control, name: 'images' });

  useEffect(() => {
    if (!isEdit) return;
    async function loadProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        toast.error('Product not found.');
        navigate('/admin/products');
        return;
      }
      reset({
        name: data.name ?? '',
        slug: data.slug ?? '',
        description: data.description ?? '',
        price: data.price ?? '',
        sale_price: data.sale_price ?? '',
        stock: data.stock ?? '',
        category: data.category ?? '',
        tags: (data.tags ?? []).map((v) => ({ value: v })),
        colors: (data.colors ?? []).map((v) => ({ value: v })),
        sizes: (data.sizes ?? []).map((v) => ({ value: v })),
        images: (data.images ?? []).map((v) => ({ value: v })),
        is_active: data.is_active ?? true,
        is_featured: data.is_featured ?? false,
      });
    }
    loadProduct();
  }, [id, isEdit, navigate, reset, toast]);

  function generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  async function onSubmit(values) {
    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim() || generateSlug(values.name),
      description: values.description.trim() || null,
      price: Number(values.price),
      sale_price: values.sale_price ? Number(values.sale_price) : null,
      stock: values.stock !== '' ? Number(values.stock) : 0,
      category: values.category || null,
      tags: values.tags.map((t) => t.value).filter(Boolean),
      colors: values.colors.map((c) => c.value).filter(Boolean),
      sizes: values.sizes.map((s) => s.value).filter(Boolean),
      images: values.images.map((i) => i.value).filter(Boolean),
      is_active: values.is_active,
      is_featured: values.is_featured,
    };

    if (isEdit) {
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) {
        toast.error('Failed to update product.');
        return;
      }
      toast.success('Product updated successfully.');
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) {
        toast.error('Failed to create product.');
        return;
      }
      toast.success('Product created successfully.');
    }
    navigate('/admin/products');
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const invalid = files.find((f) => !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024);
    if (invalid) {
      toast.error('Images must be image files under 5MB each.');
      return;
    }
    setImageUploading(true);
    const currentImages = watch('images') ?? [];
    const newImages = [...currentImages];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('products')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        toast.error(`Failed to upload ${file.name}.`);
        continue;
      }
      const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
      newImages.push({ value: urlData.publicUrl });
    }
    setValue('images', newImages, { shouldDirty: true });
    setImageUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  const inputClass =
    'w-full border border-[#0e1a12]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38] focus:border-transparent';

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="text-[#0e1a12]/40 hover:text-[#0e1a12] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#0e1a12]">
          {isEdit ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Basic Information</h2>

          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
              Product Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              className={inputClass}
              placeholder="e.g. Classic Cotton Panjabi"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
              Slug
            </label>
            <input
              {...register('slug')}
              className={inputClass}
              placeholder="auto-generated if left blank"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className={inputClass}
              placeholder="Product description…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                Price (৳) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be positive' } })}
                className={inputClass}
                placeholder="0"
              />
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
                Sale Price (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('sale_price')}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
              Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              {...register('stock', { required: 'Stock is required', min: { value: 0, message: 'Stock cannot be negative' } })}
              className={inputClass}
              placeholder="0"
            />
            {errors.stock && (
              <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0e1a12] mb-1.5">
              Category
            </label>
            <select {...register('category')} className={inputClass}>
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Variants & Tags</h2>

          <ArrayField
            label="Colors"
            fields={colorsField.fields}
            append={colorsField.append}
            remove={colorsField.remove}
            register={register}
            fieldKey="colors"
            placeholder="e.g. White"
          />
          <ArrayField
            label="Sizes"
            fields={sizesField.fields}
            append={sizesField.append}
            remove={sizesField.remove}
            register={register}
            fieldKey="sizes"
            placeholder="e.g. M"
          />
          <ArrayField
            label="Tags"
            fields={tagsField.fields}
            append={tagsField.append}
            remove={tagsField.remove}
            register={register}
            fieldKey="tags"
            placeholder="e.g. new-arrival"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0e1a12]">Images</h2>

          {/* Upload button */}
          <div>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageUploading}
              className="flex items-center gap-2 border-2 border-dashed border-[#1a5c38]/30 rounded-xl px-4 py-3 text-sm text-[#1a5c38] font-medium hover:border-[#1a5c38] hover:bg-[#1a5c38]/5 transition-all disabled:opacity-60 w-full justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {imageUploading ? 'Uploading…' : 'Upload Images'}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-[#0e1a12]/40 mt-1.5">Upload images to Supabase Storage (max 5MB each). First image is the primary.</p>
          </div>

          {/* Image previews + URL list */}
          {imagesField.fields.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {imagesField.fields.map((field, idx) => {
                const url = watch(`images.${idx}.value`);
                return (
                  <div key={field.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-[#0e1a12]/10">
                      {url ? (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#0e1a12]/20">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                          </svg>
                        </div>
                      )}
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-[#1a5c38] text-white text-xs px-1.5 py-0.5 rounded font-medium">Primary</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => imagesField.remove(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <ArrayField
            label="Or paste Image URLs"
            fields={imagesField.fields}
            append={imagesField.append}
            remove={imagesField.remove}
            register={register}
            fieldKey="images"
            placeholder="https://…"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#0e1a12]">Settings</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_active')}
              className="w-4 h-4 accent-[#1a5c38]"
            />
            <span className="text-sm font-medium text-[#0e1a12]">Active (visible on store)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_featured')}
              className="w-4 h-4 accent-[#1a5c38]"
            />
            <span className="text-sm font-medium text-[#0e1a12]">Featured product</span>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/admin/products')} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
