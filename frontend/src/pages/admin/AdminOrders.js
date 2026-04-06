import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = { confirmed: "text-[#0A6CFF] bg-[#0A6CFF]/10", processing: "text-yellow-400 bg-yellow-400/10", shipped: "text-[#18C8FF] bg-[#18C8FF]/10", delivered: "text-[#00FF9C] bg-[#00FF9C]/10", cancelled: "text-red-400 bg-red-400/10" };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const url = filterStatus ? `${API}/api/admin/orders?status=${filterStatus}` : `${API}/api/admin/orders`;
    axios.get(url, { withCredentials: true }).then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [filterStatus]);

  const reload = () => {
    setLoading(true);
    const url = filterStatus ? `${API}/api/admin/orders?status=${filterStatus}` : `${API}/api/admin/orders`;
    axios.get(url, { withCredentials: true }).then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const updateStatus = async (id, status) => {
    await axios.put(`${API}/api/admin/orders/${id}/status`, { status }, { withCredentials: true }); reload();
  };

  const exportCSV = () => { window.open(`${API}/api/admin/orders/export`, "_blank"); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="admin-orders-page">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-[#EAF6FF]" style={{ fontFamily: "'Unbounded', sans-serif" }}>Pedidos</h2>
        <div className="flex gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-xs font-mono rounded-lg focus:border-[#0A6CFF]" data-testid="order-status-filter">
            <option value="">Todos</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={exportCSV} className="bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-2 text-xs font-mono rounded-lg hover:border-[#0A6CFF] flex items-center gap-2" data-testid="export-csv-btn"><Download size={14} /> CSV</button>
        </div>
      </div>

      {loading ? <p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p> :
      orders.length === 0 ? <div className="glass-card p-8 text-center"><p className="text-[#2A3A4F]">Sin pedidos{filterStatus ? ` con estado "${filterStatus}"` : ""}.</p></div> : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="glass-card p-5" data-testid={`admin-order-${o.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-[#EAF6FF] text-sm font-mono font-bold">{o.id?.slice(0, 8)}...</p>
                  <p className="text-[#2A3A4F] text-xs">{o.email} &bull; {new Date(o.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
                <p className="text-[#EAF6FF] font-bold">${o.total?.toLocaleString()} MXN</p>
                <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                  className={`text-[10px] font-mono uppercase px-3 py-1.5 rounded-lg border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[o.status] || "text-[#2A3A4F] bg-[#0E1B2A]"}`}
                  data-testid={`order-status-${o.id}`}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {o.items?.map((item, j) => (
                  <div key={j} className="flex items-center gap-2 bg-[#0E1B2A] rounded-lg px-2 py-1">
                    <img src={item.image} alt="" className="w-6 h-6 object-contain" />
                    <span className="text-[#EAF6FF] text-[10px] font-mono">{item.name} ({item.size}) x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
