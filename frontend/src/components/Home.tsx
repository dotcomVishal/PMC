import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pmcBg from '../images/pmc.png';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const edgeTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const navbarContent = document.querySelector('#navbar-content');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2, // Smooth, cinematic follow effect
        }
      });

      tl
        .to(textRef.current, { scale: 50, opacity: 0, ease: "power3.in", force3D: true }, 0)
        .fromTo(mediaRef.current, { scale: 0.5, opacity: 0.1, y: 40 }, { scale: 1, opacity: 1, y: 0, ease: "power2.out", force3D: true }, 0)
        .to(overlayRef.current, { opacity: 0, ease: "power2.out" }, 0)
        .to(edgeTextRef.current, { opacity: 1, ease: "power2.inOut" }, 0.15);

      if (navbarContent) {
        tl.set(navbarContent, { opacity: 0 }, 0)
          .to(navbarContent, { opacity: 1, ease: "power2.inOut" }, 0.15);
      }

    }, container);

    return () => {
      ctx.revert();
      if (navbarContent) {
        gsap.set(navbarContent, { clearProps: 'opacity' });
      }
    };
  }, []);

  return (
    <main ref={container} className="relative h-[300vh] w-full bg-[#030303]">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* EDGE TEXT LAYER: Centered vertically in screen margins, never overlapping media */}
        <div ref={edgeTextRef} className="absolute inset-0 z-20 pointer-events-none opacity-0 will-change-[opacity]">
          
          {/* LEFT EDGE TEXT */}
          <div className="hidden lg:flex absolute left-4 xl:left-8 2xl:left-12 top-0 bottom-0 w-20 items-center justify-center select-none">
            <div className="whitespace-nowrap -rotate-90 origin-center transition-transform scale-y-[1.4]">
              <span className="text-white/40 font-display font-bold text-3xl md:text-4xl xl:text-5xl tracking-[0.25em]">
                CHOOSE PASSION
              </span>
            </div>
          </div>

          {/* RIGHT EDGE TEXT */}
          <div className="hidden lg:flex absolute right-4 xl:right-8 2xl:right-12 top-0 bottom-0 w-20 items-center justify-center select-none">
            <div className="whitespace-nowrap rotate-90 origin-center transition-transform scale-y-[1.4]">
              <span className="text-white/40 font-display font-bold text-3xl md:text-4xl xl:text-5xl tracking-[0.25em]">
                CHOOSE PMC
              </span>
            </div>
          </div>

        </div>

        {/* LAYER 1: MEDIA CONTAINER */}
        <div ref={mediaRef} className="absolute inset-0 z-10 flex items-center justify-center p-4 md:p-8 will-change-transform">
          <div className="relative w-full h-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl bg-[#030303] flex items-center justify-center overflow-hidden">
            <img 
              src={pmcBg} 
              alt="PMC Core Team" 
              className="w-full h-full object-contain object-center will-change-transform [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_95%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_95%)]"
              loading="eager"
            />
            {/* Soft vignette to blend photo backdrop seamlessly into website background */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,#030303_95%)]"></div>
            <div ref={overlayRef} className="absolute inset-0 bg-[#030303]/80 will-change-[opacity]"></div>
          </div>
        </div>

        {/* LAYER 2: CLEAN TYPOGRAPHY */}
        <div ref={textRef} className="relative z-10 text-center px-4 flex flex-col items-center mix-blend-difference text-white pointer-events-none will-change-[transform,opacity]">
          <h1 className="text-7xl md:text-[12vw] font-display uppercase tracking-[0.1em] drop-shadow-2xl leading-none font-bold">
            PMC
          </h1>
          <p className="mt-4 md:mt-6 text-[10px] sm:text-xs md:text-base lg:text-xl text-white/80 max-w-2xl mx-auto font-light tracking-[0.2em] md:tracking-[0.4em] uppercase text-center px-4">
            Photography and Movie-Making Club
          </p>
        </div>

      </div>
    </main>
  );
}