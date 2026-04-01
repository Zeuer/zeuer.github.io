import React from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CartSheet() {
  const { cart, updateCartItem, removeFromCart, setCartOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => { setCartOpen(false); navigate("/checkout"); };

  if (!user || user === false) {
    return (
      <div className="flex flex-col h-full" data-testid="cart-sheet-login">
        <div className="px-6 py-4 border-b border-[#0E1B2A]">
          <h2 className="font-['Unbounded'] text-lg font-bold text-[#EAF6FF] uppercase">Carrito</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <ShoppingBag size={48} className="text-[#2A3A4F]" />
          <p className="text-[#2A3A4F] text-sm text-center">Inicia sesión para agregar productos</p>
          <button onClick={() => { setCartOpen(false); navigate("/login"); }} className="bg-[#0A6CFF] text-white px-8 py-3 text-sm font-medium rounded-lg hover:bg-[#0858D6] transition-colors" data-testid="cart-login-btn">
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="flex flex-col h-full" data-testid="cart-sheet-empty">
        <div className="px-6 py-4 border-b border-[#0E1B2A]">
          <h2 className="font-['Unbounded'] text-lg font-bold text-[#EAF6FF] uppercase">Carrito</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <ShoppingBag size={48} className="text-[#2A3A4F]" />
          <p className="text-[#2A3A4F] text-sm">Tu carrito está vacío</p>
          <button onClick={() => { setCartOpen(false); navigate("/shop"); }} className="border border-[#2A3A4F] text-[#EAF6FF] px-8 py-3 text-sm font-medium rounded-lg hover:border-[#0A6CFF] transition-colors" data-testid="cart-shop-btn">
            Ver Colección
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="cart-sheet">
      <div className="px-6 py-4 border-b border-[#0E1B2A]">
        <h2 className="font-['Unbounded'] text-lg font-bold text-[#EAF6FF] uppercase">Carrito ({cart.items.length})</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {cart.items.map((item, i) => (
          <div key={`${item.product_id}-${item.size}`} className="flex gap-4 px-6 py-4 border-b border-[#0E1B2A]" data-testid={`cart-item-${i}`}>
            <div className="w-20 h-20 bg-[#0E1B2A] rounded-lg overflow-hidden flex items-center justify-center">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[#EAF6FF] text-sm font-semibold truncate">{item.name}</h3>
              <p className="text-[#2A3A4F] text-xs font-mono mt-1">Talla: {item.size}</p>
              <p className="text-[#EAF6FF] text-sm font-semibold mt-1">${item.price.toLocaleString()} MXN</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => updateCartItem(item.product_id, item.size, item.quantity - 1)} className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid={`cart-item-${i}-decrease`}><Minus size={14} /></button>
                <span className="text-[#EAF6FF] text-sm font-mono w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateCartItem(item.product_id, item.size, item.quantity + 1)} className="text-[#2A3A4F] hover:text-[#0A6CFF] transition-colors" data-testid={`cart-item-${i}-increase`}><Plus size={14} /></button>
                <button onClick={() => removeFromCart(item.product_id, item.size)} className="ml-auto text-[#2A3A4F] hover:text-red-500 transition-colors" data-testid={`cart-item-${i}-remove`}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#0E1B2A] px-6 py-4 space-y-3">
        <div className="flex justify-between text-sm"><span className="text-[#2A3A4F] font-mono text-xs uppercase tracking-wider">Subtotal</span><span className="text-[#EAF6FF]">${cart.subtotal.toLocaleString()} MXN</span></div>
        <div className="flex justify-between text-sm"><span className="text-[#2A3A4F] font-mono text-xs uppercase tracking-wider">IVA (16%)</span><span className="text-[#EAF6FF]">${cart.tax.toLocaleString()} MXN</span></div>
        <div className="flex justify-between text-lg font-bold border-t border-[#0E1B2A] pt-3">
          <span className="text-[#EAF6FF] font-['Unbounded'] text-sm uppercase">Total</span>
          <span className="text-[#EAF6FF]">${cart.total.toLocaleString()} MXN</span>
        </div>
        <button onClick={handleCheckout} className="w-full bg-[#0A6CFF] text-white py-4 text-sm font-medium rounded-lg hover:bg-[#0858D6] transition-colors shadow-[0_0_20px_rgba(10,108,255,0.2)]" data-testid="cart-checkout-btn">
          Proceder al Pago
        </button>
      </div>
    </div>
  );
}
