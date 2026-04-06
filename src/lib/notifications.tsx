import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout, getLatestLog } from "@/lib/glucosense";
import {
  getNotifications,
  markAllRead,
  markOneRead,
  clearNotifications,
  generateNotificationsFromLogs,
  type Notification,
} from "@/lib/notifications";
import EmergencySOSModal from "./EmergencySOSModal";
import { Bell, Menu, Sun, Moon, LogOut, User, X, CheckCheck, Trash2 } from "lucide-react";

function useThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("gg-theme") as "dark" | "light") || "dark";
  });
  useEffect(() => {
    if (theme === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
    localStorage.setItem("gg-theme", theme);
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

const severityColor: Record<string, string> = {
  critical: "#E63946",
  high: "#ff8c00",
  caution: "#FFB703",
  safe: "#00F5D4",
};

const typeIcon: Record<string, string> = {
  alert: "🚨",
  reminder: "⏰",
  activity: "📋",
  insight: "🧠",
};

export default function Navbar() {
  const [sosOpen, setSosOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useThemeToggle();
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const latestLog = getLatestLog();
  const initials =
    session?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  const unread = notifications.filter((n) => !n.read).length;

  const refreshNotifs = () => {
    generateNotificationsFromLogs();
    setNotifications(getNotifications());
  };

  useEffect(() => {
    refreshNotifs();
    const interval = setInterval(refreshNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(
        (window.scrollY || document.documentElement.scrollTop) >
          window.innerHeight * 0.6
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      setProfileOpen(false);
    };
    if (notifOpen || profileOpen)
      document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [notifOpen, profileOpen]);

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllRead();
    setNotifications(getNotifications());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotifications();
    setNotifications([]);
  };

  const handleReadOne = (id: string) => {
    markOneRead(id);
    setNotifications(getNotifications());
  };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/predictor", label: "Risk Predictor" },
    { to: "/timeline", label: "Timeline" },
    { to: "/settings", label: "Settings" },
  ];

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20"
        style={{ borderRadius: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={session ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div
              className="transition-all duration-500 overflow-hidden flex items-center gap-2"
              style={{ maxWidth: scrolled ? "300px" : "0px", opacity: scrolled ? 1 : 0 }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-heading text-primary text-xs font-bold">GG</span>
              </div>
              <span
                className="font-heading text-sm hidden sm:block whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #ffffff 30%, #00F5D4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                GlucoGuardian
              </span>
            </div>
          </Link>

          {/* Nav links */}
          {session && (
            <div className="hidden md:flex items-center gap-6">
              {links.map((l) => (
                <Link
                  key={l.to} to={l.to}
                  className={`text-sm font-body transition-colors ${location.pathname === l.to ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}
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
                {/* ── NOTIFICATION BELL ── */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setNotifOpen((o) => !o); }}
                    className="relative text-foreground/60 hover:text-foreground transition-colors p-1"
                  >
                    <Bell size={18} />
                    {unread > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse"
                        style={{ background: "#E63946", boxShadow: "0 0 8px #E6394688" }}
                      >
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div
                      className="absolute right-0 top-11 w-80 z-50 flex flex-col"
                      style={{
                        background: "rgba(14, 8, 40, 0.97)",
                        border: "1px solid rgba(0,245,212,0.18)",
                        borderRadius: 16,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,245,212,0.05)",
                        backdropFilter: "blur(24px)",
                        maxHeight: "70vh",
                        overflow: "hidden",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                        style={{ borderBottom: "1px solid rgba(0,245,212,0.1)" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-xs text-foreground tracking-wider">
                            NOTIFICATIONS
                          </span>
                          {unread > 0 && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(230,57,70,0.2)", color: "#E63946", border: "1px solid rgba(230,57,70,0.3)" }}
                            >
                              {unread} NEW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {unread > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="p-1.5 rounded-lg text-foreground/40 hover:text-primary transition-colors"
                              title="Mark all read"
                            >
                              <CheckCheck size={13} />
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={handleClear}
                              className="p-1.5 rounded-lg text-foreground/40 hover:text-destructive transition-colors"
                              title="Clear all"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => setNotifOpen(false)}
                            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* List */}
                      <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(70vh - 52px)" }}>
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Bell size={28} className="text-foreground/15" />
                            <p className="text-foreground/30 text-xs font-body">
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          <div className="p-2 space-y-1">
                            {notifications.map((n) => {
                              const color = severityColor[n.severity || "safe"];
                              return (
                                <div
                                  key={n.id}
                                  onClick={() => handleReadOne(n.id)}
                                  className="flex gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                                  style={{
                                    background: n.read
                                      ? "rgba(255,255,255,0.02)"
                                      : `rgba(${color === "#E63946" ? "230,57,70" : color === "#ff8c00" ? "255,140,0" : color === "#FFB703" ? "255,183,3" : "0,245,212"},0.06)`,
                                    border: `1px solid ${n.read ? "rgba(255,255,255,0.04)" : color + "28"}`,
                                    borderLeft: `3px solid ${n.read ? "rgba(255,255,255,0.08)" : color}`,
                                  }}
                                >
                                  <span className="text-base mt-0.5 flex-shrink-0">
                                    {typeIcon[n.type]}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <p
                                        className="text-[11px] font-heading truncate"
                                        style={{ color: n.read ? "rgba(255,255,255,0.4)" : "#fff" }}
                                      >
                                        {n.title}
                                      </p>
                                      {!n.read && (
                                        <span
                                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                                        />
                                      )}
                                    </div>
                                    <p className="text-[10px] font-body leading-relaxed"
                                      style={{ color: n.read ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.55)" }}
                                    >
                                      {n.message}
                                    </p>
                                    <p className="text-[9px] mt-1 font-body"
                                      style={{ color: "rgba(255,255,255,0.2)" }}
                                    >
                                      {new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(n.time).toLocaleDateString([], { day: "numeric", month: "short" })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* SOS */}
                <button
                  onClick={() => setSosOpen(true)}
                  className="btn-primary-glow text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                  style={{ background: "hsl(356,82%,56%)", boxShadow: "0 0 15px rgba(230,57,70,0.4)" }}
                >
                  🆘 SOS
                </button>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setProfileOpen((p) => !p); }}
                    className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-heading text-primary hover:bg-primary/30 transition-colors"
                  >
                    {initials}
                  </button>
                  {profileOpen && (
                    <div
                      className="absolute right-0 top-11 w-64 glass-card p-4 z-50"
                      style={{ border: "1px solid rgba(0,245,212,0.2)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(0,245,212,0.15)" }}>
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-heading text-primary flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-heading text-foreground">{session.fullName}</div>
                          <div className="text-xs text-foreground/40 font-body">{session.email}</div>
                          <div className="text-xs text-primary font-body mt-0.5">Age {session.age} · {session.diabetesType}</div>
                        </div>
                      </div>
                      <button
                        onClick={toggle}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-body transition-colors hover:bg-primary/10 mb-2"
                        style={{ border: "1px solid rgba(0,245,212,0.1)" }}
                      >
                        <span className="flex items-center gap-2 text-foreground/70">
                          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                          {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </span>
                        <span className="text-xs text-foreground/30">{theme === "dark" ? "☀️" : "🌙"}</span>
                      </button>
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body text-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors mb-2"
                        style={{ border: "1px solid rgba(0,245,212,0.1)" }}
                      >
                        <User size={14} /> Edit Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body text-destructive hover:bg-destructive/10 transition-colors"
                        style={{ border: "1px solid rgba(230,57,70,0.15)" }}
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  )}
                </div>

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
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,245,212,0.15)" }}>
              <div className="text-xs text-foreground/40 font-body mb-2">{session.fullName} · Age {session.age}</div>
              <button onClick={toggle} className="block w-full text-left py-2 text-sm text-foreground/70 hover:text-primary transition-colors">
                {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
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
