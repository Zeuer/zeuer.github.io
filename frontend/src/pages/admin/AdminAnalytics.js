import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, BarChart3, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdminAnalytics() {
  const [trends, setTrends] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/admin/analytics/trends`, { withCredentials: true }),
      axios.get(`${API}/api/admin/dashboard`, { withCredentials: true })
    ]).then(([t, d]) => { setTrends(t.data); setDashboard(d.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[#2A3A4F] font-mono animate-pulse">Cargando analytics...</p>;

  const hourlyData = (trends?.hourly_activity || []).map(h => ({ hour: `${h._id}:00`, events: h.count }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="admin-analytics-page">
      <h2 className="text-xl font-bold text-[#EAF6FF] mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>Analytics & Trends</h2>

      {/* Trending Products */}
      <div className="glass-card mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#0A6CFF]/10 flex items-center gap-2"><TrendingUp size={16} className="text-[#0A6CFF]" /><h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF]">Productos en Tendencia</h3></div>
        {(!trends?.trending_products?.length) ? <div className="p-5 text-center"><p className="text-[#2A3A4F] text-sm">Sin datos suficientes aún. Las tendencias aparecerán conforme se generen vistas.</p></div> :
        trends.trending_products.map((p, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-[#0A6CFF]/5 last:border-b-0">
            <span className="text-[#2A3A4F] font-mono text-xs w-5">{i + 1}</span>
            <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] overflow-hidden flex items-center justify-center"><img src={p.image} alt="" className="w-6 h-6 object-contain" /></div>
            <div className="flex-1 min-w-0"><p className="text-[#EAF6FF] text-sm font-medium truncate">{p.name}</p><p className="text-[#2A3A4F] text-[10px] font-mono">{p.category}</p></div>
            <div className="text-right"><p className="text-[#EAF6FF] text-xs font-mono">{p.views_this_week} vistas</p>
              <span className={`text-[10px] font-mono flex items-center gap-0.5 justify-end ${p.growth >= 0 ? "text-[#00FF9C]" : "text-red-400"}`}><ArrowUpRight size={10} /> {p.growth}%</span></div>
          </div>
        ))}
      </div>

      {/* Product Performance */}
      {trends?.product_performance?.length > 0 && (
        <div className="glass-card mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#0A6CFF]/10 flex items-center gap-2"><BarChart3 size={16} className="text-[#0A6CFF]" /><h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF]">Rendimiento por Producto</h3></div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trends.product_performance.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fill: "#2A3A4F", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="_id" width={120} tick={{ fill: "#EAF6FF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0E1B2A", border: "1px solid #2A3A4F", borderRadius: "8px", color: "#EAF6FF", fontSize: 11 }} />
                <Bar dataKey="revenue" fill="#0A6CFF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hourly Activity */}
      {hourlyData.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#0A6CFF]/10 flex items-center gap-2"><Clock size={16} className="text-[#0A6CFF]" /><h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF]">Actividad por Hora (7 días)</h3></div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fill: "#2A3A4F", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#2A3A4F", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0E1B2A", border: "1px solid #2A3A4F", borderRadius: "8px", color: "#EAF6FF", fontSize: 11 }} />
                <Bar dataKey="events" fill="#18C8FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Business Insights */}
      {dashboard && (
        <div className="glass-card mt-6 p-5">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-3">Insights del Negocio</h3>
          <div className="space-y-2 text-sm text-[#EAF6FF]/70">
            {dashboard.analytics.conversion_rate > 0 && <p>Tasa de conversión: <span className="text-[#EAF6FF] font-medium">{dashboard.analytics.conversion_rate}%</span> de las vistas generan compra.</p>}
            {dashboard.analytics.cart_abandonment > 50 && <p className="text-yellow-400">Alto abandono de carrito ({dashboard.analytics.cart_abandonment}%). Considera simplificar el checkout.</p>}
            {dashboard.avg_order_value > 0 && <p>Ticket promedio: <span className="text-[#EAF6FF] font-medium">${dashboard.avg_order_value} MXN</span>. Considera bundles para incrementarlo.</p>}
            {dashboard.new_users_week > 0 && <p><span className="text-[#00FF9C]">+{dashboard.new_users_week}</span> nuevos usuarios esta semana.</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
}
