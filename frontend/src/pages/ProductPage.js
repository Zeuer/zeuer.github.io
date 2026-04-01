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
    axios.get(`${API}/api/products/${id}`).then(r => {
      setProduct(r.data);
      setLoading(false);
    }).catch(() => { setLoading(false); navigate("/shop"); });
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user || user === false) {
      navigate("/login");
      return;
    }
    if (!selectedSize) {
      setError("Selecciona una talla");
      return;
    }
    setAdding(true);
    setError("");
    try {
      await addToCart(product.id, selectedSize, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al agregar");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center">
        <div className="animate-pulse text-[#A1A1AA] font-mono text-sm">Cargando...</div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="product-page">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#A1A1AA] hover:text-white text-xs font-mono uppercase tracking-widest mb-8 transition-colors" data-testid="back-button">
          <ChevronLeft size={16} /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#27272A]">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square bg-[#151515] flex items-center justify-center p-12 lg:p-20"
            data-testid="product-image-container"
          >
            <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" data-testid="product-image" />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-[#27272A] flex flex-col"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#ff3c3c] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{product.category}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight mb-2" style={{ fontFamily: "'Unbounded', sans-serif" }} data-testid="product-name">
              {product.name}
            </h1>
            <p className="text-2xl text-white font-bold mb-6" data-testid="product-price">
              ${product.price.toLocaleString()} <span className="text-[#A1A1AA] text-sm font-mono">MXN</span>
            </p>

            <p className="text-[#A1A1AA] text-sm leading-relaxed mb-8" style={{ fontFamily: "'Manrope', sans-serif" }} data-testid="product-description">
              {product.description}
            </p>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-6" data-testid="stock-status">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                {product.stock > 0 ? (product.stock <= 5 ? `Últimas ${product.stock} piezas` : "En stock") : "Agotado"}
              </span>
            </div>

            {/* Size selector */}
            <div className="mb-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Talla</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSize(s); setError(""); }}
                    className={`min-w-[48px] h-12 px-4 border text-sm font-mono transition-all ${selectedSize === s ? "border-[#ff3c3c] text-white bg-[#ff3c3c]/10" : "border-[#27272A] text-[#A1A1AA] hover:border-white hover:text-white"}`}
                    data-testid={`size-${s.toLowerCase()}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Color</p>
                <div className="flex gap-3">
                  {product.colors.map(c => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="w-6 h-6 border border-[#27272A]" style={{ backgroundColor: c.hex }} />
                      <span className="text-[#A1A1AA] text-xs">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Cantidad</p>
              <div className="flex items-center border border-[#27272A] w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-[#A1A1AA] hover:text-white transition-colors" data-testid="quantity-decrease">
                  <Minus size={16} />
                </button>
                <span className="px-4 py-3 text-white font-mono min-w-[48px] text-center" data-testid="quantity-display">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-[#A1A1AA] hover:text-white transition-colors" data-testid="quantity-increase">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {error && <p className="text-[#ef4444] text-xs font-mono mb-4" data-testid="product-error">{error}</p>}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock <= 0}
              className={`w-full py-4 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                added ? "bg-[#22c55e] text-white" :
                product.stock <= 0 ? "bg-[#27272A] text-[#A1A1AA] cursor-not-allowed" :
                "bg-[#ff3c3c] text-white hover:bg-[#e63535]"
              }`}
              data-testid="add-to-cart-button"
            >
              {added ? <><Check size={16} /> Agregado</> :
               product.stock <= 0 ? "Agotado" :
               <><ShoppingBag size={16} /> {adding ? "Agregando..." : "Agregar al Carrito"}</>}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
