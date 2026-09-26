import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const members = [
  { name: "Aarav Sharma", role: "Coordinator", division: "Core" },
  { name: "Diya Patel", role: "Head of Photography", division: "Shutterbugs" },
  { name: "Rohan Gupta", role: "Head of Videography", division: "Perception" },
  { name: "Ananya Singh", role: "Editor", division: "Perception" },
  { name: "Kabir Das", role: "Photographer", division: "Shutterbugs" },
  { name: "Meera Reddy", role: "Creative Director", division: "Core" }
];

const filters = ["All", "Core", "Shutterbugs", "Perception"];

export default function Team() {
  const container = useRef(null);
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredMembers = activeFilter === "All" 
    ? members 
    : members.filter(m => m.division === activeFilter);

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
    <section ref={container} className="py-24 px-6 md:px-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-display mb-12 text-primary text-center">The Team</h2>
        
        <div className="flex justify-center gap-4 mb-16 flex-wrap">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter 
                  ? "bg-white text-black" 
                  : "bg-transparent text-secondary border border-secondary/30 hover:border-white hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member, i) => (
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
