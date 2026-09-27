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

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // Smooth, heavy scrub for cinematic feel
        }
      });

      // Pure, clean 3D depth scroll
      tl
        // 1. Text flies towards the camera and fades out
        .to(textRef.current, { 
          scale: 10, 
          opacity: 0, 
          ease: "power3.in",
          force3D: true 
        }, 0)
        
        // 2. The Media (Image/Video) scales up smoothly from the deep background
        .fromTo(mediaRef.current,
          { 
            scale: 0.4, 
            opacity: 0.1,
            y: 50,
          },
          {
            scale: 1.1, // Slight overflow for parallax effect
            opacity: 1,
            y: 0,
            ease: "power2.out",
            force3D: true
          }, 0
        )
        
        // 3. Dark overlay fades out as the image gets closer
        .to(overlayRef.current, {
          opacity: 0,
          ease: "power2.out"
        }, 0);

    }, container);
    return () => ctx.revert();
  }, []);

  return (
    // 300vh for a perfect, deliberate scroll distance
    <main ref={container} className="relative h-[300vh] w-full bg-[#030303]">
      
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Layer 1: Media Container (Image / Future Video) */}
        {/* Note: This is ready for a 3D video. Just swap the img for a video tag! */}
        <div ref={mediaRef} className="absolute inset-0 z-0 flex items-center justify-center p-4 md:p-8">
          <div className="relative w-full h-full max-w-7xl shadow-[0_0_100px_rgba(0,0,0,1)] rounded-md overflow-hidden border border-white/5">
            <img 
              src={pmcBg} 
              alt="PMC Core Team" 
              className="w-full h-full object-cover object-center"
            />
            {/* Dark overlay to simulate depth fading */}
            <div ref={overlayRef} className="absolute inset-0 bg-black/80"></div>
          </div>
        </div>

        {/* Layer 2: Clean Typography */}
        <div ref={textRef} className="relative z-10 text-center px-4 flex flex-col items-center mix-blend-difference text-white pointer-events-none">
          <h1 className="text-7xl md:text-[12vw] font-display uppercase tracking-[0.1em] drop-shadow-2xl leading-none font-bold">
            PMC
          </h1>
          <p className="mt-6 text-sm md:text-xl text-white/80 max-w-xl mx-auto font-light tracking-[0.4em] uppercase">
            Scroll to Explore
          </p>
        </div>

      </div>
    </main>
  );
}
