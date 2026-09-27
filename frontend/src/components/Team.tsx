import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FilmStrip from './FilmStrip';

gsap.registerPlugin(ScrollTrigger);

const members = [
  { name: "Aarav Sharma", role: "Coordinator" },
  { name: "Diya Patel", role: "Head of Photography" },
  { name: "Rohan Gupta", role: "Head of Videography" },
  { name: "Ananya Singh", role: "Editor" },
  { name: "Kabir Das", role: "Photographer" },
  { name: "Meera Reddy", role: "Creative Director" }
];

export default function Team() {
  const container = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".team-card", 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container.current,
            start: "top 80%",
          }
        }
      );
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="pt-40 pb-24 px-6 md:px-12 bg-surface min-h-screen relative overflow-hidden">
      <FilmStrip position="bottom" />
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-5xl md:text-7xl font-display mb-16 text-primary text-center">The Team</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, i) => (
            <div key={`${member.name}-${i}`} className="team-card bg-background p-8 rounded-sm border border-white/5 hover:border-white/20 transition-colors group">
              <div className="w-20 h-20 bg-surface rounded-full mb-6 overflow-hidden">
                {/* Placeholder for member image */}
                <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 group-hover:scale-110 transition-transform duration-500"></div>
              </div>
              <h3 className="text-xl font-medium text-white mb-1">{member.name}</h3>
              <p className="text-sm text-secondary uppercase tracking-widest">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
