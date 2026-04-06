import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function formatError(detail) {
  if (detail == null) return "Algo salió mal. Intenta de nuevo.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  return String(detail);
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else {
        if (!name.trim()) { setError("El nombre es requerido"); setLoading(false); return; }
        await register(email, password, name);
      }
      navigate("/");
    } catch (e) { setError(formatError(e.response?.data?.detail) || e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center px-6" data-testid="auth-page">
      {/* Background glow */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[400px] rounded-full opacity-20" style={{
          background: "radial-gradient(ellipse at center, rgba(10,108,255,0.3) 0%, transparent 70%)"
        }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <img src="/logo.svg" alt="Zeuer" className="h-10 mx-auto mb-6 zeuer-logo-glow" />
          <h1 className="text-2xl font-bold text-[#EAF6FF] uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h1>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
            {!isLogin && (
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] block mb-2">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre"
                  className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] transition-colors rounded-lg" data-testid="auth-name-input" />
              </div>
            )}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] block mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com"
                className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] transition-colors rounded-lg" data-testid="auth-email-input" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#2A3A4F] block mb-2">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 6 caracteres"
                className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm focus:outline-none focus:border-[#0A6CFF] transition-colors rounded-lg" data-testid="auth-password-input" />
            </div>
            {error && <p className="text-red-400 text-xs font-mono" data-testid="auth-error">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#0A6CFF] text-white py-4 text-sm font-medium rounded-lg hover:bg-[#0858D6] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(10,108,255,0.2)]" data-testid="auth-submit-button">
              {loading ? "Cargando..." : isLogin ? "Entrar" : "Crear Cuenta"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-3">
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-[#2A3A4F] text-sm hover:text-[#0A6CFF] transition-colors" data-testid="auth-toggle">
            {isLogin ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
          </button>
          {isLogin && (
            <Link to="/forgot-password" className="block text-[#2A3A4F] text-xs hover:text-[#18C8FF] transition-colors" data-testid="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
