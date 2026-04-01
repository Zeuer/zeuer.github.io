import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ProductCard({ product, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/product/${product.id}`} className="group block glass-card overflow-hidden transition-all duration-300">
        <div className="aspect-square relative overflow-hidden bg-[#0E1B2A]/80 flex items-center justify-center">
          {/* Blue background shape */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-2/3 h-2/3 rounded-2xl product-bg-shape opacity-20" />
          </div>
          <img
            src={product.image}
            alt={product.name}
            className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500 relative z-10"
            loading="lazy"
          />
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-3 left-3 bg-[#0A6CFF] text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md z-20" data-testid={`low-stock-${product.id}`}>
              Últimas {product.stock} piezas
            </span>
          )}
          {product.featured && (
            <span className="absolute top-3 right-3 border border-[#0A6CFF]/30 bg-[#0E1B2A]/80 backdrop-blur-sm text-[#18C8FF] text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md z-20">
              Featured
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0A6CFF] mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{product.category}</p>
          <h3 className="text-[#EAF6FF] font-semibold text-sm truncate" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            {product.name}
          </h3>
          <p className="text-[#EAF6FF] font-bold mt-2">${product.price.toLocaleString()} <span className="text-[#2A3A4F] text-xs font-mono">MXN</span></p>
        </div>
      </Link>
    </motion.div>
  );
}
