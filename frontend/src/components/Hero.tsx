import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pmcBg from '../images/pmc.png';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const container = useRef(null);
  const textRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create a single timeline for the pinned hero section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: '+=100%',
          scrub: 1, // Add a slight smoothing to the scrub
          pin: true,
        }
      });

      // Parallax text and background simultaneously
      tl.to(textRef.current, { 
        y: -150, 
        opacity: 0,
        force3D: true 
      }, 0)
      .to(bgRef.current, { 
        y: 150, 
        scale: 1.05,
        force3D: true 
      }, 0);
      
      // Initial Reveal Animation
      gsap.from(textRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        force3D: true
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 bg-cover bg-center will-change-transform"
        style={{ backgroundImage: `url(${pmcBg})` }}
      >
        <div className="absolute inset-0 bg-background/40"></div>
      </div>
      
      <div ref={textRef} className="relative z-10 text-center px-4">
        <h1 className="text-6xl md:text-9xl font-display mb-4 text-white uppercase tracking-widest drop-shadow-2xl">
          PMC IIT Mandi
        </h1>
        <p className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto font-light">
          Photography and Movie Making Club. Visual storytelling through the lens.
        </p>
      </div>
    </section>
  );
}
