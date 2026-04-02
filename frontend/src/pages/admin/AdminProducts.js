import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const CATEGORIES = ["Jerseys", "Collaborations", "Concepts", "Basics", "Bottoms", "Accessories"];

function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState(product || { name: "", price: 0, description: "", category: "Jerseys", sizes: ["S", "M", "L", "XL"], colors: [], stock: 0, image: "", featured: false, active: true });
  const [saving, setSaving] = useState(false);
  const [colorName, setColorName] = useState(""); const [colorHex, setColorHex] = useState("#000000");

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleSize = (s) => update("sizes", form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);
  const addColor = () => { if (colorName) { update("colors", [...form.colors, { name: colorName, hex: colorHex }]); setColorName(""); } };
  const removeColor = (i) => update("colors", form.colors.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6" data-testid="product-form">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#EAF6FF]">{product ? "Editar Producto" : "Nuevo Producto"}</h3>
        <button onClick={onCancel} className="text-[#2A3A4F] hover:text-[#EAF6FF]"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Nombre</label>
            <input value={form.name} onChange={e => update("name", e.target.value)} required className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#0A6CFF]" data-testid="product-form-name" /></div>
          <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Precio (MXN)</label>
            <input type="number" value={form.price} onChange={e => update("price", parseFloat(e.target.value) || 0)} required className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#0A6CFF]" data-testid="product-form-price" /></div>
          <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Categoría</label>
            <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#0A6CFF]" data-testid="product-form-category">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Stock</label>
            <input type="number" value={form.stock} onChange={e => update("stock", parseInt(e.target.value) || 0)} className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#0A6CFF]" data-testid="product-form-stock" /></div>
        </div>
        <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Descripción</label>
          <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#0A6CFF]" data-testid="product-form-description" /></div>
        <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">URL Imagen</label>
          <input value={form.image} onChange={e => update("image", e.target.value)} placeholder="https://..." className="w-full bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#0A6CFF]" data-testid="product-form-image" /></div>
        <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Tallas</label>
          <div className="flex flex-wrap gap-2">{["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"].map(s => (
            <button key={s} type="button" onClick={() => toggleSize(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.sizes.includes(s) ? "bg-[#0A6CFF] text-white" : "bg-[#0E1B2A] text-[#2A3A4F] border border-[#2A3A4F]"}`}>{s}</button>
          ))}</div></div>
        <div><label className="text-[10px] font-mono uppercase text-[#2A3A4F] block mb-1">Colores</label>
          <div className="flex gap-2 mb-2">{form.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#0E1B2A] px-2 py-1 rounded-lg text-xs"><div className="w-4 h-4 rounded-full border border-[#2A3A4F]" style={{ backgroundColor: c.hex }} />{c.name}<button type="button" onClick={() => removeColor(i)} className="text-[#2A3A4F] hover:text-red-400 ml-1"><X size={12} /></button></div>
          ))}</div>
          <div className="flex gap-2"><input value={colorName} onChange={e => setColorName(e.target.value)} placeholder="Nombre" className="bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-1.5 text-xs rounded-lg flex-1" />
            <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="w-10 h-8 bg-transparent border-0 cursor-pointer" />
            <button type="button" onClick={addColor} className="bg-[#0E1B2A] border border-[#2A3A4F] text-[#EAF6FF] px-3 py-1.5 text-xs rounded-lg hover:border-[#0A6CFF]">+</button></div></div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => update("featured", e.target.checked)} className="accent-[#0A6CFF]" /><span className="text-xs text-[#2A3A4F]">Featured</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.active} onChange={e => update("active", e.target.checked)} className="accent-[#0A6CFF]" /><span className="text-xs text-[#2A3A4F]">Activo</span></label>
        </div>
        <button type="submit" disabled={saving} className="w-full bg-[#0A6CFF] text-white py-3 text-sm font-medium rounded-lg hover:bg-[#0858D6] flex items-center justify-center gap-2" data-testid="product-form-save">
          <Save size={16} /> {saving ? "Guardando..." : "Guardar Producto"}
        </button>
      </form>
    </motion.div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => { axios.get(`${API}/api/admin/products`, { withCredentials: true }).then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    await axios.post(`${API}/api/admin/products`, form, { withCredentials: true });
    setShowForm(false); load();
  };
  const handleUpdate = async (form) => {
    await axios.put(`${API}/api/admin/products/${editing.id}`, form, { withCredentials: true });
    setEditing(null); load();
  };
  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    await axios.delete(`${API}/api/admin/products/${id}`, { withCredentials: true }); load();
  };
  const handleToggle = async (id) => {
    await axios.put(`${API}/api/admin/products/${id}/toggle`, {}, { withCredentials: true }); load();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="admin-products-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#EAF6FF]" style={{ fontFamily: "'Unbounded', sans-serif" }}>Productos</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="bg-[#0A6CFF] text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-[#0858D6] flex items-center gap-2" data-testid="add-product-btn"><Plus size={16} /> Nuevo</button>
      </div>

      {(showForm || editing) && <div className="mb-6"><ProductForm product={editing} onSave={editing ? handleUpdate : handleCreate} onCancel={() => { setShowForm(false); setEditing(null); }} /></div>}

      {loading ? <p className="text-[#2A3A4F] font-mono animate-pulse">Cargando...</p> : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[#0A6CFF]/10">
                {["", "Producto", "Precio", "Stock", "Estado", "Vistas", ""].map((h, i) => <th key={i} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-[#2A3A4F]">{h}</th>)}
              </tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-[#0A6CFF]/5 hover:bg-[#0E1B2A]/50 transition-colors" data-testid={`admin-product-row-${p.id}`}>
                    <td className="px-4 py-3"><div className="w-10 h-10 rounded-lg bg-[#0E1B2A] overflow-hidden flex items-center justify-center"><img src={p.image} alt="" className="w-8 h-8 object-contain" /></div></td>
                    <td className="px-4 py-3"><p className="text-[#EAF6FF] text-sm font-medium">{p.name}</p><p className="text-[#2A3A4F] text-[10px] font-mono">{p.category} &bull; {p.id}</p></td>
                    <td className="px-4 py-3 text-[#EAF6FF] text-sm font-mono">${p.price?.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-mono ${p.stock <= 5 ? "text-red-400" : "text-[#EAF6FF]"}`}>{p.stock}</span></td>
                    <td className="px-4 py-3"><button onClick={() => handleToggle(p.id)} className={`text-[10px] font-mono uppercase px-2 py-1 rounded-md transition-colors ${p.active !== false ? "text-[#00FF9C] bg-[#00FF9C]/10" : "text-red-400 bg-red-400/10"}`} data-testid={`toggle-${p.id}`}>{p.active !== false ? "Activo" : "Inactivo"}</button></td>
                    <td className="px-4 py-3 text-[#2A3A4F] text-sm font-mono">{p.views || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(p); setShowForm(false); }} className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid={`edit-${p.id}`}><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-[#2A3A4F] hover:text-red-400 transition-colors" data-testid={`delete-${p.id}`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
