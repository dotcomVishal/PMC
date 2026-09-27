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
      // Pinning the hero section
      ScrollTrigger.create({
        trigger: container.current,
        start: 'top top',
        end: '+=100%',
        pin: true,
        pinSpacing: true,
      });

      // Parallax and fade effect on text
      gsap.to(textRef.current, {
        y: -150,
        opacity: 0,
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Parallax on background image
      gsap.to(bgRef.current, {
        y: 200,
        scale: 1.1,
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
      
      // Initial Reveal Animation
      gsap.from(textRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 bg-cover bg-center"
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
