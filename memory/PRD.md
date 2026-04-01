# Zeuer E-Commerce Platform - PRD

## Problem Statement
Transform the existing zeuer.github.io static HTML site into a professional, scalable e-commerce platform comparable to Nike/Adidas quality. The brand is "Zeuer" - a Mexican streetwear/sportswear brand with tagline "Técnico. Táctico. Lógico."

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + Radix UI (shadcn/ui)
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver)
- **Database**: MongoDB
- **Payment**: Stripe (via emergentintegrations library)
- **Auth**: JWT with httpOnly cookies + bcrypt password hashing

## Official Brand Identity (from Brandbook)
### Color Palette
- Primary: Negro profundo #0A0A0A, Azul eléctrico #0A6CFF, Cian #18C8FF, Blanco frío #EAF6FF
- Secondary: Azul oscuro #0E1B2A, Gris azulado #2A3A4F
- Accent: Verde neón #00FF9C, Morado eléctrico #7A5CFF

### Typography
- Headings/Identity: Unbounded (SemiBold, Bold, ExtraBold)
- Body/Functional: DM Sans (Regular, Medium)
- Labels/Specs: IBM Plex Mono

### Visual Effects
- Logo: Black with pulsing blue neon glow (CSS animation)
- Cards: Glassmorphism (backdrop-blur-24px, rgba(14,27,42,0.6) bg, blue border)
- Product pages: Blue gradient shape behind product image
- Buttons: Rounded-lg, blue (#0A6CFF), with box-shadow glow

## What's Been Implemented

### Phase 1 - MVP (April 1, 2026)
- Full JWT auth system with bcrypt, brute force protection
- 6-product catalog with category/size/search filtering
- Shopping cart with IVA calculation
- Stripe checkout integration
- Admin dashboard with analytics
- Responsive mobile-first design

### Phase 2 - Brand Rebrand (April 1, 2026)
- Applied official brandbook colors (red → blue)
- Replaced Manrope with DM Sans body font
- Added glassmorphism card system (.glass-card CSS class)
- Hero: Black logo with pulsing blue neon glow animation
- Product detail: Blue gradient shape behind product, glassmorphism info card
- Rounded buttons/inputs throughout
- Updated all pages: Home, Shop, Product, Auth, Cart, Checkout, Profile, Orders, Admin
- Catalog style integrated matching base reference (glassmorphism, blue glow, size pills)

## Testing Status
- Backend APIs: 12/12 passed
- Frontend: All pages verified working
- Auth flow: Login/Register/Logout verified
- Admin panel: Dashboard, orders, users tabs working
- Cart/Checkout: Add-to-cart, quantity update, Stripe redirect verified

## Backlog
### P1
- [ ] Email confirmations (orders/signup)
- [ ] PWA manifest + service worker
- [ ] Product image gallery (multiple images)
- [ ] Inventory stock management
### P2
- [ ] Wishlist (separate from cart)
- [ ] Order tracking
- [ ] Product reviews
- [ ] SEO meta tags per product
### P3
- [ ] OAuth Google login
- [ ] Multi-currency
- [ ] Discount codes
- [ ] Related products recommendations
