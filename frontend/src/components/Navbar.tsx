import { Link, useLocation } from 'react-router-dom';


export default function Navbar() {
  const location = useLocation();
  
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Shutterbugs', path: '/shutterbugs' },
    { name: 'Perception', path: '/perception' },
    { name: 'Team', path: '/team' }
  ];



  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-6 mix-blend-difference pointer-events-none">
      <div 
        id="navbar-content"
        className={`max-w-7xl mx-auto flex justify-between items-center pointer-events-auto transition-opacity duration-300 ${
          location.pathname === '/' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Link to="/" className="text-white font-display text-2xl uppercase tracking-widest">
          PMC
        </Link>
        <ul className="flex gap-4 sm:gap-6 md:gap-8 flex-wrap justify-end">
          {links.map(link => (
            <li key={link.name}>
              <Link 
                to={link.path}
                className={`text-[10px] sm:text-xs md:text-sm uppercase tracking-wider md:tracking-widest transition-colors ${
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
