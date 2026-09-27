import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pmcBg from '../images/pmc.png';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const container = useRef(null);
  const textRef = useRef(null);
  const frameRef = useRef(null);
  const navRef = useRef(null);
  const lensRef = useRef(null);
  const cursorRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle custom cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update cursor position smoothly
  useEffect(() => {
    gsap.to(cursorRef.current, {
      x: mousePos.x - 24, // center the 48px cursor
      y: mousePos.y - 24,
      duration: 0.1,
      ease: "power2.out"
    });
  }, [mousePos]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        }
      });

      tl
        // 1. Zoom into the initial text and fade out
        .to(textRef.current, { 
          scale: 5, 
          opacity: 0, 
          ease: "power2.inOut",
          force3D: true 
        }, 0)
        
        // 2. The entire lens mechanism rotates and scales outward immensely
        .to(lensRef.current, { 
          rotation: 180, 
          scale: 30, // scale up until the hole is bigger than the screen
          opacity: 0,
          ease: "power2.inOut",
          force3D: true 
        }, 0.1)

        // 3. The framed image comes from the dark distance into focus
        .fromTo(frameRef.current, 
          { 
            scale: 0.3, 
            opacity: 0, 
            y: 100,
            filter: "grayscale(100%) blur(10px)" 
          },
          { 
            scale: 1, 
            opacity: 1, 
            y: 0,
            filter: "grayscale(20%) blur(0px)",
            ease: "power2.out",
            force3D: true 
          }, 0.3
        )

        // 4. Reveal the navigation buttons prominently over the frame
        .fromTo(navRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, ease: "power2.out" },
          0.7 // towards the very end of the scroll
        );

    }, container);
    return () => ctx.revert();
  }, []);



  return (
    <>
      {/* Custom Camera Focus Cursor */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-12 h-12 pointer-events-none z-[100] mix-blend-difference opacity-50"
      >
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
      </div>

      {/* Global Film Grain Overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>

      {/* 400vh for long scroll distance */}
      <main ref={container} className="relative h-[400vh] w-full bg-[#050505] cursor-none">
        
        {/* Sticky viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {/* Layer 1: The Framed Photo (Final State) */}
          <div ref={frameRef} className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none p-4 md:p-12">
            <div className="relative bg-[#1a1a1a] p-3 md:p-6 pb-12 md:pb-24 shadow-2xl border border-white/10 rounded-sm w-full max-w-5xl pointer-events-auto">
              <img 
                src={pmcBg} 
                alt="PMC Core Team" 
                className="w-full h-auto max-h-[70vh] object-contain rounded-sm"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 font-display tracking-[0.3em] text-sm md:text-xl uppercase">
                PMC IIT Mandi
              </div>
            </div>
          </div>

          {/* Layer 2: Nav Links that fade in over the photo */}
          <div ref={navRef} className="absolute z-10 bottom-12 md:bottom-24 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-4 md:gap-8 opacity-0 pointer-events-auto w-full px-4">
            {['Shutterbugs', 'Perception', 'Team'].map((page) => (
              <Link 
                key={page}
                to={`/${page.toLowerCase()}`}
                className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 rounded-full font-medium tracking-widest uppercase text-xs md:text-sm shadow-xl"
              >
                Explore {page}
              </Link>
            ))}
          </div>

          {/* Layer 3: Mechanical Camera Lens / Aperture */}
          <div ref={lensRef} className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            
            {/* The Lens Barrel / Focus Rings */}
            <div className="absolute w-[40vw] h-[40vw] rounded-full flex items-center justify-center">
              
              {/* Outer tick marks */}
              <div className="absolute inset-[-10%] rounded-full border-[2px] border-dashed border-white/20 animate-[spin_30s_linear_infinite]"></div>
              
              {/* Aperture Hole with Infinite Dark Shroud */}
              <div className="w-[15vw] h-[15vw] rounded-full shadow-[0_0_0_200vw_#050505] border-[4px] border-[#333] relative flex items-center justify-center bg-transparent">
                {/* Inner glass reflection */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent mix-blend-overlay rotate-45"></div>
              </div>
              
            </div>

          </div>

          {/* Layer 4: Initial Text */}
          <div ref={textRef} className="relative z-30 text-center px-4 flex flex-col items-center pointer-events-none mix-blend-difference text-white">
            <div className="mb-8 flex items-center gap-4 text-white/50">
              <span className="w-12 h-[1px] bg-white/30"></span>
              <p className="text-xs uppercase tracking-[0.5em]">Focus</p>
              <span className="w-12 h-[1px] bg-white/30"></span>
            </div>
            <h1 className="text-6xl md:text-[10vw] font-display uppercase tracking-widest drop-shadow-2xl leading-none">
              PMC
            </h1>
            <p className="mt-8 text-xs md:text-sm text-white/70 max-w-xl mx-auto font-light tracking-[0.2em] uppercase border border-white/20 px-6 py-2 rounded-full animate-pulse">
              Scroll to Open Lens
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
