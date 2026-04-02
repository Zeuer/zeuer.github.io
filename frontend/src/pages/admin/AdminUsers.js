import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get(`${API}/api/admin/users`, { withCredentials: true }).then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="admin-users-page">
      <h2 className="text-xl font-bold text-[#EAF6FF] mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>Usuarios ({users.length})</h2>
      {loading ? <p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full"><thead><tr className="border-b border-[#0A6CFF]/10">
            {["Nombre", "Email", "Rol", "Registrado"].map((h, i) => <th key={i} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-[#2A3A4F]">{h}</th>)}
          </tr></thead><tbody>
            {users.map(u => (
              <tr key={u._id} className="border-b border-[#0A6CFF]/5 hover:bg-[#0E1B2A]/50" data-testid={`user-row-${u._id}`}>
                <td className="px-4 py-3 text-[#EAF6FF] text-sm font-medium">{u.name}</td>
                <td className="px-4 py-3 text-[#2A3A4F] text-sm font-mono">{u.email}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-md ${u.role === "admin" ? "text-[#0A6CFF] bg-[#0A6CFF]/10" : "text-[#2A3A4F]"}`}>{u.role}</span></td>
                <td className="px-4 py-3 text-[#2A3A4F] text-xs font-mono">{u.created_at ? new Date(u.created_at).toLocaleDateString("es-MX") : "—"}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </motion.div>
  );
}
