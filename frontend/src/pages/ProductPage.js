import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, ChevronLeft, Check } from "lucide-react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/api/products/${id}`).then(r => { setProduct(r.data); setLoading(false); }).catch(() => { setLoading(false); navigate("/shop"); });
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user || user === false) { navigate("/login"); return; }
    if (!selectedSize) { setError("Selecciona una talla"); return; }
    setAdding(true); setError("");
    try {
      await addToCart(product.id, selectedSize, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) { setError(e.response?.data?.detail || "Error al agregar"); }
    finally { setAdding(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center"><div className="animate-pulse text-[#2A3A4F] font-mono text-sm">Cargando...</div></div>;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="product-page">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#2A3A4F] hover:text-[#0A6CFF] text-xs font-mono uppercase tracking-widest mb-8 transition-colors" data-testid="back-button">
          <ChevronLeft size={16} /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image with blue glow background */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="aspect-square rounded-2xl relative overflow-hidden flex items-center justify-center bg-[#0E1B2A]"
            data-testid="product-image-container">
            {/* Blue shape behind product */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2/3 h-3/4 rounded-2xl product-bg-shape opacity-30" />
            </div>
            {/* Blue radial glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full rounded-full" style={{
                background: "radial-gradient(ellipse at center, rgba(10,108,255,0.15) 0%, transparent 60%)"
              }} />
            </div>
            <img src={product.image} alt={product.name} className="max-w-[70%] max-h-[70%] object-contain relative z-10" style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }} data-testid="product-image" />
          </motion.div>

          {/* Info card with glassmorphism */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-8 lg:p-10 flex flex-col">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{product.category}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#EAF6FF] uppercase tracking-tight mb-2" style={{ fontFamily: "'Unbounded', sans-serif" }} data-testid="product-name">{product.name}</h1>
            <p className="text-2xl text-[#EAF6FF] font-bold mb-6" data-testid="product-price">${product.price.toLocaleString()} <span className="text-[#2A3A4F] text-sm font-mono">MXN</span></p>
            <p className="text-[#EAF6FF]/50 text-sm leading-relaxed mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }} data-testid="product-description">{product.description}</p>

            <div className="flex items-center gap-2 mb-6" data-testid="stock-status">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-[#00FF9C]" : "bg-red-500"}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#2A3A4F]">
                {product.stock > 0 ? (product.stock <= 5 ? `Últimas ${product.stock} piezas` : "En stock") : "Agotado"}
              </span>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] mb-3">Color</p>
                <div className="flex gap-3">
                  {product.colors.map(c => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-[#2A3A4F]" style={{ backgroundColor: c.hex }} />
                      <span className="text-[#EAF6FF]/50 text-xs">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector with rounded pills */}
            <div className="mb-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] mb-3">Talla</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => { setSelectedSize(s); setError(""); }}
                    className={`min-w-[48px] h-12 px-4 rounded-lg text-sm font-medium transition-all ${
                      selectedSize === s
                        ? "bg-[#0A6CFF] text-white border border-[#0A6CFF] shadow-[0_0_15px_rgba(10,108,255,0.3)]"
                        : "bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF]/60 hover:border-[#0A6CFF] hover:text-[#EAF6FF]"
                    }`}
                    data-testid={`size-${s.toLowerCase()}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] mb-3">Cantidad</p>
              <div className="flex items-center bg-[#0E1B2A] rounded-lg w-fit border border-[#2A3A4F]">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="quantity-decrease"><Minus size={16} /></button>
                <span className="px-4 py-3 text-[#EAF6FF] font-mono min-w-[48px] text-center" data-testid="quantity-display">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid="quantity-increase"><Plus size={16} /></button>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-mono mb-4" data-testid="product-error">{error}</p>}

            <div className="flex gap-3 mt-auto">
              <button onClick={handleAddToCart} disabled={adding || product.stock <= 0}
                className={`flex-1 py-4 text-sm font-medium rounded-lg flex items-center justify-center gap-3 transition-all ${
                  added ? "bg-[#00FF9C] text-black" :
                  product.stock <= 0 ? "bg-[#2A3A4F] text-[#EAF6FF]/30 cursor-not-allowed" :
                  "bg-[#0A6CFF] text-white hover:bg-[#0858D6] shadow-[0_0_20px_rgba(10,108,255,0.2)]"
                }`}
                data-testid="add-to-cart-button">
                {added ? <><Check size={16} /> Agregado</> :
                 product.stock <= 0 ? "Agotado" :
                 <><ShoppingBag size={16} /> {adding ? "Agregando..." : "Comprar"}</>}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
