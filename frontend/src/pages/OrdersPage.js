import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_BACKEND_URL;

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user === false) { navigate("/login"); return; }
    axios.get(`${API}/api/orders`, { withCredentials: true }).then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [user, authLoading, navigate]);

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center"><p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p></div>;
  if (!user || user === false) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="orders-page">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[#EAF6FF] uppercase tracking-tight mb-8" style={{ fontFamily: "'Unbounded', sans-serif" }}>Mis Pedidos</h1>
        {loading ? (
          <div className="text-center py-20"><p className="text-[#2A3A4F] text-sm font-mono animate-pulse">Cargando...</p></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 glass-card"><Package size={48} className="text-[#2A3A4F] mx-auto mb-4" /><p className="text-[#2A3A4F] text-sm mb-4">No tienes pedidos aún.</p>
            <button onClick={() => navigate("/shop")} className="bg-[#0A6CFF] text-white px-8 py-3 text-sm font-medium rounded-lg hover:bg-[#0858D6]">Ver Colección</button></div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden hover:border-[#0A6CFF]/40 transition-colors" data-testid={`order-card-${order.id}`}>
                <div className="px-6 py-4 border-b border-[#0A6CFF]/10 flex flex-wrap items-center justify-between gap-4">
                  <div><p className="text-[10px] font-mono uppercase tracking-wider text-[#2A3A4F]">Pedido</p><p className="text-[#EAF6FF] text-sm font-mono">{order.id.slice(0, 8)}...</p></div>
                  <div><p className="text-[10px] font-mono uppercase tracking-wider text-[#2A3A4F]">Fecha</p><p className="text-[#EAF6FF] text-sm">{new Date(order.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</p></div>
                  <div><p className="text-[10px] font-mono uppercase tracking-wider text-[#2A3A4F]">Total</p><p className="text-[#EAF6FF] text-sm font-bold">${order.total.toLocaleString()} MXN</p></div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-md ${
                    order.status === "delivered" ? "bg-[#00FF9C]/10 text-[#00FF9C] border border-[#00FF9C]/20" :
                    order.status === "shipped" ? "bg-[#18C8FF]/10 text-[#18C8FF] border border-[#18C8FF]/20" :
                    order.status === "cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    "bg-[#0A6CFF]/10 text-[#0A6CFF] border border-[#0A6CFF]/20"
                  }`}>{order.status}</span>
                </div>
                <div className="px-6 py-4"><div className="flex flex-wrap gap-3">
                  {order.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-3 bg-[#0E1B2A] rounded-lg p-2 pr-4">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                      <div><p className="text-[#EAF6FF] text-xs font-semibold">{item.name}</p><p className="text-[#2A3A4F] text-[10px] font-mono">Talla: {item.size} &bull; x{item.quantity}</p></div>
                    </div>
                  ))}
                </div></div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
