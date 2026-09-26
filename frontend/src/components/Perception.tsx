import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Youtube, Instagram, Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Perception() {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".video-card", {
        scale: 0.9,
        opacity: 0,
        stagger: 0.2,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 70%",
        }
      });
    }, container);
    return () => ctx.revert();
  }, []);

  const movies = [
    { title: "Blink", award: "Inter-IIT Gold Medal", image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=800&auto=format&fit=crop" },
    { title: "Sapne", award: "Inter-IIT Silver Medal", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop" }
  ];

  return (
    <section ref={container} className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
      {/* Decorative film strips */}
      <div className="absolute top-0 left-0 w-full h-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMWExYTFhIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMwYTBhMGEiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="max-w-7xl mx-auto relative z-10 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-16">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-display mb-4 text-primary">Perception</h2>
            <p className="text-secondary text-lg">
              Visual storytelling, narrative fiction, and documentary filmmaking. 
              The movie making division of PMC.
            </p>
          </div>
          <div className="flex gap-4 mt-6 md:mt-0">
            <a href="https://youtube.com/perception_iitmandi" target="_blank" rel="noreferrer" className="p-3 border border-secondary/30 hover:border-primary rounded-full hover:bg-white/10 transition-colors">
              <Youtube size={24} />
            </a>
            <a href="https://instagram.com/perception_iitmandi" target="_blank" rel="noreferrer" className="p-3 border border-secondary/30 hover:border-primary rounded-full hover:bg-white/10 transition-colors">
              <Instagram size={24} />
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {movies.map((movie, i) => (
            <div key={i} className="video-card group cursor-pointer relative aspect-video bg-surface overflow-hidden rounded-md border border-white/5">
              <img 
                src={movie.image} 
                alt={movie.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                  <Play fill="white" size={24} className="ml-1" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 p-6 w-full">
                <p className="text-sm text-yellow-500 font-medium mb-2 uppercase tracking-widest">{movie.award}</p>
                <h3 className="text-4xl font-display text-white">{movie.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
