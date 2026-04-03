import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wind, LayoutDashboard, FlaskConical, LogOut, User } from 'lucide-react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onStartScan: () => void;
}

export function Navbar({ onStartScan }: NavbarProps) {
  const location = useLocation();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const isHome = location.pathname === '/';
  const navRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  // GSAP slide-in on mount
  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
    );
  }, []);

  // Animate links when auth state changes
  useEffect(() => {
    if (!linksRef.current) return;
    const items = linksRef.current.querySelectorAll('.nav-item');
    gsap.fromTo(
      items,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
    );
  }, [isAuthenticated]);

  const scrollToSection = (id: string) => {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const navLinkClass =
    'nav-item relative text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors duration-200 group';

  return (
    <nav
      ref={navRef}
      className="fixed w-full bg-white/85 backdrop-blur-md border-b border-slate-100 z-40 top-0 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-md shadow-blue-200">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            BreathAI
          </span>
        </Link>

        {/* Nav links */}
        <div ref={linksRef} className="hidden md:flex items-center gap-7">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="inline w-4 h-4 mr-1 -mt-0.5" />
                Dashboard
              </Link>
              <button onClick={onStartScan} className={navLinkClass}>
                <FlaskConical className="inline w-4 h-4 mr-1 -mt-0.5" />
                Breath Test
              </button>
            </>
          ) : (
            <>
              <button onClick={() => scrollToSection('home')} className={navLinkClass}>
                Home
              </button>
              <button onClick={() => scrollToSection('about')} className={navLinkClass}>
                About
              </button>
            </>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* System status badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Online
          </div>

          {isAuthenticated ? (
            <>
              {/* User chip */}
              <div className="nav-item hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-700 max-w-[120px] truncate">
                  Hi, {currentUser?.name?.split(' ')[0]}
                </span>
              </div>
              {/* Logout */}
              <button
                onClick={logout}
                className="nav-item flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="nav-item text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="nav-item bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile CTA */}
          {isAuthenticated ? (
            <button
              onClick={onStartScan}
              className="md:hidden bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-blue-200"
            >
              Test
            </button>
          ) : (
            <Link
              to="/login"
              className="md:hidden bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md shadow-blue-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
