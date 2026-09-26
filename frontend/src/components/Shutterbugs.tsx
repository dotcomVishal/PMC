import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const images = [
  "https://images.unsplash.com/photo-1516224584288-5f917573d82f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=800&auto=format&fit=crop"
];

export default function Shutterbugs() {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".gallery-item", {
        y: 100,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 70%",
        }
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="py-24 px-6 md:px-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <h2 className="text-5xl md:text-7xl font-display mb-4 text-primary">Shutterbugs</h2>
            <p className="text-secondary max-w-xl text-lg">
              Capturing fleeting moments and transforming them into timeless visual artistry. 
              The photography division of PMC.
            </p>
          </div>
          <a 
            href="https://instagram.com/shutterbugs_iitmandi" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 mt-6 md:mt-0 px-6 py-3 border border-secondary/30 hover:border-primary hover:bg-primary hover:text-background transition-all duration-300 rounded-full font-medium"
          >
            <Instagram size={20} />
            <span>@shutterbugs_iitmandi</span>
          </a>
        </div>
        
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((src, i) => (
            <div key={i} className="gallery-item break-inside-avoid overflow-hidden rounded-sm group relative">
              <img 
                src={src} 
                alt={`Photography ${i}`} 
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
