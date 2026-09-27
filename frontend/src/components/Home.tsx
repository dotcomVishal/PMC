import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pmcBg from '../images/pmc.png';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const container = useRef(null);
  const stickyRef = useRef(null);
  const textRef = useRef(null);
  const bgRef = useRef(null);
  const lensRef1 = useRef(null);
  const lensRef2 = useRef(null);
  const apertureRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 3D Z-axis Scroll Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5, // smooth scrubbing
        }
      });

      // Initially, lens is "closed" (aperture is small).
      // Text is normal. Image is normal.

      tl
        // 1. Text scales up massively and fades out (moving "past" the camera)
        .to(textRef.current, { 
          scale: 15, 
          opacity: 0, 
          ease: "power2.in",
          force3D: true 
        }, 0)
        
        // 2. Lens assembly: Rings rotate and scale up massively
        .to(lensRef1.current, { 
          rotation: 90, 
          scale: 15,
          opacity: 0,
          force3D: true 
        }, 0)
        .to(lensRef2.current, { 
          rotation: -90, 
          scale: 20,
          opacity: 0,
          force3D: true 
        }, 0)
        .to(apertureRef.current, {
          scale: 25, // Aperture opens up (hole gets huge)
          opacity: 0,
          force3D: true
        }, 0.1)

        // 3. Background Image zooms in slowly (Z-axis translation)
        .fromTo(bgRef.current, 
          { scale: 1, filter: "grayscale(100%) contrast(1.2) brightness(0.5)" },
          { 
            scale: 1.5, 
            filter: "grayscale(50%) contrast(1.1) brightness(1)", // Slowly reveal true colors/brightness
            ease: "power1.inOut",
            force3D: true 
          }, 0
        );

    }, container);
    return () => ctx.revert();
  }, []);

  return (
    // 400vh gives us plenty of scroll distance for the effect
    <main ref={container} className="relative h-[400vh] w-full bg-black">
      
      {/* Sticky viewport */}
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Layer 1: Background Image */}
        <div 
          ref={bgRef}
          className="absolute inset-0 z-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url(${pmcBg})` }}
        >
        </div>

        {/* Layer 2: Camera Lens / Aperture simulation */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          {/* Outer Lens Ring */}
          <div 
            ref={lensRef1}
            className="absolute w-[60vw] h-[60vw] border-[1px] border-white/20 rounded-full flex items-center justify-center border-dashed"
          ></div>
          {/* Inner Lens Ring */}
          <div 
            ref={lensRef2}
            className="absolute w-[40vw] h-[40vw] border-[2px] border-white/10 rounded-full flex items-center justify-center"
          >
            <div className="w-[38vw] h-[38vw] border-[1px] border-white/30 rounded-full border-dotted"></div>
          </div>
          {/* The Aperture / Shutter Blade (simplified as a heavy dark ring that scales out) */}
          <div 
            ref={apertureRef}
            className="absolute w-[20vw] h-[20vw] rounded-full shadow-[0_0_0_100vw_#0a0a0a]"
          ></div>
        </div>

        {/* Layer 3: Text content */}
        <div ref={textRef} className="relative z-20 text-center px-4 flex flex-col items-center">
          <p className="text-sm md:text-base text-secondary uppercase tracking-[0.5em] mb-4">Focus</p>
          <h1 className="text-6xl md:text-[10vw] font-display text-white uppercase tracking-widest drop-shadow-2xl leading-none">
            PMC IIT Mandi
          </h1>
          <p className="mt-6 text-sm md:text-lg text-secondary max-w-xl mx-auto font-light tracking-wide">
            Scroll to enter the lens.
          </p>
        </div>

      </div>
    </main>
  );
}
