import { Link, useLocation } from 'react-router-dom';


export default function Navbar() {
  const location = useLocation();
  
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Shutterbugs', path: '/shutterbugs' },
    { name: 'Perception', path: '/perception' }
    // Team tab disabled for now
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-3 sm:p-6 mix-blend-difference pointer-events-none">
      <div 
        id="navbar-content"
        className={`max-w-7xl mx-auto flex justify-between items-center pointer-events-auto transition-opacity duration-300 ${
          location.pathname === '/' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Link to="/" className="text-white font-display text-xl sm:text-2xl uppercase tracking-widest flex-shrink-0 mr-2">
          PMC
        </Link>
        <ul className="flex gap-2 sm:gap-4 md:gap-7 flex-wrap items-center justify-end">
          {/* Highlighted Learning Fest tab positioned left of Home */}
          <li>
            <Link
              to="/learning-fest"
              className={`text-[10px] sm:text-xs md:text-sm uppercase tracking-wider md:tracking-widest px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-sm border transition-all duration-300 inline-block whitespace-nowrap ${
                location.pathname === '/learning-fest'
                  ? 'border-white bg-white/20 text-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'border-white/40 bg-white/5 text-white/90 hover:border-white hover:bg-white/10 hover:text-white'
              }`}
            >
              Learning Fest
            </Link>
          </li>
          {links.map(link => (
            <li key={link.name}>
              <Link 
                to={link.path}
                className={`text-[10px] sm:text-xs md:text-sm uppercase tracking-wider md:tracking-widest transition-colors whitespace-nowrap ${
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
