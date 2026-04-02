import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/AdminLayout";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminContent from "./pages/admin/AdminContent";
import AdminAI from "./pages/admin/AdminAI";

function StorefrontLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="App min-h-screen bg-[#0A0A0A] text-white">
            <Routes>
              {/* Admin Panel (separate layout, no navbar/footer) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="ai" element={<AdminAI />} />
              </Route>

              {/* Storefront */}
              <Route path="/" element={<StorefrontLayout><HomePage /></StorefrontLayout>} />
              <Route path="/shop" element={<StorefrontLayout><ShopPage /></StorefrontLayout>} />
              <Route path="/product/:id" element={<StorefrontLayout><ProductPage /></StorefrontLayout>} />
              <Route path="/login" element={<StorefrontLayout><AuthPage /></StorefrontLayout>} />
              <Route path="/forgot-password" element={<StorefrontLayout><ForgotPasswordPage /></StorefrontLayout>} />
              <Route path="/checkout" element={<StorefrontLayout><CheckoutPage /></StorefrontLayout>} />
              <Route path="/checkout/success" element={<StorefrontLayout><CheckoutSuccessPage /></StorefrontLayout>} />
              <Route path="/profile" element={<StorefrontLayout><ProfilePage /></StorefrontLayout>} />
              <Route path="/orders" element={<StorefrontLayout><OrdersPage /></StorefrontLayout>} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
