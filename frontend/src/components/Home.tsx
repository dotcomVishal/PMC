import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pmcBg from '../images/pmc.png';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const container = useRef(null);
  const textRef = useRef(null);
  const mediaRef = useRef(null);
  const overlayRef = useRef(null);
  const edgeTextRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2, // increased for smoother effect
        }
      });

      tl
        .to(textRef.current, { scale: 60, opacity: 0, ease: "power3.in", force3D: true }, 0)
        .fromTo(mediaRef.current, { scale: 0.4, opacity: 0.1, y: 50 }, { scale: 1.1, opacity: 1, y: 0, ease: "power2.out", force3D: true }, 0)
        .to(overlayRef.current, { opacity: 0, ease: "power2.out" }, 0)
        .to(edgeTextRef.current, { opacity: 1, ease: "power2.inOut" }, 0.15)
        .set(document.querySelector('#navbar-content'), { opacity: 0 }, 0)
        .to(document.querySelector('#navbar-content'), { opacity: 1, ease: "power2.inOut" }, 0.15);

    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={container} className="relative h-[300vh] w-full bg-[#030303]">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* EDGE TEXT LAYER */}
        <div ref={edgeTextRef} className="absolute inset-0 z-20 pointer-events-none opacity-0 flex items-center justify-center p-4 md:p-8 will-change-[opacity,transform]">
          
          {/* THE FIX: We perfectly mirror the image's max-w-7xl size. 
              We will anchor the text directly to the outside of this box. */}
          <div className="relative w-full h-full max-w-7xl">
            
            {/* TOP/LEFT EDGE TEXT */}
            <div className="absolute top-0 left-0 right-0 h-[40px] mt-24 md:mt-0 md:top-0 md:bottom-0 md:right-full md:left-auto md:w-[120px] md:h-auto md:mr-6 flex items-center justify-center mix-blend-screen opacity-50">
              <div className="whitespace-nowrap scale-y-[1.8] rotate-0 md:-rotate-90 origin-center transition-transform">
                <span className="text-white font-display font-bold text-4xl md:text-5xl xl:text-[70px] tracking-tighter">
                  CHOOSE PASSION
                </span>
              </div>
            </div>

            {/* BOTTOM/RIGHT EDGE TEXT */}
            <div className="absolute bottom-0 left-0 right-0 h-[40px] mb-24 md:mb-0 md:top-0 md:bottom-0 md:left-full md:right-auto md:w-[120px] md:h-auto md:ml-6 flex items-center justify-center mix-blend-screen opacity-50">
              <div className="whitespace-nowrap scale-y-[1.8] rotate-0 md:rotate-90 origin-center transition-transform">
                <span className="text-white font-display font-bold text-4xl md:text-5xl xl:text-[70px] tracking-tighter">
                  CHOOSE PMC
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* LAYER 1: MEDIA CONTAINER */}
        <div ref={mediaRef} className="absolute inset-0 z-10 flex items-center justify-center p-4 md:p-8 will-change-transform">
          <div className="relative w-full h-full max-w-7xl bg-black shadow-[0_0_100px_rgba(0,0,0,1)] rounded-md overflow-hidden border border-white/5">
            <img 
              src={pmcBg} 
              alt="PMC Core Team" 
              className="w-full h-full object-contain object-center will-change-transform"
            />
            <div ref={overlayRef} className="absolute inset-0 bg-black/80 will-change-[opacity]"></div>
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