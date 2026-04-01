import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

const API = process.env.REACT_APP_BACKEND_URL;
const CATEGORIES = ["All", "Jerseys", "Collaborations", "Concepts", "Basics", "Bottoms", "Accessories"];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const size = searchParams.get("size") || "";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (size) params.set("size", size);
    axios.get(`${API}/api/products?${params.toString()}`).then(r => {
      setProducts(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category, search, size]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "All") next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="shop-page">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Tienda</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: "'Unbounded', sans-serif" }}>
              {category || (search ? `"${search}"` : "Colección")}
            </h1>
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 text-[#A1A1AA] hover:text-white text-xs font-mono uppercase tracking-widest transition-colors lg:hidden"
            data-testid="filter-toggle"
          >
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        <div className="flex gap-12">
          {/* Sidebar Filters */}
          <aside className={`${filterOpen ? "block" : "hidden"} lg:block w-full lg:w-48 flex-shrink-0 space-y-8`} data-testid="filter-sidebar">
            {/* Category */}
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Categoría</h4>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setFilter("category", c)}
                    className={`text-left text-sm py-1 transition-colors ${(c === "All" && !category) || category === c ? "text-white font-semibold" : "text-[#A1A1AA] hover:text-white"}`}
                    data-testid={`filter-category-${c.toLowerCase()}`}
                  >
                    {c === "All" ? "Todas" : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Talla</h4>
              <div className="flex flex-wrap gap-2">
                {["S", "M", "L", "XL", "XXL"].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter("size", size === s ? "" : s)}
                    className={`w-10 h-10 border text-xs font-mono transition-all ${size === s ? "border-[#ff3c3c] text-white bg-[#ff3c3c]/10" : "border-[#27272A] text-[#A1A1AA] hover:border-white hover:text-white"}`}
                    data-testid={`filter-size-${s.toLowerCase()}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filters */}
            {(category || search || size) && (
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-2 text-[#ff3c3c] text-xs font-mono uppercase tracking-wider hover:text-[#e63535] transition-colors"
                data-testid="clear-filters"
              >
                <X size={14} /> Limpiar Filtros
              </button>
            )}
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-[#A1A1AA] text-xs font-mono mb-6" data-testid="product-count">{products.length} producto{products.length !== 1 ? "s" : ""}</p>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#27272A]">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-[#0A0A0A] animate-pulse">
                    <div className="aspect-square bg-[#151515]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#151515] w-1/3" />
                      <div className="h-4 bg-[#151515] w-2/3" />
                      <div className="h-4 bg-[#151515] w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20" data-testid="no-products">
                <p className="text-[#A1A1AA] text-sm">No se encontraron productos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#27272A]">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
