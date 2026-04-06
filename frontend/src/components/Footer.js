import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#0E1B2A]" data-testid="footer">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <img src="/logo.svg" alt="Zeuer" className="h-8 mb-4" style={{ filter: "drop-shadow(0 0 6px rgba(10,108,255,0.3))" }} />
            <p className="text-[#2A3A4F] text-sm max-w-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Técnico. Táctico. Lógico. Zeuer nace desde la disciplina y la superación personal. No seguimos tendencias, creamos identidad.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="footer-instagram"><Instagram size={20} /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="footer-twitter"><Twitter size={20} /></a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-4">Tienda</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shop" className="text-[#EAF6FF]/60 text-sm hover:text-[#0A6CFF] transition-colors">Colección</Link>
              <Link to="/shop?category=Jerseys" className="text-[#EAF6FF]/60 text-sm hover:text-[#0A6CFF] transition-colors">Jerseys</Link>
              <Link to="/shop?category=Collaborations" className="text-[#EAF6FF]/60 text-sm hover:text-[#0A6CFF] transition-colors">Collabs</Link>
              <Link to="/shop?category=Concepts" className="text-[#EAF6FF]/60 text-sm hover:text-[#0A6CFF] transition-colors">Concepts</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-4">Cuenta</h4>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="text-[#EAF6FF]/60 text-sm hover:text-[#0A6CFF] transition-colors">Iniciar Sesión</Link>
              <Link to="/profile" className="text-[#EAF6FF]/60 text-sm hover:text-[#0A6CFF] transition-colors">Mi Perfil</Link>
              <Link to="/orders" className="text-[#EAF6FF]/60 text-sm hover:text-[#0A6CFF] transition-colors">Mis Pedidos</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#0E1B2A] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#2A3A4F] text-xs font-mono">&copy; 2026 ZEUER. Todos los derechos reservados.</p>
          <p className="text-[#2A3A4F] text-xs font-mono uppercase tracking-wider">Técnico. Táctico. Lógico.</p>
        </div>
      </div>
    </footer>
  );
}
