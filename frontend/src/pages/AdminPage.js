import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Users, Package, DollarSign, ShoppingCart, Eye, TrendingUp, Activity } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_BACKEND_URL;

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="border border-[#27272A] p-6 hover:border-[#ff3c3c]/30 transition-colors" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon size={18} className={accent ? "text-[#ff3c3c]" : "text-[#A1A1AA]"} />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">{label}</span>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'Unbounded', sans-serif" }}>{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user === false) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    loadData();
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    try {
      const [dashRes, ordersRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/admin/dashboard`, { withCredentials: true }),
        axios.get(`${API}/api/admin/orders`, { withCredentials: true }),
        axios.get(`${API}/api/admin/users`, { withCredentials: true })
      ]);
      setDashboard(dashRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/api/admin/orders/${orderId}/status`, { status }, { withCredentials: true });
      loadData();
    } catch { /* ignore */ }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center"><p className="text-[#A1A1AA] font-mono animate-pulse">Cargando...</p></div>;
  if (!user || user.role !== "admin") return null;

  const tabs = [
    { id: "overview", label: "Dashboard", icon: BarChart3 },
    { id: "orders", label: "Pedidos", icon: Package },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "analytics", label: "Analytics", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="admin-page">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-[#ff3c3c]" />
          <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            Admin Panel
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#27272A] mb-8 overflow-x-auto" data-testid="admin-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? "border-[#ff3c3c] text-white" : "border-transparent text-[#A1A1AA] hover:text-white"
              }`} data-testid={`admin-tab-${t.id}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><p className="text-[#A1A1AA] font-mono animate-pulse">Cargando...</p></div>
        ) : (
          <>
            {/* Overview */}
            {tab === "overview" && dashboard && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#27272A] mb-8">
                  <StatCard icon={DollarSign} label="Revenue" value={`$${dashboard.total_revenue.toLocaleString()}`} accent />
                  <StatCard icon={Package} label="Pedidos" value={dashboard.total_orders} />
                  <StatCard icon={Users} label="Usuarios" value={dashboard.total_users} />
                  <StatCard icon={ShoppingCart} label="Productos" value={dashboard.total_products} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#27272A] mb-8">
                  <StatCard icon={Eye} label="Vistas" value={dashboard.analytics.total_views} />
                  <StatCard icon={TrendingUp} label="Conversión" value={`${dashboard.analytics.conversion_rate}%`} accent />
                  <StatCard icon={ShoppingCart} label="Abandono" value={`${dashboard.analytics.cart_abandonment}%`} />
                </div>

                {/* Top Products */}
                <div className="border border-[#27272A] mb-8">
                  <div className="px-6 py-4 border-b border-[#27272A]">
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Top Productos</h3>
                  </div>
                  {dashboard.top_products.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4 px-6 py-3 border-b border-[#27272A] last:border-b-0">
                      <span className="text-[#A1A1AA] font-mono text-xs w-6">{i + 1}</span>
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover bg-[#151515]" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{p.name}</p>
                        <p className="text-[#A1A1AA] text-xs font-mono">${p.price} MXN</p>
                      </div>
                      <p className="text-[#A1A1AA] text-xs font-mono">{p.views || 0} vistas</p>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div className="border border-[#27272A]">
                  <div className="px-6 py-4 border-b border-[#27272A]">
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Pedidos Recientes</h3>
                  </div>
                  {dashboard.recent_orders.length === 0 ? (
                    <div className="p-6 text-center"><p className="text-[#A1A1AA] text-sm">Sin pedidos aún.</p></div>
                  ) : dashboard.recent_orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between px-6 py-3 border-b border-[#27272A] last:border-b-0">
                      <div>
                        <p className="text-white text-sm font-mono">{o.id.slice(0, 8)}...</p>
                        <p className="text-[#A1A1AA] text-xs">{o.email}</p>
                      </div>
                      <p className="text-white text-sm font-bold">${o.total.toLocaleString()}</p>
                      <span className={`text-[10px] font-mono uppercase px-2 py-1 ${o.status === "delivered" ? "text-[#22c55e]" : "text-[#ff3c3c]"}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {tab === "orders" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="border border-[#27272A]">
                  <div className="px-6 py-4 border-b border-[#27272A]">
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Todos los Pedidos ({orders.length})</h3>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-6 text-center"><p className="text-[#A1A1AA] text-sm">Sin pedidos.</p></div>
                  ) : orders.map(order => (
                    <div key={order.id} className="px-6 py-4 border-b border-[#27272A] last:border-b-0" data-testid={`admin-order-${order.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-white text-sm font-mono">{order.id.slice(0, 8)}...</p>
                          <p className="text-[#A1A1AA] text-xs">{order.email} &bull; {new Date(order.created_at).toLocaleDateString("es-MX")}</p>
                        </div>
                        <p className="text-white font-bold">${order.total.toLocaleString()} MXN</p>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-[#151515] border border-[#27272A] text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-[#ff3c3c]"
                          data-testid={`admin-order-status-${order.id}`}
                        >
                          {["confirmed", "processing", "shipped", "delivered", "cancelled"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {order.items.map((item, j) => (
                          <span key={j} className="text-[#A1A1AA] text-[10px] font-mono bg-[#151515] px-2 py-1">
                            {item.name} ({item.size}) x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Users Tab */}
            {tab === "users" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="border border-[#27272A]">
                  <div className="px-6 py-4 border-b border-[#27272A]">
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Usuarios ({users.length})</h3>
                  </div>
                  {users.map(u => (
                    <div key={u._id} className="flex items-center justify-between px-6 py-3 border-b border-[#27272A] last:border-b-0" data-testid={`admin-user-${u._id}`}>
                      <div>
                        <p className="text-white text-sm font-semibold">{u.name}</p>
                        <p className="text-[#A1A1AA] text-xs font-mono">{u.email}</p>
                      </div>
                      <span className={`text-[10px] font-mono uppercase px-2 py-1 ${u.role === "admin" ? "text-[#ff3c3c] bg-[#ff3c3c]/10" : "text-[#A1A1AA]"}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {tab === "analytics" && dashboard && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#27272A] mb-8">
                  <StatCard icon={Eye} label="Vistas Totales" value={dashboard.analytics.total_views} />
                  <StatCard icon={ShoppingCart} label="Agregados al Carrito" value={dashboard.analytics.total_add_to_cart} />
                  <StatCard icon={Package} label="Compras" value={dashboard.analytics.total_purchases} accent />
                  <StatCard icon={TrendingUp} label="Conversión" value={`${dashboard.analytics.conversion_rate}%`} accent />
                </div>

                <div className="border border-[#27272A]">
                  <div className="px-6 py-4 border-b border-[#27272A]">
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Ingresos por Día (Últimos 30 días)</h3>
                  </div>
                  {dashboard.orders_by_date.length === 0 ? (
                    <div className="p-6 text-center"><p className="text-[#A1A1AA] text-sm">Sin datos aún.</p></div>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-end gap-1 h-40">
                        {dashboard.orders_by_date.map((d, i) => {
                          const maxRev = Math.max(...dashboard.orders_by_date.map(x => x.revenue || 0), 1);
                          const height = ((d.revenue || 0) / maxRev) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full bg-[#ff3c3c]/80 hover:bg-[#ff3c3c] transition-colors" style={{ height: `${Math.max(height, 2)}%` }} title={`${d._id}: $${d.revenue || 0}`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
