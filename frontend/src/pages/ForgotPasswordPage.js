import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

function formatError(d) { if (!d) return "Algo salió mal."; if (typeof d === "string") return d; if (Array.isArray(d)) return d.map(e => e?.msg).filter(Boolean).join(" "); return String(d); }

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(searchParams.get("token") ? "reset" : "request");
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { const { data } = await axios.post(`${API}/api/auth/forgot-password`, { email }, { withCredentials: true }); setMessage("Si el email existe, recibirás instrucciones."); if (data.reset_token) { setToken(data.reset_token); setStep("reset"); } }
    catch (e) { setError(formatError(e.response?.data?.detail)); } finally { setLoading(false); }
  };
  const handleReset = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await axios.post(`${API}/api/auth/reset-password`, { token, new_password: newPassword }, { withCredentials: true }); setMessage("Contraseña restablecida."); setTimeout(() => navigate("/login"), 2000); }
    catch (e) { setError(formatError(e.response?.data?.detail)); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center px-6" data-testid="forgot-password-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-[#EAF6FF] uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            {step === "request" ? "Recuperar Contraseña" : "Nueva Contraseña"}
          </h1>
        </div>
        <div className="glass-card p-8">
          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com"
                className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] rounded-lg" data-testid="forgot-email-input" />
              {message && <p className="text-[#00FF9C] text-xs font-mono">{message}</p>}
              {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-[#0A6CFF] text-white py-4 text-sm font-medium rounded-lg hover:bg-[#0858D6]" data-testid="forgot-submit">
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Nueva contraseña (min. 6)"
                className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] rounded-lg" data-testid="reset-password-input" />
              {message && <p className="text-[#00FF9C] text-xs font-mono">{message}</p>}
              {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-[#0A6CFF] text-white py-4 text-sm font-medium rounded-lg hover:bg-[#0858D6]" data-testid="reset-submit">
                {loading ? "Restableciendo..." : "Restablecer Contraseña"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
