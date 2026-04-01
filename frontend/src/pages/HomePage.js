import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { ArrowRight, ChevronRight } from "lucide-react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

const API = process.env.REACT_APP_BACKEND_URL;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/products`).then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const featured = products.filter(p => p.featured);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/newsletter`, { email });
      setSubscribed(true);
      setEmail("");
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {/* Subtle radial glow behind logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] md:w-[900px] md:h-[500px] rounded-full opacity-30" style={{
            background: "radial-gradient(ellipse at center, rgba(10,108,255,0.35) 0%, rgba(24,200,255,0.1) 40%, transparent 70%)"
          }} />
        </div>
        <div className="absolute inset-0 bg-[#0A0A0A]" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[400px] md:w-[1000px] md:h-[600px] rounded-full" style={{
            background: "radial-gradient(ellipse at center, rgba(10,108,255,0.25) 0%, rgba(24,200,255,0.08) 35%, transparent 65%)"
          }} />
        </div>

        <div className="relative z-20 text-center px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <img
              src="https://zeuer.github.io/logo.svg"
              alt="Zeuer"
              className="h-20 md:h-28 lg:h-36 mx-auto mb-8 zeuer-logo-glow"
              style={{ filter: "brightness(0)" }}
              data-testid="hero-logo"
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-[#EAF6FF]/60 text-sm md:text-base font-mono uppercase tracking-[0.3em] mb-10 zeuer-text-glow"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Técnico. Táctico. Lógico.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 bg-[#0A6CFF] text-white px-10 py-4 text-sm font-medium rounded-lg hover:bg-[#0858D6] transition-all group shadow-[0_0_30px_rgba(10,108,255,0.3)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              data-testid="hero-cta"
            >
              Ver colección
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-[#2A3A4F] mx-auto mb-2" />
          <p className="text-[#2A3A4F] text-[10px] font-mono uppercase tracking-widest">Scroll</p>
        </motion.div>
      </section>

      {/* Marquee */}
      <section className="border-y border-[#0E1B2A] py-4 bg-[#0A0A0A]" data-testid="marquee-section">
        <Marquee speed={40} gradient={false}>
          {["NUEVA COLECCIÓN", "STREETWEAR TÁCTICO", "ENVÍO A TODO MÉXICO", "EDICIONES LIMITADAS", "TÉCNICO. TÁCTICO. LÓGICO."].map((text, i) => (
            <span key={i} className="text-[#2A3A4F] text-xs font-mono uppercase tracking-[0.3em] mx-12">{text}</span>
          ))}
        </Marquee>
      </section>

      {/* Featured Products */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-20" data-testid="featured-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Selección</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EAF6FF] uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
              Colección
            </h2>
          </div>
          <Link to="/shop" className="hidden md:flex items-center gap-2 text-[#2A3A4F] hover:text-[#0A6CFF] text-xs font-mono uppercase tracking-widest transition-colors group" data-testid="view-all-link">
            Ver Todo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <Link to="/shop" className="md:hidden flex items-center justify-center gap-2 mt-8 border border-[#2A3A4F] text-[#EAF6FF] px-8 py-4 text-xs font-mono uppercase tracking-widest hover:border-[#0A6CFF] hover:text-[#0A6CFF] transition-colors rounded-lg">
          Ver Toda la Colección <ArrowRight size={14} />
        </Link>
      </section>

      {/* Drops Section */}
      <section className="border-y border-[#0E1B2A] bg-[#0E1B2A]/50" data-testid="drops-section">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-20 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#18C8FF] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Próximamente</p>
          <h2 className="text-3xl md:text-5xl font-black text-[#EAF6FF] uppercase tracking-tighter mb-4" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            Drops
          </h2>
          <p className="text-[#2A3A4F] text-sm max-w-md mx-auto mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Próximos lanzamientos de Zeuer. Ediciones limitadas que definen nuestra visión.
          </p>
          <div className="inline-flex items-center gap-2 border border-[#2A3A4F] text-[#2A3A4F] px-8 py-4 text-xs font-mono uppercase tracking-widest cursor-default rounded-lg">
            Próximamente
          </div>
        </div>
      </section>

      {/* Brand Section */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-12 py-20" data-testid="brand-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Nuestra Historia</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EAF6FF] uppercase tracking-tight mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>
              La Marca
            </h2>
            <p className="text-[#EAF6FF]/50 text-base leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Zeuer nace desde la disciplina y la superación personal. No seguimos tendencias, creamos identidad. Cada pieza es diseñada con precisión técnica y visión táctica.
            </p>
            <p className="text-[#EAF6FF]/50 text-base leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Nuestra misión es crear prendas que representen la mentalidad del atleta moderno — aquellos que entienden que el estilo es una extensión de la disciplina.
            </p>
          </div>
          <div className="aspect-square bg-[#0E1B2A] rounded-2xl relative overflow-hidden flex items-center justify-center border border-[#0A6CFF]/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 rounded-full opacity-20" style={{
                background: "radial-gradient(ellipse at center, rgba(10,108,255,0.4) 0%, transparent 70%)"
              }} />
            </div>
            <img src="https://zeuer.github.io/logo.svg" alt="Zeuer Brand" className="w-1/2 opacity-5" style={{ filter: "brightness(0) invert(1)" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-6xl md:text-8xl font-black text-[#EAF6FF]/[0.02] uppercase tracking-tighter" style={{ fontFamily: "'Unbounded', sans-serif" }}>ZEUER</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-[#0E1B2A] bg-[#0E1B2A]/30" data-testid="newsletter-section">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">
          <div className="max-w-lg mx-auto text-center">
            <h3 className="text-xl font-bold text-[#EAF6FF] uppercase mb-2" style={{ fontFamily: "'Unbounded', sans-serif" }}>
              Newsletter
            </h3>
            <p className="text-[#2A3A4F] text-sm mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Sé el primero en conocer nuestros nuevos drops y colecciones.
            </p>
            {subscribed ? (
              <p className="text-[#00FF9C] text-sm font-mono" data-testid="newsletter-success">Suscrito exitosamente</p>
            ) : (
              <form onSubmit={handleNewsletter} className="flex gap-0" data-testid="newsletter-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="flex-1 bg-[#0E1B2A] border border-[#2A3A4F] border-r-0 text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] transition-colors rounded-l-lg"
                  data-testid="newsletter-input"
                />
                <button type="submit" className="bg-[#0A6CFF] text-white px-6 py-3 text-sm font-medium hover:bg-[#0858D6] transition-colors whitespace-nowrap rounded-r-lg" data-testid="newsletter-submit">
                  Suscribir
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
