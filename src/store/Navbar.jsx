import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from './cartStore';
import { useSettings } from '../hooks/useSettings';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/#products', label: 'Products' },
  { to: '/track', label: 'Track Order' },
];

export default function Navbar({ onCartClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { getSetting } = useSettings();
  const location = useLocation();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0));

  const announcementEnabled = getSetting('announcement_bar_enabled', false);
  const announcementText = getSetting('announcement_bar_text', 'Free delivery on orders over ৳999');
  const logoUrl = getSetting('logo_url', '');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (to) => {
    if (to.includes('#')) {
      const [path, hash] = to.split('#');
      return location.pathname === (path || '/') && location.hash === `#${hash}`;
    }
    if (to === '/') return location.pathname === '/' && !location.hash;
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* Announcement Bar */}
      {announcementEnabled && (
        <div className="bg-[#1a5c38] text-[#c9f230] text-center py-2 px-4 text-sm font-medium tracking-wide">
          {announcementText}
        </div>
      )}

      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-40 bg-[#f5f2eb] transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="ALTRO" className="h-9 w-auto object-contain" />
              ) : (
                <span className="font-display text-2xl font-bold tracking-widest text-[#1a5c38]">
                  ALTRO
                </span>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition-colors duration-150 ${
                    isActive(to)
                      ? 'text-[#1a5c38] border-b-2 border-[#1a5c38] pb-0.5'
                      : 'text-[#0e1a12] hover:text-[#1a5c38]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Cart + Hamburger */}
            <div className="flex items-center gap-3">
              {/* Cart button */}
              <button
                onClick={onCartClick}
                aria-label="Open cart"
                className="relative p-2 rounded-full hover:bg-[#1a5c38]/10 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-[#0e1a12]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#c9f230] text-[#0e1a12] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="md:hidden p-2 rounded-full hover:bg-[#1a5c38]/10 transition-colors"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6 text-[#0e1a12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-[#0e1a12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#1a5c38]/10 bg-[#f5f2eb] shadow-lg">
            <nav className="flex flex-col py-2">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'text-[#1a5c38] bg-[#1a5c38]/5 border-l-2 border-[#1a5c38]'
                      : 'text-[#0e1a12] hover:text-[#1a5c38] hover:bg-[#1a5c38]/5'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
