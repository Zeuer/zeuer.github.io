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
      <Link to={`/product/${product.id}`} className="group block bg-[#0A0A0A] border border-[#27272A] hover:border-[#ff3c3c] transition-all duration-300 relative overflow-hidden">
        <div className="aspect-square bg-[#151515] relative overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-3 left-3 bg-[#ff3c3c] text-white text-[10px] font-mono uppercase tracking-wider px-2 py-1" data-testid={`low-stock-${product.id}`}>
              Últimas {product.stock} piezas
            </span>
          )}
          {product.featured && (
            <span className="absolute top-3 right-3 border border-[#27272A] bg-[#0A0A0A]/80 text-[#A1A1AA] text-[10px] font-mono uppercase tracking-wider px-2 py-1">
              Featured
            </span>
          )}
        </div>
        <div className="p-4 border-t border-[#27272A]">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA] mb-1">{product.category}</p>
          <h3 className="text-white font-semibold text-sm truncate" style={{ fontFamily: "'Unbounded', sans-serif" }}>
            {product.name}
          </h3>
          <p className="text-white font-bold mt-2">${product.price.toLocaleString()} <span className="text-[#A1A1AA] text-xs font-mono">MXN</span></p>
        </div>
      </Link>
    </motion.div>
  );
}
