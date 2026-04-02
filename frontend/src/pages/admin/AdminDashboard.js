import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Package, Users, ShoppingCart, Eye, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

function StatCard({ icon: Icon, label, value, sub, trend }) {
  return (
    <div className="glass-card p-5" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#0A6CFF]/10 flex items-center justify-center"><Icon size={18} className="text-[#0A6CFF]" /></div>
        {trend !== undefined && (
          <span className={`text-xs font-mono flex items-center gap-1 ${trend >= 0 ? "text-[#00FF9C]" : "text-red-400"}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#EAF6FF]" style={{ fontFamily: "'Unbounded', sans-serif" }}>{value}</p>
      <p className="text-[#2A3A4F] text-xs font-mono mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/admin/dashboard`, { withCredentials: true }).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[#2A3A4F] font-mono animate-pulse">Cargando dashboard...</p></div>;
  if (!data) return null;

  const chartData = data.orders_by_date.map(d => ({ date: d._id.slice(5), orders: d.count, revenue: d.revenue }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="admin-dashboard-page">
      <h2 className="text-xl font-bold text-[#EAF6FF] mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Revenue Total" value={`$${data.total_revenue.toLocaleString()}`} />
        <StatCard icon={Package} label="Pedidos" value={data.total_orders} />
        <StatCard icon={Users} label="Usuarios" value={data.total_users} sub={`+${data.new_users_week} esta semana`} />
        <StatCard icon={ShoppingCart} label="Ticket Promedio" value={`$${data.avg_order_value.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Eye} label="Vistas de Producto" value={data.analytics.total_views} />
        <StatCard icon={TrendingUp} label="Conversión" value={`${data.analytics.conversion_rate}%`} />
        <StatCard icon={ShoppingCart} label="Abandono de Carrito" value={`${data.analytics.cart_abandonment}%`} />
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-4">Ingresos (Últimos 30 días)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A6CFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0A6CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#2A3A4F", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#2A3A4F", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0E1B2A", border: "1px solid #2A3A4F", borderRadius: "8px", color: "#EAF6FF", fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#0A6CFF" fill="url(#blueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#0A6CFF]/10"><h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF]">Top Productos</h3></div>
          {data.top_products.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#0A6CFF]/5 last:border-b-0">
              <span className="text-[#2A3A4F] font-mono text-xs w-5">{i + 1}</span>
              <div className="w-9 h-9 rounded-lg bg-[#0E1B2A] overflow-hidden flex items-center justify-center"><img src={p.image} alt="" className="w-7 h-7 object-contain" /></div>
              <div className="flex-1 min-w-0"><p className="text-[#EAF6FF] text-sm font-medium truncate">{p.name}</p></div>
              <p className="text-[#2A3A4F] text-xs font-mono">{p.views || 0} vistas</p>
            </div>
          ))}
        </div>
        {/* Recent Orders */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#0A6CFF]/10"><h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF]">Pedidos Recientes</h3></div>
          {data.recent_orders.length === 0 ? <div className="p-5 text-center"><p className="text-[#2A3A4F] text-sm">Sin pedidos aún</p></div> :
            data.recent_orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 border-b border-[#0A6CFF]/5 last:border-b-0">
                <div><p className="text-[#EAF6FF] text-sm font-mono">{o.id?.slice(0, 8)}...</p><p className="text-[#2A3A4F] text-[10px]">{o.email}</p></div>
                <p className="text-[#EAF6FF] font-bold text-sm">${o.total?.toLocaleString()}</p>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${o.status === "delivered" ? "text-[#00FF9C] bg-[#00FF9C]/10" : "text-[#0A6CFF] bg-[#0A6CFF]/10"}`}>{o.status}</span>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
