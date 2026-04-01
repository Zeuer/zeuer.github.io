import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

function formatError(detail) {
  if (detail == null) return "Algo salió mal.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  return String(detail);
}

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
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/forgot-password`, { email }, { withCredentials: true });
      setMessage("Si el email existe, recibirás instrucciones para restablecer tu contraseña.");
      if (data.reset_token) {
        setToken(data.reset_token);
        setStep("reset");
      }
    } catch (e) {
      setError(formatError(e.response?.data?.detail));
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, new_password: newPassword }, { withCredentials: true });
      setMessage("Contraseña restablecida exitosamente.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setError(formatError(e.response?.data?.detail));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center px-6" data-testid="forgot-password-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            {step === "request" ? "Recuperar Contraseña" : "Nueva Contraseña"}
          </h1>
        </div>

        {step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com"
              className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c]" data-testid="forgot-email-input" />
            {message && <p className="text-[#22c55e] text-xs font-mono">{message}</p>}
            {error && <p className="text-[#ef4444] text-xs font-mono">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#ff3c3c] text-white py-4 text-xs font-mono uppercase tracking-widest hover:bg-[#e63535]" data-testid="forgot-submit">
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Nueva contraseña (min. 6 caracteres)"
              className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c]" data-testid="reset-password-input" />
            {message && <p className="text-[#22c55e] text-xs font-mono">{message}</p>}
            {error && <p className="text-[#ef4444] text-xs font-mono">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#ff3c3c] text-white py-4 text-xs font-mono uppercase tracking-widest hover:bg-[#e63535]" data-testid="reset-submit">
              {loading ? "Restableciendo..." : "Restablecer Contraseña"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
