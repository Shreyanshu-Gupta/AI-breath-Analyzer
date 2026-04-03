import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wind } from 'lucide-react';

interface NavbarProps {
  onStartScan: () => void;
}

export function Navbar({ onStartScan }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const currentUser = localStorage.getItem('currentUser');
  const isLoggedIn = !!currentUser;

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const scrollToSection = (id: string) => {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 top-0 transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <Wind className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">BreathAI</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button onClick={() => scrollToSection('home')} className="hover:text-blue-600 transition-colors">Home</button>
          <button onClick={() => scrollToSection('about')} className="hover:text-blue-600 transition-colors">About</button>
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <button 
            onClick={onStartScan}
            className="hover:text-blue-600 transition-colors font-semibold"
          >
            Breath Test
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Online
          </div>
          
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">Sign Up</Link>
            </div>
          )}

          <button 
            onClick={onStartScan}
            className="md:hidden bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-blue-200"
          >
            Test
          </button>

        </div>
      </div>
    </nav>
  );
}
