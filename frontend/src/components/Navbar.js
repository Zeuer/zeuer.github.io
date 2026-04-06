import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Search, ChevronDown, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import CartSheet from "./CartSheet";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount, cartOpen, setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header data-testid="navbar" className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#0E1B2A]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between h-16">
        <button data-testid="mobile-menu-trigger" className="lg:hidden text-[#EAF6FF]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="flex items-center" data-testid="logo-link">
          <img src="/logo.svg" alt="Zeuer" className="h-7 md:h-8" style={{ filter: "drop-shadow(0 0 8px rgba(10,108,255,0.4))" }} />
        </Link>

        <nav className="hidden lg:flex items-center gap-8" data-testid="desktop-nav">
          <Link to="/shop" className="text-xs font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="nav-shop">Colección</Link>
          <Link to="/shop?category=Jerseys" className="text-xs font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="nav-jerseys">Jerseys</Link>
          <Link to="/shop?category=Collaborations" className="text-xs font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="nav-collabs">Collabs</Link>
          <Link to="/shop?category=Concepts" className="text-xs font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="nav-concepts">Concepts</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button data-testid="search-trigger" onClick={() => setSearchOpen(!searchOpen)} className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors">
            <Search size={20} />
          </button>

          {user && user !== false ? (
            <div className="relative">
              <button data-testid="user-menu-trigger" onClick={() => setUserMenuOpen(!userMenuOpen)} className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors flex items-center gap-1">
                <User size={20} />
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-10 glass-card min-w-[200px] z-50 overflow-hidden" data-testid="user-menu-dropdown">
                  <div className="px-4 py-3 border-b border-[#0A6CFF]/10">
                    <p className="text-[#EAF6FF] text-sm font-semibold">{user.name}</p>
                    <p className="text-[#2A3A4F] text-xs">{user.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-[#2A3A4F] hover:text-[#0A6CFF] hover:bg-[#0E1B2A] transition-colors" data-testid="nav-profile" onClick={() => setUserMenuOpen(false)}>Mi Perfil</Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-[#2A3A4F] hover:text-[#0A6CFF] hover:bg-[#0E1B2A] transition-colors" data-testid="nav-orders" onClick={() => setUserMenuOpen(false)}>Mis Pedidos</Link>
                  {user.role === "admin" && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-[#0A6CFF] hover:bg-[#0E1B2A] transition-colors" data-testid="nav-admin" onClick={() => setUserMenuOpen(false)}>
                      <Shield size={14} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-[#2A3A4F] hover:text-[#EAF6FF] hover:bg-[#0E1B2A] transition-colors border-t border-[#0A6CFF]/10" data-testid="logout-button">
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="nav-login">
              <User size={20} />
            </Link>
          )}

          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button data-testid="cart-trigger" className="relative text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#0A6CFF] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full" data-testid="cart-count">
                    {itemCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0A0A0A] border-l border-[#0E1B2A] w-full sm:w-[420px] p-0">
              <CartSheet />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#0E1B2A] bg-[#0A0A0A]" data-testid="search-bar">
          <form onSubmit={handleSearch} className="max-w-[1440px] mx-auto px-6 md:px-12 py-4 flex gap-4">
            <input type="text" placeholder="Buscar productos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] transition-colors rounded-lg"
              data-testid="search-input" autoFocus />
            <button type="submit" className="bg-[#0A6CFF] text-white px-6 py-3 text-sm font-medium hover:bg-[#0858D6] transition-colors rounded-lg" data-testid="search-submit">
              Buscar
            </button>
          </form>
        </div>
      )}

      {mobileOpen && (
        <nav className="lg:hidden border-t border-[#0E1B2A] bg-[#0A0A0A] absolute w-full" data-testid="mobile-menu">
          <div className="flex flex-col px-6 py-4 gap-4">
            <Link to="/shop" className="text-sm font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors py-2" onClick={() => setMobileOpen(false)}>Colección</Link>
            <Link to="/shop?category=Jerseys" className="text-sm font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors py-2" onClick={() => setMobileOpen(false)}>Jerseys</Link>
            <Link to="/shop?category=Collaborations" className="text-sm font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors py-2" onClick={() => setMobileOpen(false)}>Collabs</Link>
            <Link to="/shop?category=Concepts" className="text-sm font-mono uppercase tracking-[0.2em] text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors py-2" onClick={() => setMobileOpen(false)}>Concepts</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
