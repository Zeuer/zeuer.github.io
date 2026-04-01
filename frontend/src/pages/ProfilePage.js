import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, User as UserIcon } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ProfilePage() {
  const { user, loading: authLoading, checkAuth } = useAuth();
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
    e.preventDefault(); setSaving(true);
    try { await axios.put(`${API}/api/auth/profile`, { name, address }, { withCredentials: true }); await checkAuth(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch { /* ignore */ } finally { setSaving(false); }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center"><p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p></div>;
  if (!user || user === false) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="profile-page">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[#EAF6FF] uppercase tracking-tight mb-8" style={{ fontFamily: "'Unbounded', sans-serif" }}>Mi Perfil</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#0A6CFF]/10 flex items-center gap-2">
              <UserIcon size={16} className="text-[#0A6CFF]" /><h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#2A3A4F]">Información Personal</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] block mb-2">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] rounded-lg" data-testid="profile-name-input" /></div>
              <div><label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] block mb-2">Email</label>
                <input type="email" value={user.email} disabled className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#2A3A4F] px-4 py-3 text-sm rounded-lg" /></div>
              <div className="border-t border-[#0A6CFF]/10 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4"><MapPin size={14} className="text-[#0A6CFF]" /><span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F]">Dirección</span></div>
                <div className="space-y-3">
                  <input type="text" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="Calle y número" className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} placeholder="Ciudad" className="bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] rounded-lg" />
                    <input type="text" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} placeholder="Estado" className="bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] rounded-lg" />
                  </div>
                  <input type="text" value={address.zip_code} onChange={(e) => setAddress({...address, zip_code: e.target.value})} placeholder="Código postal" className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] rounded-lg" />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className={`w-full py-4 text-sm font-medium rounded-lg transition-colors ${saved ? "bg-[#00FF9C] text-black" : "bg-[#0A6CFF] text-white hover:bg-[#0858D6]"}`} data-testid="profile-save-button">
                {saved ? "Guardado" : saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#0A6CFF]/10 flex items-center gap-2">
              <Package size={16} className="text-[#0A6CFF]" /><h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#2A3A4F]">Pedidos Recientes</h2>
            </div>
            <div className="divide-y divide-[#0A6CFF]/10">
              {orders.length === 0 ? (
                <div className="p-6 text-center"><p className="text-[#2A3A4F] text-sm">No tienes pedidos aún.</p></div>
              ) : orders.slice(0, 5).map(order => (
                <div key={order.id} className="p-4" data-testid={`order-${order.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="text-[#EAF6FF] text-sm font-semibold">${order.total.toLocaleString()} MXN</p><p className="text-[#2A3A4F] text-xs font-mono">{order.items.length} producto{order.items.length > 1 ? "s" : ""}</p></div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md ${
                      order.status === "delivered" ? "bg-[#00FF9C]/10 text-[#00FF9C]" :
                      order.status === "shipped" ? "bg-[#18C8FF]/10 text-[#18C8FF]" :
                      order.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                      "bg-[#0A6CFF]/10 text-[#0A6CFF]"
                    }`}>{order.status}</span>
                  </div>
                  <p className="text-[#2A3A4F] text-[10px] font-mono">{new Date(order.created_at).toLocaleDateString("es-MX")}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
