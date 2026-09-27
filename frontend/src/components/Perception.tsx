import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play } from 'lucide-react';
import FilmStrip from './FilmStrip';

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
    { title: "Hello", award: "Inter-IIT Silver Medal (8.0)", image: "https://img.youtube.com/vi/d1UZLb5YJrM/maxresdefault.jpg", link: "https://youtu.be/d1UZLb5YJrM?si=orIrGgTnN9EEBCKR" },
    { title: "Euphony", award: "Inter-IIT Submission (7.0)", image: "https://img.youtube.com/vi/MM1IH3QYjh0/maxresdefault.jpg", link: "https://youtu.be/MM1IH3QYjh0?si=a5d1k_bkc1ztexLc" }
  ];

  return (
    <section ref={container} className="pt-40 pb-24 px-6 md:px-12 bg-background relative overflow-hidden min-h-screen">
      <FilmStrip position="both" />
      
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
            <a href="https://www.youtube.com/@PerceptionIITMandi/" target="_blank" rel="noreferrer" className="p-3 border border-secondary/30 hover:border-primary rounded-full hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
            <a href="https://www.instagram.com/perception_iitmandi/" target="_blank" rel="noreferrer" className="p-3 border border-secondary/30 hover:border-primary rounded-full hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {movies.map((movie, i) => (
            <a href={movie.link} target="_blank" rel="noreferrer" key={i} className="video-card group cursor-pointer relative aspect-video bg-surface overflow-hidden rounded-md border border-white/5 block">
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
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
