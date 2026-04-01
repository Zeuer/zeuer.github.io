import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, User as UserIcon } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", state: "", zip_code: "", country: "México" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user === false) { navigate("/login"); return; }
    setName(user.name || "");
    if (user.address) setAddress(prev => ({ ...prev, ...user.address }));
    axios.get(`${API}/api/orders`, { withCredentials: true }).then(r => setOrders(r.data)).catch(() => {});
  }, [user, authLoading, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/api/auth/profile`, { name, address }, { withCredentials: true });
      await checkAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="profile-page">

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center"><p className="text-[#A1A1AA] font-mono animate-pulse">Cargando...</p></div>;
  if (!user || user === false) return null;
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight mb-8" style={{ fontFamily: "'Unbounded', sans-serif" }}>
          Mi Perfil
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-[#27272A]">
            <div className="px-6 py-4 border-b border-[#27272A] flex items-center gap-2">
              <UserIcon size={16} className="text-[#ff3c3c]" />
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Información Personal</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] block mb-2">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c]" data-testid="profile-name-input" />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] block mb-2">Email</label>
                <input type="email" value={user.email} disabled className="w-full bg-[#151515] border border-[#27272A] text-[#A1A1AA] px-4 py-3 text-sm" />
              </div>
              <div className="border-t border-[#27272A] pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={14} className="text-[#A1A1AA]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Dirección</span>
                </div>
                <div className="space-y-3">
                  <input type="text" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="Calle y número"
                    className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c]" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} placeholder="Ciudad"
                      className="bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c]" />
                    <input type="text" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} placeholder="Estado"
                      className="bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c]" />
                  </div>
                  <input type="text" value={address.zip_code} onChange={(e) => setAddress({...address, zip_code: e.target.value})} placeholder="Código postal"
                    className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c]" />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className={`w-full py-4 text-xs font-mono uppercase tracking-widest transition-colors ${saved ? "bg-[#22c55e] text-white" : "bg-[#ff3c3c] text-white hover:bg-[#e63535]"}`} data-testid="profile-save-button">
                {saved ? "Guardado" : saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          </motion.div>

          {/* Recent Orders */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-[#27272A]">
            <div className="px-6 py-4 border-b border-[#27272A] flex items-center gap-2">
              <Package size={16} className="text-[#ff3c3c]" />
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Pedidos Recientes</h2>
            </div>
            <div className="divide-y divide-[#27272A]">
              {orders.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[#A1A1AA] text-sm">No tienes pedidos aún.</p>
                </div>
              ) : (
                orders.slice(0, 5).map(order => (
                  <div key={order.id} className="p-4" data-testid={`order-${order.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white text-sm font-semibold">${order.total.toLocaleString()} MXN</p>
                        <p className="text-[#A1A1AA] text-xs font-mono">{order.items.length} producto{order.items.length > 1 ? "s" : ""}</p>
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 ${
                        order.status === "delivered" ? "bg-[#22c55e]/10 text-[#22c55e]" :
                        order.status === "shipped" ? "bg-blue-500/10 text-blue-400" :
                        order.status === "cancelled" ? "bg-[#ef4444]/10 text-[#ef4444]" :
                        "bg-[#ff3c3c]/10 text-[#ff3c3c]"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[#A1A1AA] text-[10px] font-mono">{new Date(order.created_at).toLocaleDateString("es-MX")}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
