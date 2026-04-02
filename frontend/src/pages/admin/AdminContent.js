import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Instagram, X, Save } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdminContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", caption: "", content_type: "post", status: "draft", tags: [] });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => { axios.get(`${API}/api/admin/content`, { withCredentials: true }).then(r => { setPosts(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const addTag = () => { if (tagInput.trim()) { setForm(p => ({ ...p, tags: [...p.tags, tagInput.trim()] })); setTagInput(""); } };
  const removeTag = (i) => setForm(p => ({ ...p, tags: p.tags.filter((_, idx) => idx !== i) }));

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await axios.post(`${API}/api/admin/content`, form, { withCredentials: true }); setShowForm(false); setForm({ platform: "instagram", caption: "", content_type: "post", status: "draft", tags: [] }); load(); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id) => { await axios.delete(`${API}/api/admin/content/${id}`, { withCredentials: true }); load(); };
  const handleStatusChange = async (id, status) => { await axios.put(`${API}/api/admin/content/${id}`, { status }, { withCredentials: true }); load(); };

  const platformIcon = (p) => p === "instagram" ? <Instagram size={14} className="text-pink-400" /> : <span className="text-[10px] font-bold text-cyan-400">TT</span>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="admin-content-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#EAF6FF]" style={{ fontFamily: "'Unbounded', sans-serif" }}>Content Panel</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#0A6CFF] text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-[#0858D6] flex items-center gap-2" data-testid="new-content-btn"><Plus size={16} /> Nueva Idea</button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Plataforma</label>
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg">
                  <option value="instagram">Instagram</option><option value="tiktok">TikTok</option>
                </select></div>
              <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Tipo</label>
                <select value={form.content_type} onChange={e => setForm(p => ({ ...p, content_type: e.target.value }))} className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg">
                  <option value="post">Post</option><option value="reel">Reel</option><option value="story">Story</option><option value="carousel">Carousel</option>
                </select></div>
              <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Estado</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg">
                  <option value="draft">Borrador</option><option value="planned">Planeado</option><option value="published">Publicado</option>
                </select></div>
            </div>
            <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Caption / Contenido</label>
              <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} rows={4} required placeholder="Escribe tu caption aquí..." className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg" data-testid="content-caption-input" /></div>
            <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Tags</label>
              <div className="flex flex-wrap gap-1 mb-2">{form.tags.map((t, i) => <span key={i} className="bg-[#0A6CFF]/10 text-[#0A6CFF] text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">{t}<button type="button" onClick={() => removeTag(i)}><X size={10} /></button></span>)}</div>
              <div className="flex gap-2"><input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="#zeuer" className="flex-1 bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-1.5 text-xs rounded-lg" />
                <button type="button" onClick={addTag} className="bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-1.5 text-xs rounded-lg">+</button></div></div>
            <button type="submit" disabled={saving} className="bg-[#0A6CFF] text-white px-6 py-2.5 text-sm font-medium rounded-lg hover:bg-[#0858D6] flex items-center gap-2" data-testid="save-content-btn"><Save size={14} /> {saving ? "Guardando..." : "Guardar"}</button>
          </form>
        </motion.div>
      )}

      {loading ? <p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p> :
      posts.length === 0 ? <div className="glass-card p-8 text-center"><p className="text-[#2A3A4F]">No hay contenido aún. Crea tu primera idea de post.</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(p => (
            <div key={p.id} className="glass-card p-5" data-testid={`content-card-${p.id}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">{platformIcon(p.platform)}<span className="text-xs font-mono text-[#2A3A4F] uppercase">{p.platform} &bull; {p.content_type}</span></div>
                <div className="flex items-center gap-2">
                  <select value={p.status} onChange={e => handleStatusChange(p.id, e.target.value)} className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border-0 cursor-pointer ${p.status === "published" ? "text-[#00FF9C] bg-[#00FF9C]/10" : p.status === "planned" ? "text-[#18C8FF] bg-[#18C8FF]/10" : "text-[#2A3A4F] bg-[#0E1B2A]"}`}>
                    <option value="draft">Borrador</option><option value="planned">Planeado</option><option value="published">Publicado</option>
                  </select>
                  <button onClick={() => handleDelete(p.id)} className="text-[#2A3A4F] hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-[#EAF6FF] text-sm whitespace-pre-wrap leading-relaxed">{p.caption}</p>
              {p.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{p.tags.map((t, i) => <span key={i} className="text-[#0A6CFF] text-[10px] font-mono">#{t}</span>)}</div>}
              <p className="text-[#2A3A4F] text-[10px] font-mono mt-3">{new Date(p.created_at).toLocaleDateString("es-MX")}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
