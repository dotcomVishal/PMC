import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Camera } from 'lucide-react';
import img1 from '../images/lrm1.jpg';
import img2 from '../images/lrm2.jpg';
import img3 from '../images/lrm3.jpg';
import img4 from '../images/vishal_action.jpeg';
import img5 from '../images/adit.webp';
import shutterbugsLogo from '../images/shutterbugs.jpg';
import FilmStrip from './FilmStrip';

gsap.registerPlugin(ScrollTrigger);

const images = [img1, img2, img3, img4, img5];

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
    <section ref={container} className="pt-40 pb-24 px-6 md:px-12 bg-surface min-h-screen relative overflow-hidden">
      <FilmStrip position="top" />
      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <div className="flex items-center gap-6 mb-4">
              <div className="mix-blend-screen flex-shrink-0">
                <img src={shutterbugsLogo} alt="Shutterbugs Logo" className="w-16 h-16 md:w-24 md:h-24 invert object-contain" />
              </div>
              <h2 className="text-5xl md:text-7xl font-display text-primary">Shutterbugs</h2>
            </div>
            <p className="text-secondary max-w-xl text-lg">
              Capturing fleeting moments and transforming them into timeless visual artistry. 
              The photography division of PMC.
            </p>
          </div>
          <a 
            href="https://www.instagram.com/shutterbugs.iitmandi/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 mt-6 md:mt-0 px-6 py-3 border border-secondary/30 hover:border-primary hover:bg-primary hover:text-background transition-all duration-300 rounded-full font-medium"
          >
            <Camera size={20} />
            <span>@shutterbugs.iitmandi</span>
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
