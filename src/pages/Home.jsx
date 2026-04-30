import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import Navbar from '../store/Navbar';
import CartDrawer from '../store/CartDrawer';
import HeroBanner from '../store/HeroBanner';
import ProductCard from '../store/ProductCard';
import Footer from '../store/Footer';
import CheckoutModal from '../store/CheckoutModal';
import { useProducts } from '../hooks/useProducts';
import { useBanners } from '../hooks/useBanners';

const CATEGORIES = ['All', 'Panjabi', 'Shirts', 'T-Shirts', 'Bottoms'];

const USP_ITEMS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    title: 'Free Delivery',
    desc: 'On orders over ৳999',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Easy Returns',
    desc: '7-day hassle free returns',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: 'Premium Quality',
    desc: 'Finest fabric & craftsmanship',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: '24/7 Support',
    desc: 'Always here to help you',
  },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[4/5] bg-[#1a5c38]/10" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#1a5c38]/10 rounded w-1/3" />
        <div className="h-4 bg-[#1a5c38]/10 rounded w-4/5" />
        <div className="h-4 bg-[#1a5c38]/10 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);

  const { banners: heroSlides } = useBanners('hero_slide');
  const { banners: promobanners } = useBanners('promo_banner');
  const { banners: categoryBanners } = useBanners('category_banner');
  const { banners: saleBanners } = useBanners('sale_banner');

  const categoryFilter = activeTab === 'All' ? undefined : activeTab.toLowerCase();
  const { products, loading, hasMore, loadMore } = useProducts({
    category: categoryFilter,
    pageSize: 8,
  });

  const saleBanner = saleBanners?.[0] ?? null;

  async function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    await supabase
      .from('subscribers')
      .upsert([{ email: newsletterEmail.trim().toLowerCase() }], { onConflict: 'email', ignoreDuplicates: true });
    setNewsletterLoading(false);
    setNewsletterDone(true);
    setNewsletterEmail('');
  }

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <Helmet>
        <title>Altro — Quality Attire Bangladesh</title>
        <meta name="description" content="Shop premium Bangladeshi clothing at Altro. Quality panjabis, shirts, t-shirts and more with fast delivery." />
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

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />

      {/* Hero */}
      <HeroBanner slides={heroSlides} />

      {/* Marquee Strip */}
      <div className="bg-[#1a5c38] overflow-hidden py-3">
        <div
          className="flex whitespace-nowrap text-[#c9f230] font-bold text-sm tracking-widest uppercase"
          style={{ animation: 'marquee 20s linear infinite' }}
        >
          <span className="inline-block">
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
          </span>
          <span className="inline-block" aria-hidden="true">
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
            {'ALTRO · QUALITY ATTIRE · BANGLADESH · '}
          </span>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* Promo Banners */}
      {promobanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promobanners.slice(0, 3).map((banner, idx) => (
              <a
                key={banner.id ?? idx}
                href={banner.cta_url ?? '#'}
                className="relative block h-48 md:h-64 rounded-2xl overflow-hidden group"
              >
                {banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={banner.title ?? ''}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a5c38]" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  {banner.title && (
                    <h3 className="text-white font-bold text-xl mb-2">{banner.title}</h3>
                  )}
                  {banner.cta_text && (
                    <span className="inline-block bg-[#c9f230] text-[#0e1a12] text-sm font-bold px-4 py-1.5 rounded-full">
                      {banner.cta_text}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* USP Strip */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {USP_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center p-4 gap-2">
                <div className="text-[#1a5c38]">{item.icon}</div>
                <p className="font-semibold text-[#0e1a12] text-sm">{item.title}</p>
                <p className="text-[#0e1a12]/50 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Carousel */}
      <section className="py-8" id="categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categoryBanners.length > 0 ? (
            <>
              <h2 className="text-lg font-bold text-[#0e1a12] mb-4">Shop by Category</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {categoryBanners.map((cat, idx) => (
                  <a
                    key={cat.id ?? idx}
                    href={`/#products`}
                    className="flex flex-col items-center gap-2 shrink-0 group"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1a5c38]/10 border-2 border-transparent group-hover:border-[#c9f230] transition-all">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.title ?? ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1a5c38]/20 flex items-center justify-center text-2xl">
                          👕
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#0e1a12] group-hover:text-[#1a5c38] transition-colors">
                      {cat.title}
                    </span>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                    activeTab === cat
                      ? 'bg-[#1a5c38] text-white border-[#1a5c38]'
                      : 'border-[#1a5c38]/20 text-[#0e1a12] hover:border-[#1a5c38]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0e1a12]">New Arrivals</h2>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === cat
                    ? 'bg-[#1a5c38] text-white shadow-sm'
                    : 'bg-white text-[#0e1a12]/60 hover:text-[#1a5c38] hover:bg-white shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading && products.length === 0
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-16 text-[#0e1a12]/40">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try a different category</p>
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 border-2 border-[#1a5c38] text-[#1a5c38] font-semibold rounded-full hover:bg-[#1a5c38] hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Loading…
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Sale Banner */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {saleBanner ? (
            <a
              href={saleBanner.cta_url ?? '#'}
              className="relative block rounded-2xl overflow-hidden h-48 md:h-64 group"
            >
              <img
                src={saleBanner.image_url}
                alt={saleBanner.title ?? 'Sale'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#1a5c38]/70 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-white text-2xl md:text-4xl font-bold mb-3">
                  {saleBanner.title ?? 'End of Season Sale'}
                </h3>
                {saleBanner.cta_text && (
                  <span className="bg-[#c9f230] text-[#0e1a12] font-bold px-6 py-2 rounded-full text-sm">
                    {saleBanner.cta_text}
                  </span>
                )}
              </div>
            </a>
          ) : (
            <div className="bg-[#1a5c38] rounded-2xl h-48 md:h-64 flex flex-col items-center justify-center text-center p-6">
              <h3 className="text-white text-2xl md:text-4xl font-bold mb-3">
                End of Season Sale
              </h3>
              <p className="text-white/70 mb-5">Up to 50% off on selected items</p>
              <a
                href="#products"
                className="bg-[#c9f230] text-[#0e1a12] font-bold px-6 py-2.5 rounded-full text-sm hover:bg-lime-300 transition-colors"
              >
                Shop the Sale
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-[#f5f2eb]">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[#0e1a12] mb-2">Stay in the Loop</h2>
          <p className="text-[#0e1a12]/60 text-sm mb-6">
            Subscribe to get the latest arrivals, offers and style tips.
          </p>
          {newsletterDone ? (
            <p className="text-[#1a5c38] font-semibold text-sm">
              ✓ Thank you for subscribing!
            </p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 border border-[#1a5c38]/20 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a5c38] bg-white"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-[#1a5c38] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#2a7d50] transition-colors shrink-0 disabled:opacity-60"
              >
                {newsletterLoading ? '…' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
