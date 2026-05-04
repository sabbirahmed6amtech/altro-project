import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const AUTOPLAY_INTERVAL = 5000;

const ANIMATION_CSS = `
  @keyframes heroBgZoom {
    from { transform: scale(1); }
    to   { transform: scale(1.08); }
  }
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hero-img-zoom { animation: heroBgZoom 6s ease forwards; }
  .hero-title    { animation: heroFadeUp 0.55s ease both; }
  .hero-sub      { animation: heroFadeUp 0.55s ease 0.12s both; }
  .hero-cta      { animation: heroFadeUp 0.55s ease 0.24s both; }
`;

export default function HeroBanner({ slides = [] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);

  const count = slides.length;
  const hasSlides = count > 0;

  const goTo = useCallback((idx) => {
    setCurrent(idx);
    setProgress(0);
  }, []);

  const next = useCallback(() => goTo((current + 1) % (count || 1)), [current, count, goTo]);
  const prev = useCallback(() => goTo((current - 1 + (count || 1)) % (count || 1)), [current, count, goTo]);

  useEffect(() => {
    if (!hasSlides || paused) return;
    intervalRef.current = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [hasSlides, paused, next]);

  useEffect(() => {
    if (!hasSlides || paused) { setProgress(0); return; }
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / AUTOPLAY_INTERVAL) * 100, 100));
    }, 40);
    return () => clearInterval(progressRef.current);
  }, [current, hasSlides, paused]);

  useEffect(() => { setCurrent(0); }, [slides]);

  if (!hasSlides) {
    return (
      <section
        className="relative overflow-hidden bg-[#1a5c38] w-full"
        style={{ aspectRatio: '3/1', minHeight: '200px' }}
      >
        <div className="absolute inset-0 bg-[url('/src/assets/hero.png')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 h-full flex items-center px-6 sm:px-10 md:px-16">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl text-white font-bold leading-tight mb-2 md:mb-3" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              ALTRO Clothing
            </h1>
            <p className="text-sm md:text-lg text-white/80 mb-4 md:mb-6" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
              Quality Attire from Bangladesh
            </p>
            <Link
              to="/#products"
              className="inline-flex items-center gap-2 bg-[#c9f230] text-[#0e1a12] font-bold px-5 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-lime-300 transition-colors text-xs sm:text-sm"
            >
              Shop Now
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section
      className="relative overflow-hidden bg-[#0e1a12] w-full"
      style={{ aspectRatio: '3/1', minHeight: '200px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{ANIMATION_CSS}</style>

      {/* Slides */}
      {slides.map((s, idx) => (
        <div
          key={s.id ?? idx}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={idx !== current}
        >
          {s.image_url ? (
            <img
              key={`img-${idx}-${current === idx}`}
              src={s.image_url}
              alt={s.title ?? ''}
              className={`w-full h-full object-cover ${idx === current ? 'hero-img-zoom' : ''}`}
            />
          ) : (
            <div className="w-full h-full bg-[#1a5c38]" />
          )}
        </div>
      ))}

      {/* Slide content — key forces remount + re-animation on every slide change */}
      <div key={current} className="relative z-20 h-full flex items-center px-6 sm:px-10 md:px-16 lg:px-20">
        <div className="max-w-xs sm:max-w-sm md:max-w-lg">
          {slide.title && (
            <h1 className="hero-title font-display text-xl sm:text-2xl md:text-4xl lg:text-5xl text-white font-bold leading-tight mb-1.5 md:mb-3" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.55)' }}>
              {slide.title}
            </h1>
          )}
          {slide.subtitle && (
            <p className="hero-sub text-xs sm:text-sm md:text-lg text-white mb-3 md:mb-6" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>
              {slide.subtitle}
            </p>
          )}
          {slide.cta_text && slide.cta_url && (
            <div className="hero-cta">
              {slide.cta_url.startsWith('/') ? (
                <Link
                  to={slide.cta_url}
                  className="inline-flex items-center gap-2 bg-[#c9f230] text-[#0e1a12] font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-lime-300 transition-colors text-xs sm:text-sm"
                >
                  {slide.cta_text}
                  <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <a
                  href={slide.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#c9f230] text-[#0e1a12] font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-lime-300 transition-colors text-xs sm:text-sm"
                >
                  {slide.cta_text}
                  <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prev arrow */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-sm flex items-center justify-center border border-white/20"
      >
        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-sm flex items-center justify-center border border-white/20"
      >
        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Progress bar + dots row */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        {/* Progress bar */}
        <div className="h-0.5 bg-white/15">
          <div
            className="h-full bg-[#c9f230] transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dots */}
        {count > 1 && (
          <div className="flex justify-end gap-1.5 px-4 py-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  idx === current
                    ? 'w-5 h-1.5 bg-[#c9f230]'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
