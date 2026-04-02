import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Brain, User, Loader2, Sparkles, Package, TrendingUp, Megaphone } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const QUICK_ACTIONS = [
  { icon: Package, label: "Generar idea de producto", prompt: "Genera una idea de nuevo producto para Zeuer basándote en las tendencias actuales de streetwear. Incluye nombre, descripción, precio sugerido y tallas." },
  { icon: TrendingUp, label: "Analizar ventas", prompt: "Analiza los datos de ventas actuales y dame recomendaciones específicas para mejorar el revenue. Incluye insights sobre los productos más vendidos y oportunidades." },
  { icon: Megaphone, label: "Crear caption Instagram", prompt: "Genera 3 captions para Instagram para promocionar los productos de Zeuer. Usa un tono bold, minimal y aspiracional. Incluye hashtags relevantes." },
  { icon: Sparkles, label: "Optimizar descripciones", prompt: "Revisa los productos actuales y sugiere mejoras en sus descripciones para optimizar la conversión. Hazlas más persuasivas y orientadas al streetwear." },
];

function MessageBubble({ role, content }) {
  return (
    <div className={`flex gap-3 ${role === "user" ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${role === "user" ? "bg-[#0A6CFF]/20" : "bg-[#0E1B2A] border border-[#0A6CFF]/20"}`}>
        {role === "user" ? <User size={14} className="text-[#0A6CFF]" /> : <Brain size={14} className="text-[#18C8FF]" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${role === "user" ? "bg-[#0A6CFF] text-white rounded-tr-md" : "glass-card text-[#EAF6FF] rounded-tl-md"}`}>
        <div className="whitespace-pre-wrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>{content}</div>
      </div>
    </div>
  );
}

export default function AdminAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/ai/chat`, { message: text, session_id: sessionId }, { withCredentials: true });
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      if (data.session_id) setSessionId(data.session_id);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error al comunicarse con el AI. Intenta de nuevo." }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-8rem)]" data-testid="admin-ai-page">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A6CFF] to-[#18C8FF] flex items-center justify-center"><Brain size={20} className="text-white" /></div>
        <div><h2 className="text-lg font-bold text-[#EAF6FF]" style={{ fontFamily: "'Unbounded', sans-serif" }}>ZEUER AI</h2>
          <p className="text-[10px] font-mono text-[#2A3A4F]">Asistente inteligente de negocio</p></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A6CFF]/20 to-[#18C8FF]/20 flex items-center justify-center mb-4 border border-[#0A6CFF]/20">
              <Brain size={28} className="text-[#0A6CFF]" />
            </div>
            <h3 className="text-[#EAF6FF] font-semibold mb-1">¿Cómo puedo ayudarte hoy?</h3>
            <p className="text-[#2A3A4F] text-sm mb-6">Puedo generar productos, analizar ventas, crear contenido y más.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {QUICK_ACTIONS.map((action, i) => (
                <button key={i} onClick={() => sendMessage(action.prompt)} className="glass-card p-3 text-left hover:border-[#0A6CFF]/40 transition-all group" data-testid={`quick-action-${i}`}>
                  <div className="flex items-center gap-2 mb-1"><action.icon size={14} className="text-[#0A6CFF]" /><span className="text-xs font-medium text-[#EAF6FF]">{action.label}</span></div>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} role={msg.role} content={msg.content} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] border border-[#0A6CFF]/20 flex items-center justify-center"><Loader2 size={14} className="text-[#18C8FF] animate-spin" /></div>
            <div className="glass-card rounded-2xl rounded-tl-md px-4 py-3"><div className="flex gap-1"><span className="w-2 h-2 bg-[#0A6CFF] rounded-full animate-bounce" /><span className="w-2 h-2 bg-[#0A6CFF] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} /><span className="w-2 h-2 bg-[#0A6CFF] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} /></div></div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3" data-testid="ai-chat-form">
        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} disabled={loading}
          placeholder="Escribe un mensaje..." className="flex-1 bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-4 py-3 text-sm rounded-xl focus:outline-none focus:border-[#0A6CFF] transition-colors" data-testid="ai-chat-input" />
        <button type="submit" disabled={loading || !input.trim()} className="bg-[#0A6CFF] text-white px-5 py-3 rounded-xl hover:bg-[#0858D6] transition-colors disabled:opacity-30 flex items-center gap-2" data-testid="ai-chat-send">
          <Send size={16} />
        </button>
      </form>
    </motion.div>
  );
}
