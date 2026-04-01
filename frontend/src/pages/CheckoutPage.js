import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const API = process.env.REACT_APP_BACKEND_URL;

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user === false) navigate("/login");
    else if (cart.items.length === 0) navigate("/shop");
  }, [user, authLoading, cart, navigate]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const { data } = await axios.post(`${API}/api/checkout`, { origin_url: origin }, { withCredentials: true });
      if (data.url) window.location.href = data.url;
    } catch (e) { alert(e.response?.data?.detail || "Error al procesar el pago"); setLoading(false); }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center"><p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p></div>;
  if (!user || user === false || !cart.items.length) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="checkout-page">
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-[#EAF6FF] uppercase tracking-tight mb-8" style={{ fontFamily: "'Unbounded', sans-serif" }}>Checkout</h1>
          <div className="glass-card mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#0A6CFF]/10"><h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF]">Resumen del Pedido</h2></div>
            {cart.items.map((item, i) => (
              <div key={`${item.product_id}-${item.size}`} className="flex items-center gap-4 px-6 py-4 border-b border-[#0A6CFF]/10" data-testid={`checkout-item-${i}`}>
                <div className="w-16 h-16 bg-[#0E1B2A] rounded-lg overflow-hidden flex items-center justify-center"><img src={item.image} alt={item.name} className="w-12 h-12 object-contain" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#EAF6FF] text-sm font-semibold truncate">{item.name}</h3>
                  <p className="text-[#2A3A4F] text-xs font-mono">Talla: {item.size} &bull; Cantidad: {item.quantity}</p>
                </div>
                <p className="text-[#EAF6FF] font-semibold text-sm">${(item.price * item.quantity).toLocaleString()} MXN</p>
              </div>
            ))}
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#2A3A4F] font-mono text-xs uppercase">Subtotal</span><span className="text-[#EAF6FF]">${cart.subtotal.toLocaleString()} MXN</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#2A3A4F] font-mono text-xs uppercase">IVA (16%)</span><span className="text-[#EAF6FF]">${cart.tax.toLocaleString()} MXN</span></div>
              <div className="flex justify-between text-lg font-bold border-t border-[#0A6CFF]/10 pt-3">
                <span className="text-[#EAF6FF] font-['Unbounded'] text-sm uppercase">Total</span>
                <span className="text-[#EAF6FF]">${cart.total.toLocaleString()} MXN</span>
              </div>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={loading}
            className="w-full bg-[#0A6CFF] text-white py-4 text-sm font-medium rounded-lg hover:bg-[#0858D6] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(10,108,255,0.2)]" data-testid="pay-now-button">
            {loading ? "Procesando..." : `Pagar $${cart.total.toLocaleString()} MXN`}
          </button>
          <p className="text-[#2A3A4F] text-xs font-mono text-center mt-4">Serás redirigido a Stripe para completar tu pago de forma segura.</p>
        </motion.div>
      </div>
    </div>
  );
}
