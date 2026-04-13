import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, Outlet } from "react-router-dom";
import { BarChart3, Package, ShoppingCart, Users, Brain, Megaphone, TrendingUp, Menu, X, LogOut, Home, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/admin" },
  { id: "products", label: "Productos", icon: Package, path: "/admin/products" },
  { id: "orders", label: "Pedidos", icon: ShoppingCart, path: "/admin/orders" },
  { id: "users", label: "Usuarios", icon: Users, path: "/admin/users" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, path: "/admin/analytics" },
  { id: "content", label: "Content", icon: Megaphone, path: "/admin/content" },
  { id: "ai", label: "ZEUER AI", icon: Brain, path: "/admin/ai" },
];

export default function AdminLayout() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user === false) navigate("/login");
    else if (user.role !== "admin") navigate("/");
  }, [user, authLoading, navigate]);

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p></div>;
  if (!user || user.role !== "admin") return null;

  const current = NAV.find(n => location.pathname === n.path) || NAV[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#060911] border-r border-[#0E1B2A] flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`} data-testid="admin-sidebar">
        <div className="h-16 flex items-center px-6 border-b border-[#0E1B2A]">
          <img src="/logo-simple.svg" alt="Zeuer" className="h-6" style={{ filter: "drop-shadow(0 0 6px rgba(10,108,255,0.4))" }} />
          <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-[#0A6CFF]">Admin</span>
          <button className="lg:hidden ml-auto text-[#2A3A4F]" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.id} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? "bg-[#0A6CFF]/10 text-[#0A6CFF]" : "text-[#2A3A4F] hover:text-[#EAF6FF] hover:bg-[#0E1B2A]"}`}
                data-testid={`admin-nav-${item.id}`}>
                <item.icon size={18} />
                <span className="font-medium">{item.label}</span>
                {item.id === "ai" && <span className="ml-auto text-[8px] font-mono bg-[#0A6CFF] text-white px-1.5 py-0.5 rounded">AI</span>}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-[#0E1B2A] space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#2A3A4F] hover:text-[#EAF6FF] hover:bg-[#0E1B2A] transition-all">
            <Home size={18} /> Ver Tienda
          </Link>
          <button onClick={() => { logout(); navigate("/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#2A3A4F] hover:text-red-400 hover:bg-[#0E1B2A] transition-all" data-testid="admin-logout">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-[#0E1B2A] flex items-center px-6 gap-4 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-40">
          <button className="lg:hidden text-[#2A3A4F] hover:text-[#EAF6FF]" onClick={() => setSidebarOpen(true)} data-testid="admin-mobile-menu"><Menu size={20} /></button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#2A3A4F] font-mono text-xs">ZEUER</span>
            <ChevronRight size={12} className="text-[#2A3A4F]" />
            <span className="text-[#EAF6FF] font-medium">{current.label}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0A6CFF]/20 flex items-center justify-center text-[#0A6CFF] text-xs font-bold">{user.name?.charAt(0) || "A"}</div>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
