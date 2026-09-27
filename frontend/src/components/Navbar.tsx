import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Navbar() {
  const location = useLocation();
  
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Shutterbugs', path: '/shutterbugs' },
    { name: 'Perception', path: '/perception' },
    { name: 'Team', path: '/team' }
  ];

  const navRef = useRef(null);

  useEffect(() => {
    if (location.pathname === '/') {
      // Hide initially on home page, then fade in after 2 seconds or on scroll
      gsap.set(navRef.current, { opacity: 0, y: -50 });
      
      const ctx = gsap.context(() => {
        gsap.to(navRef.current, {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.5, // Just fade it in cleanly after load
          ease: "power3.out"
        });
      });
      return () => ctx.revert();
    } else {
      gsap.set(navRef.current, { opacity: 1, y: 0 });
    }
  }, [location.pathname]);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-white font-display text-2xl uppercase tracking-widest">
          PMC
        </Link>
        <ul className="flex gap-8">
          {links.map(link => (
            <li key={link.name}>
              <Link 
                to={link.path}
                className={`text-sm uppercase tracking-widest transition-colors ${
                  location.pathname === link.path ? 'text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
