import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout, getLatestLog } from "@/lib/glucosense";
import EmergencySOSModal from "./EmergencySOSModal";
import { Bell, Menu, Sun, Moon, LogOut, User } from "lucide-react";

function useThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('gg-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('gg-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

export default function Navbar() {
  const [sosOpen, setSosOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useThemeToggle();
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const latestLog = getLatestLog();

  const initials = session?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setScrolled(scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = () => setProfileOpen(false);
    if (profileOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [profileOpen]);

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/predictor', label: 'Risk Predictor' },
    { to: '/timeline', label: 'Timeline' },
    { to: '/settings', label: 'Settings' },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20" style={{ borderRadius: 0 }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to={session ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div
              className="transition-all duration-500 overflow-hidden flex items-center gap-2"
              style={{ maxWidth: scrolled ? '300px' : '0px', opacity: scrolled ? 1 : 0 }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-heading text-primary text-xs font-bold">GG</span>
              </div>
              <span
                className="font-heading text-sm hidden sm:block whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 30%, #00F5D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                GlucoGuardian
              </span>
            </div>
          </Link>

          {/* Nav links */}
          {session && (
            <div className="hidden md:flex items-center gap-6">
              {links.map(l => (
                <Link
                  key={l.to} to={l.to}
                  className={`text-sm font-body transition-colors ${location.pathname === l.to ? 'text-primary' : 'text-foreground/60 hover:text-foreground'}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session && (
              <>
                {/* Bell */}
                <button className="relative text-foreground/60 hover:text-foreground transition-colors">
                  <Bell size={18} />
                  {latestLog && latestLog.riskScore > 55 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
                  )}
                </button>

                {/* SOS */}
                <button
                  onClick={() => setSosOpen(true)}
                  className="btn-primary-glow text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                  style={{ background: 'hsl(356,82%,56%)', boxShadow: '0 0 15px rgba(230,57,70,0.4)' }}
                >
                  🆘 SOS
                </button>

                {/* Profile avatar + dropdown */}
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setProfileOpen(p => !p); }}
                    className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-heading text-primary hover:bg-primary/30 transition-colors"
                  >
                    {initials}
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 top-11 w-64 glass-card p-4 z-50"
                      style={{ border: '1px solid rgba(0,245,212,0.2)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* User info */}
                      <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(0,245,212,0.15)' }}>
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-heading text-primary flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-heading text-foreground">{session.fullName}</div>
                          <div className="text-xs text-foreground/40 font-body">{session.email}</div>
                          <div className="text-xs text-primary font-body mt-0.5">Age {session.age} · {session.diabetesType}</div>
                        </div>
                      </div>

                      {/* Theme toggle */}
                      <button
                        onClick={toggle}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-body transition-colors hover:bg-primary/10 mb-2"
                        style={{ border: '1px solid rgba(0,245,212,0.1)' }}
                      >
                        <span className="flex items-center gap-2 text-foreground/70">
                          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                        <span className="text-xs text-foreground/30">
                          {theme === 'dark' ? '☀️' : '🌙'}
                        </span>
                      </button>

                      {/* Settings link */}
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body text-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors mb-2"
                        style={{ border: '1px solid rgba(0,245,212,0.1)' }}
                      >
                        <User size={14} />
                        Edit Profile
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body text-destructive hover:bg-destructive/10 transition-colors"
                        style={{ border: '1px solid rgba(230,57,70,0.15)' }}
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile menu toggle */}
                <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground/60">
                  <Menu size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && session && (
          <div className="md:hidden glass-card p-4 mx-4 mb-2 mt-1" style={{ borderRadius: 12 }}>
            {links.map(l => (
              <Link
                key={l.to} to={l.to}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,245,212,0.15)' }}>
              <div className="text-xs text-foreground/40 font-body mb-2">{session.fullName} · Age {session.age}</div>
              <button onClick={toggle} className="block w-full text-left py-2 text-sm text-foreground/70 hover:text-primary transition-colors">
                {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button onClick={handleLogout} className="mt-1 text-sm text-destructive">Logout</button>
            </div>
          </div>
        )}
      </nav>

      <EmergencySOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
    </>
  );
}
