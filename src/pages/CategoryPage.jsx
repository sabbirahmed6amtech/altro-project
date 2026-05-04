import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../store/Navbar';
import CartDrawer from '../store/CartDrawer';
import CheckoutModal from '../store/CheckoutModal';
import ProductCard from '../store/ProductCard';
import Footer from '../store/Footer';
import { useProducts } from '../hooks/useProducts';
import { useBanners } from '../hooks/useBanners';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[4/5] bg-[#1a5c38]/8" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-[#1a5c38]/8 rounded-full w-1/3" />
        <div className="h-3.5 bg-[#1a5c38]/8 rounded-full w-4/5" />
        <div className="h-3.5 bg-[#1a5c38]/8 rounded-full w-1/2" />
      </div>
    </div>
  );
}

const normalize = (s) => s?.toLowerCase().replace(/\s+/g, '-') ?? '';

export default function CategoryPage() {
  const { slug } = useParams();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  const { banners: categoryBanners } = useBanners('category_banner');
  const matchingBanner = categoryBanners.find((b) => normalize(b.title) === slug);

  const displayName = matchingBanner?.title ??
    slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const { products, loading, total, hasMore, loadMore } = useProducts({
    category: slug,
    pageSize: 12,
  });

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <Helmet>
        <title>{displayName} — Altro</title>
        <meta name="description" content={`Shop ${displayName} at Altro — quality attire from Bangladesh.`} />
      </Helmet>

      <Navbar onCartClick={() => setCartOpen(true)} />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

      {/* Category hero */}
      {matchingBanner?.image_url ? (
        <div className="relative w-full" style={{ aspectRatio: '3/1', minHeight: '160px' }}>
          <img
            src={matchingBanner.image_url}
            alt={displayName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1a12]/70 via-[#0e1a12]/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-16">
            <nav className="flex items-center gap-2 text-white/55 text-xs mb-3">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white">{displayName}</span>
            </nav>
            <p className="text-[#c9f230] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Category</p>
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl text-white font-bold leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              {displayName}
            </h1>
            {!loading && (
              <p className="text-white/60 text-sm mt-1.5">{total} products</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#1a5c38] px-6 sm:px-10 md:px-16 pt-12 pb-10">
          <nav className="flex items-center gap-2 text-white/50 text-xs mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white">{displayName}</span>
          </nav>
          <p className="text-[#c9f230] text-[10px] font-bold tracking-[0.2em] uppercase mb-2">Category</p>
          <h1 className="font-display text-3xl md:text-5xl text-white font-bold">{displayName}</h1>
          {!loading && (
            <p className="text-white/55 text-sm mt-2">{total} products</p>
          )}
        </div>
      )}

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {loading && products.length === 0
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-full bg-[#1a5c38]/8 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#1a5c38]/35" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-[#0e1a12]/50 font-medium">No products in this category yet</p>
            <Link to="/" className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#1a5c38] font-semibold hover:underline">
              ← Back to home
            </Link>
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={loadMore}
              disabled={loading}
              className="inline-flex items-center gap-2.5 px-8 py-3 border-2 border-[#1a5c38] text-[#1a5c38] text-sm font-semibold rounded-full hover:bg-[#1a5c38] hover:text-white transition-all duration-200 disabled:opacity-40 group"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  Load More
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
