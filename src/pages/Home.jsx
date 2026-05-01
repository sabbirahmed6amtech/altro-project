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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    title: 'Free Delivery',
    desc: 'On orders over ৳999',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Easy Returns',
    desc: '7-day hassle free returns',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: 'Premium Quality',
    desc: 'Finest fabric & craftsmanship',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: '24/7 Support',
    desc: 'Always here to help you',
  },
];

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

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [newsletterError, setNewsletterError] = useState(false);

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
    setNewsletterError(false);
    const email = newsletterEmail.trim().toLowerCase();

    const { data: existing } = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      setNewsletterLoading(false);
      setNewsletterDone(true);
      setNewsletterEmail('');
      return;
    }

    const { error } = await supabase
      .from('subscribers')
      .insert([{ email }]);
    setNewsletterLoading(false);
    if (error) {
      setNewsletterError(true);
    } else {
      setNewsletterDone(true);
      setNewsletterEmail('');
    }
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

      {/* ── Hero ── */}
      <div className="relative">
        <HeroBanner slides={heroSlides} />
      </div>

      {/* ── Marquee Strip ── */}
      <div className="bg-[#1a5c38] overflow-hidden py-2.5 border-y border-[#0e1a12]/10">
        <div
          className="flex whitespace-nowrap text-[#c9f230] font-semibold text-[11px] tracking-[0.25em] uppercase"
          style={{ animation: 'marquee 28s linear infinite' }}
        >
          {[...Array(4)].map((_, i) => (
            <span key={i} className="inline-flex items-center gap-6 px-6" aria-hidden={i > 0}>
              <span>ALTRO</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
              <span>QUALITY ATTIRE</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
              <span>BANGLADESH</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
              <span>NEW COLLECTION</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
            </span>
          ))}
          {[...Array(4)].map((_, i) => (
            <span key={`b${i}`} className="inline-flex items-center gap-6 px-6" aria-hidden>
              <span>ALTRO</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
              <span>QUALITY ATTIRE</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
              <span>BANGLADESH</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
              <span>NEW COLLECTION</span>
              <span className="w-1 h-1 rounded-full bg-[#c9f230]/50 inline-block" />
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* ── USP Strip — moved up, tighter & more refined ── */}
      <section className="bg-white border-b border-[#1a5c38]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1a5c38]/8">
            {USP_ITEMS.map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-5 md:p-6">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#1a5c38]/8 flex items-center justify-center text-[#1a5c38]">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-[#0e1a12] text-sm leading-tight">{item.title}</p>
                  <p className="text-[#0e1a12]/45 text-xs mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo Banners ── */}
      {promobanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#1a5c38]">
              Featured
            </h2>
            <span className="h-px flex-1 mx-4 bg-[#1a5c38]/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {promobanners.slice(0, 3).map((banner, idx) => (
              <a
                key={banner.id ?? idx}
                href={banner.cta_url ?? '#'}
                className="relative block rounded-xl overflow-hidden group"
                style={{ aspectRatio: '4/3' }}
              >
                {banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={banner.title ?? ''}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a5c38]" />
                )}
                {/* Gradient overlay — bottom-weighted, more cinematic */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {banner.title && (
                    <h3 className="text-white font-bold text-lg leading-tight mb-2">{banner.title}</h3>
                  )}
                  {banner.cta_text && (
                    <span className="inline-flex items-center gap-1.5 bg-[#c9f230] text-[#0e1a12] text-xs font-bold px-3.5 py-1.5 rounded-full">
                      {banner.cta_text}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Category Carousel ── */}
      <section className="pt-12 pb-4" id="categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categoryBanners.length > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#1a5c38] shrink-0">
                  Shop by Category
                </h2>
                <span className="h-px flex-1 bg-[#1a5c38]/10" />
              </div>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
                {categoryBanners.map((cat, idx) => (
                  <a
                    key={cat.id ?? idx}
                    href="/#products"
                    className="flex flex-col items-center gap-2.5 shrink-0 group"
                  >
                    <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-[#1a5c38]/8 ring-2 ring-transparent group-hover:ring-[#c9f230] transition-all duration-300">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.title ?? ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1a5c38]/15 flex items-center justify-center text-xl">👕</div>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-[#0e1a12]/60 group-hover:text-[#1a5c38] transition-colors tracking-wide uppercase">
                      {cat.title}
                    </span>
                  </a>
                ))}
              </div>
            </>
          ) : (
            // Fallback pill tabs shown inline with Products section below
            null
          )}
        </div>
      </section>

      {/* ── Products Section ── */}
      <section id="products" className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="flex items-center gap-4 mb-7">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1a5c38] mb-1">
                Fresh in
              </p>
              <h2 className="text-2xl font-bold text-[#0e1a12] leading-none">New Arrivals</h2>
            </div>
            <span className="h-px flex-1 bg-[#1a5c38]/10 mt-4" />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-7">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === cat
                    ? 'bg-[#1a5c38] text-white shadow-md shadow-[#1a5c38]/20'
                    : 'bg-white text-[#0e1a12]/55 hover:text-[#1a5c38] border border-[#1a5c38]/12 hover:border-[#1a5c38]/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {loading && products.length === 0
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full bg-[#1a5c38]/8 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#1a5c38]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-[#0e1a12]/50 font-medium text-sm">No products in this category</p>
              <p className="text-[#0e1a12]/30 text-xs mt-1">Try browsing a different category</p>
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
                    View More
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Sale Banner ── */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {saleBanner ? (
            <a
              href={saleBanner.cta_url ?? '#'}
              className="relative block rounded-2xl overflow-hidden group"
              style={{ aspectRatio: '21/7' }}
            >
              <img
                src={saleBanner.image_url}
                alt={saleBanner.title ?? 'Sale'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0e1a12]/85 via-[#1a5c38]/60 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14">
                <p className="text-[#c9f230] text-xs font-bold tracking-[0.2em] uppercase mb-2">Limited Time</p>
                <h3 className="text-white text-3xl md:text-5xl font-bold mb-4 leading-tight">
                  {saleBanner.title ?? 'End of Season Sale'}
                </h3>
                {saleBanner.cta_text && (
                  <span className="inline-flex items-center gap-2 bg-[#c9f230] text-[#0e1a12] font-bold px-6 py-2.5 rounded-full text-sm w-fit">
                    {saleBanner.cta_text}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>
            </a>
          ) : (
            <div
              className="relative bg-[#1a5c38] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:px-14 md:py-12 gap-6"
            >
              {/* Decorative circle */}
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute right-24 -bottom-10 w-40 h-40 rounded-full bg-[#c9f230]/10 pointer-events-none" />

              <div className="relative z-10">
                <p className="text-[#c9f230] text-xs font-bold tracking-[0.2em] uppercase mb-2">Limited Time</p>
                <h3 className="text-white text-3xl md:text-4xl font-bold leading-tight">
                  End of Season<br />Sale
                </h3>
                <p className="text-white/60 text-sm mt-2">Up to 50% off on selected items</p>
              </div>
              <a
                href="#products"
                className="relative z-10 shrink-0 bg-[#c9f230] text-[#0e1a12] font-bold px-7 py-3 rounded-full text-sm inline-flex items-center gap-2 hover:bg-lime-300 transition-colors"
              >
                Shop the Sale
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-16 bg-[#0e1a12]">
        <div className="max-w-lg mx-auto px-4 text-center">
          <p className="text-[#c9f230] text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Stay Connected</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Stay in the Loop</h2>
          <p className="text-white/40 text-sm mb-8">
            Get the latest arrivals, exclusive offers and style tips — straight to your inbox.
          </p>
          {newsletterDone ? (
            <div className="inline-flex items-center gap-2 bg-[#c9f230]/10 text-[#c9f230] font-semibold text-sm px-5 py-3 rounded-full border border-[#c9f230]/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              You're subscribed — welcome aboard!
            </div>
          ) : (
            <>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterError(false); }}
                  placeholder="your@email.com"
                  className="flex-1 bg-white/8 border border-white/12 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c9f230]/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="bg-[#c9f230] text-[#0e1a12] font-bold px-5 py-2.5 rounded-full text-sm hover:bg-lime-300 transition-colors shrink-0 disabled:opacity-50"
                >
                  {newsletterLoading ? '…' : 'Subscribe'}
                </button>
              </form>
              {newsletterError && (
                <p className="text-red-400 text-xs mt-3">Something went wrong. Please try again.</p>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
