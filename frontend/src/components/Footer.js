import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#27272A]" data-testid="footer">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <img src="https://zeuer.github.io/logo.svg" alt="Zeuer" className="h-8 invert mb-4" />
            <p className="text-[#A1A1AA] text-sm max-w-sm leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Técnico. Táctico. Lógico. Zeuer nace desde la disciplina y la superación personal. No seguimos tendencias, creamos identidad.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-[#A1A1AA] hover:text-white transition-colors" data-testid="footer-instagram">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-[#A1A1AA] hover:text-white transition-colors" data-testid="footer-twitter">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-4">Tienda</h4>
            <div className="flex flex-col gap-2">
              <Link to="/shop" className="text-white text-sm hover:text-[#ff3c3c] transition-colors">Colección</Link>
              <Link to="/shop?category=Jerseys" className="text-white text-sm hover:text-[#ff3c3c] transition-colors">Jerseys</Link>
              <Link to="/shop?category=Collaborations" className="text-white text-sm hover:text-[#ff3c3c] transition-colors">Collabs</Link>
              <Link to="/shop?category=Concepts" className="text-white text-sm hover:text-[#ff3c3c] transition-colors">Concepts</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-4">Cuenta</h4>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="text-white text-sm hover:text-[#ff3c3c] transition-colors">Iniciar Sesión</Link>
              <Link to="/profile" className="text-white text-sm hover:text-[#ff3c3c] transition-colors">Mi Perfil</Link>
              <Link to="/orders" className="text-white text-sm hover:text-[#ff3c3c] transition-colors">Mis Pedidos</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#27272A] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A1A1AA] text-xs font-mono">&copy; 2026 ZEUER. Todos los derechos reservados.</p>
          <p className="text-[#A1A1AA] text-xs font-mono uppercase tracking-wider">Técnico. Táctico. Lógico.</p>
        </div>
      </div>
    </footer>
  );
}
