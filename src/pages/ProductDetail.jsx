import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProducts } from '../hooks/useProducts';
import Navbar from '../store/Navbar';
import CartDrawer from '../store/CartDrawer';
import Footer from '../store/Footer';
import CheckoutModal from '../store/CheckoutModal';
import ProductCard from '../store/ProductCard';
import { useCartStore } from '../store/cartStore';
import { formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  useEffect(() => {
    if (!zoomOpen) return;
    const len = product?.images?.length ?? 0;
    const handleKey = (e) => {
      if (e.key === 'Escape') setZoomOpen(false);
      if (e.key === 'ArrowLeft' && len > 1) setMainImageIdx((i) => (i - 1 + len) % len);
      if (e.key === 'ArrowRight' && len > 1) setMainImageIdx((i) => (i + 1) % len);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomOpen, product?.images?.length]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    setProduct(null);
    setMainImageIdx(0);

    supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setProduct(data);
          setSelectedColor(data.colors?.[0] ?? '');
          setSelectedSize(data.sizes?.[0] ?? '');
        }
        setLoading(false);
      });
  }, [slug]);

  const { products: relatedProducts } = useProducts({
    category: product?.category,
    pageSize: 5,
  });
  const related = relatedProducts.filter((p) => p.id !== product?.id).slice(0, 4);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedColor && product.colors?.length > 0) {
      toast.error('Please select a color');
      return;
    }
    if (!selectedSize && product.sizes?.length > 0) {
      toast.error('Please select a size');
      return;
    }
    setAddingToCart(true);
    addItem(product, selectedColor, selectedSize, qty);
    toast.success('Added to cart!');
    setTimeout(() => setAddingToCart(false), 800);
  };

  const images = product?.images ?? [];
  const displayPrice = product?.sale_price ?? product?.price ?? 0;
  const hasSale = product?.sale_price != null && product.sale_price < product.price;
  const outOfStock = product?.stock === 0;

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <Helmet>
        <title>
          {product ? `${product.name} — Altro Clothing` : 'Altro Clothing'}
        </title>
        {product?.description && (
          <meta name="description" content={product.description.slice(0, 160)} />
        )}
      </Helmet>

      <Navbar onCartClick={() => setCartOpen(true)} />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      )}

      {/* Not Found */}
      {!loading && notFound && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <p className="text-4xl">😕</p>
          <h1 className="text-xl font-bold text-[#0e1a12]">Product Not Found</h1>
          <p className="text-[#0e1a12]/60 text-sm">
            This product doesn't exist or may have been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a5c38] text-white font-semibold rounded-lg hover:bg-[#2a7d50] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      )}

      {/* Product */}
      {!loading && product && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[#0e1a12]/40 mb-6">
            <Link to="/" className="hover:text-[#1a5c38]">Home</Link>
            <span>/</span>
            <Link to="/#products" className="hover:text-[#1a5c38]">Products</Link>
            <span>/</span>
            <span className="text-[#0e1a12]/70">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Images */}
            <div className="space-y-3">
              {/* Main Image */}
              <div
                className={`aspect-square rounded-2xl overflow-hidden bg-[#1a5c38]/10 relative ${images.length > 0 ? 'cursor-zoom-in' : ''}`}
                onClick={() => images.length > 0 && setZoomOpen(true)}
              >
                {images.length > 0 ? (
                  <img
                    key={mainImageIdx}
                    src={images[mainImageIdx]}
                    alt={`${product.name} - image ${mainImageIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-[#1a5c38]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {images.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/30 rounded-full p-1.5 pointer-events-none">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Image Zoom Lightbox */}
              {zoomOpen && images.length > 0 && (
                <div
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                  onClick={() => setZoomOpen(false)}
                >
                  <button
                    onClick={() => setZoomOpen(false)}
                    className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors z-10"
                    aria-label="Close zoom"
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <img
                    src={images[mainImageIdx]}
                    alt={product.name}
                    className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMainImageIdx((i) => (i - 1 + images.length) % images.length); }}
                        className="absolute left-4 p-2 text-white/60 hover:text-white transition-colors"
                        aria-label="Previous image"
                      >
                        <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMainImageIdx((i) => (i + 1) % images.length); }}
                        className="absolute right-4 p-2 text-white/60 hover:text-white transition-colors"
                        aria-label="Next image"
                      >
                        <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setMainImageIdx(idx); }}
                            className={`w-2 h-2 rounded-full transition-all ${idx === mainImageIdx ? 'bg-white scale-125' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImageIdx(idx)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === mainImageIdx
                          ? 'border-[#1a5c38] shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="flex flex-col gap-4">
              {/* Category */}
              {product.category && (
                <span className="text-xs font-semibold uppercase tracking-widest text-[#1a5c38]">
                  {product.category}
                </span>
              )}

              {/* Name */}
              <h1 className="font-display text-3xl font-bold text-[#0e1a12] leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {hasSale ? (
                  <>
                    <span className="text-2xl font-bold text-[#1a5c38]">
                      {formatCurrency(product.sale_price)}
                    </span>
                    <span className="text-lg text-[#0e1a12]/40 line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      {Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#0e1a12]">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              {/* Short Description */}
              {product.description && (
                <p className="text-[#0e1a12]/70 text-sm leading-relaxed">
                  {product.description.length > 200
                    ? product.description.slice(0, 200) + '…'
                    : product.description}
                </p>
              )}

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#0e1a12] mb-2">
                    Color:{' '}
                    <span className="font-normal text-[#0e1a12]/60">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${
                          selectedColor === color
                            ? 'border-[#1a5c38] bg-[#1a5c38] text-white'
                            : 'border-[#1a5c38]/20 text-[#0e1a12] hover:border-[#1a5c38]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#0e1a12] mb-2">
                    Size:{' '}
                    <span className="font-normal text-[#0e1a12]/60">{selectedSize}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[44px] px-3 py-1.5 rounded-lg text-sm border-2 font-semibold transition-all ${
                          selectedSize === size
                            ? 'border-[#1a5c38] bg-[#1a5c38] text-white'
                            : 'border-[#1a5c38]/20 text-[#0e1a12] hover:border-[#1a5c38]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="text-sm font-semibold text-[#0e1a12] mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full border-2 border-[#1a5c38]/20 flex items-center justify-center text-[#1a5c38] hover:bg-[#1a5c38] hover:text-white hover:border-[#1a5c38] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-lg font-bold text-[#0e1a12] w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-9 h-9 rounded-full border-2 border-[#1a5c38]/20 flex items-center justify-center text-[#1a5c38] hover:bg-[#1a5c38] hover:text-white hover:border-[#1a5c38] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stock */}
              {outOfStock ? (
                <p className="text-sm font-semibold text-red-500">Out of Stock</p>
              ) : product.stock != null && product.stock <= 10 ? (
                <p className="text-sm font-semibold text-orange-500">
                  In Stock ({product.stock} left)
                </p>
              ) : (
                <p className="text-sm text-green-600 font-medium">In Stock</p>
              )}

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || addingToCart}
                className={`w-full py-3.5 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                  outOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : addingToCart
                    ? 'bg-[#c9f230] text-[#0e1a12]'
                    : 'bg-[#1a5c38] text-white hover:bg-[#2a7d50]'
                }`}
              >
                {addingToCart ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>

              <Link
                to="/"
                className="text-center text-sm text-[#1a5c38] hover:underline"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>


          {/* Related Products */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-[#0e1a12] mb-5">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
