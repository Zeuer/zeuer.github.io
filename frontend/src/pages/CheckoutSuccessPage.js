import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import axios from "axios";
import { useCart } from "../context/CartContext";

const API = process.env.REACT_APP_BACKEND_URL;

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("checking");
  const { fetchCart } = useCart();
  const polled = useRef(false);

  useEffect(() => {
    if (!sessionId || polled.current) return;
    polled.current = true;

    const poll = async (attempts = 0) => {
      if (attempts >= 5) { setStatus("timeout"); return; }
      try {
        const { data } = await axios.get(`${API}/api/checkout/status/${sessionId}`, { withCredentials: true });
        if (data.payment_status === "paid") {
          setStatus("success");
          fetchCart();
          return;
        }
        if (data.status === "expired") { setStatus("failed"); return; }
        setTimeout(() => poll(attempts + 1), 2000);
      } catch {
        setTimeout(() => poll(attempts + 1), 2000);
      }
    };
    poll();
  }, [sessionId, fetchCart]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center px-6" data-testid="checkout-success-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        {status === "checking" && (
          <>
            <Loader2 size={48} className="text-[#ff3c3c] animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight mb-4" style={{ fontFamily: "'Unbounded', sans-serif" }}>
              Verificando Pago
            </h1>
            <p className="text-[#A1A1AA] text-sm">Estamos confirmando tu pago...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-[#22c55e] flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight mb-4" style={{ fontFamily: "'Unbounded', sans-serif" }} data-testid="success-title">
              Pago Exitoso
            </h1>
            <p className="text-[#A1A1AA] text-sm mb-8">Gracias por tu compra. Tu pedido ha sido confirmado.</p>
            <div className="flex flex-col gap-3">
              <Link to="/orders" className="bg-[#ff3c3c] text-white py-4 text-xs font-mono uppercase tracking-widest hover:bg-[#e63535] transition-colors text-center" data-testid="view-orders-link">
                Ver Mis Pedidos
              </Link>
              <Link to="/shop" className="border border-[#27272A] text-white py-4 text-xs font-mono uppercase tracking-widest hover:border-white transition-colors text-center" data-testid="continue-shopping-link">
                Seguir Comprando
              </Link>
            </div>
          </>
        )}
        {(status === "failed" || status === "timeout") && (
          <>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight mb-4" style={{ fontFamily: "'Unbounded', sans-serif" }}>
              {status === "timeout" ? "Verificación Pendiente" : "Pago Fallido"}
            </h1>
            <p className="text-[#A1A1AA] text-sm mb-8">
              {status === "timeout" ? "No pudimos confirmar tu pago. Si se completó, aparecerá en tus pedidos pronto." : "Hubo un problema con tu pago. Por favor intenta de nuevo."}
            </p>
            <Link to="/shop" className="inline-block bg-[#ff3c3c] text-white py-4 px-8 text-xs font-mono uppercase tracking-widest hover:bg-[#e63535] transition-colors">
              Volver a la Tienda
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
