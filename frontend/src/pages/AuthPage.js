import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function formatError(detail) {
  if (detail == null) return "Algo salió mal. Intenta de nuevo.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  if (detail?.msg) return detail.msg;
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
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) { setError("El nombre es requerido"); setLoading(false); return; }
        await register(email, password, name);
      }
      navigate("/");
    } catch (e) {
      setError(formatError(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center px-6" data-testid="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <img src="https://zeuer.github.io/logo.svg" alt="Zeuer" className="h-10 mx-auto invert mb-6" />
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
          {!isLogin && (
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] block mb-2">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c] transition-colors"
                placeholder="Tu nombre"
                data-testid="auth-name-input"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c] transition-colors"
              placeholder="tu@email.com"
              data-testid="auth-email-input"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] block mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#151515] border border-[#27272A] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#ff3c3c] transition-colors"
              placeholder="Min. 6 caracteres"
              data-testid="auth-password-input"
            />
          </div>

          {error && <p className="text-[#ef4444] text-xs font-mono" data-testid="auth-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff3c3c] text-white py-4 text-xs font-mono uppercase tracking-widest hover:bg-[#e63535] transition-colors disabled:opacity-50"
            data-testid="auth-submit-button"
          >
            {loading ? "Cargando..." : isLogin ? "Entrar" : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-[#A1A1AA] text-sm hover:text-white transition-colors"
            data-testid="auth-toggle"
          >
            {isLogin ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
          </button>
          {isLogin && (
            <Link to="/forgot-password" className="block text-[#A1A1AA] text-xs hover:text-white transition-colors" data-testid="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
