# Zeuer E-Commerce Platform - PRD

## Problem Statement
Transform the existing zeuer.github.io static HTML site into a professional, scalable e-commerce platform comparable to Nike/Adidas quality. The brand is "Zeuer" - a Mexican streetwear/sportswear brand with tagline "Técnico. Táctico. Lógico."

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + Radix UI (shadcn/ui)
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver)
- **Database**: MongoDB
- **Payment**: Stripe (via emergentintegrations library)
- **Auth**: JWT with httpOnly cookies + bcrypt password hashing
- **Deployment**: Render-ready (Procfile + runtime.txt), GitHub Pages redirect

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
- Logo: Hero uses full ZEUER logo (/logo.svg), navbar/footer use simplified Z lightning bolt (/logo-simple.svg)
- Cards: Glassmorphism (backdrop-blur-24px, rgba(14,27,42,0.6) bg, blue border)
- Product pages: Blue gradient shape behind product image
- Buttons: Rounded-lg, blue (#0A6CFF), with box-shadow glow

## What's Been Implemented

### Phase 1 - MVP (April 1, 2026)
- Full JWT auth system with bcrypt, brute force protection
- 6-product catalog with category/size/search filtering
- Shopping cart with IVA (16%) calculation
- Stripe checkout integration
- Responsive mobile-first design

### Phase 2 - Brand Rebrand (April 1, 2026)
- Applied official brandbook colors
- Glassmorphism card system (.glass-card CSS class)
- Hero: ZEUER logo with pulsing blue neon glow animation
- Catalog with glassmorphism cards, blue glow, size pills

### Phase 3 - Admin Panel (April 1, 2026)
- Admin Dashboard with revenue, orders, users, conversion stats
- Product CRUD (Create/Edit/Delete/Toggle active)
- Orders management with status updates and CSV export
- Users list
- Analytics with trending products, hourly activity charts
- Content management
- AI Agent (ZEUER AI) powered by GPT-4.1 via Emergent LLM

### Phase 4 - Asset Migration & Deploy Prep (April 13, 2026)
- Migrated all assets from zeuer.github.io to local /public/ folder
- Hero logo: /logo.svg (full ZEUER text)
- Navbar/footer logo: /logo-simple.svg (Z lightning bolt)
- Product images: /assets/images/jersey.png, dwnc.png, zgb.png
- Fixed AdminOrders.js useEffect dependency warning
- Updated CORS to support multiple origins
- Added Render deployment files (Procfile, runtime.txt)
- Created GitHub Pages redirect (github-pages-redirect/index.html)
- Backend seed auto-migrates old zeuer.github.io URLs to local paths

## Testing Status
- Backend APIs: 27/27 passed (iteration_2)
- Frontend: All major flows verified
- Auth flow: Login/Register/Logout verified
- Admin panel: Dashboard, Products, Orders, Users, Analytics, AI all working
- Cart/Checkout: Add-to-cart, quantity update, IVA calculation verified
- Product images: All 3 jersey images loading correctly
- Logo SVGs: Both hero and navbar logos loading correctly

## Deployment
### Render (Free Tier) - Backend
- Procfile: `web: uvicorn server:app --host 0.0.0.0 --port $PORT`
- runtime.txt: `3.11.0`
- Env vars needed: MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, STRIPE_API_KEY, FRONTEND_URL, CORS_ORIGINS, EMERGENT_LLM_KEY

### GitHub Pages - Redirect
- Place github-pages-redirect/index.html as root index.html in zeuer.github.io repo
- Redirects visitors to deployed app URL

## Backlog
### P1
- [ ] Stripe Webhooks for auto order status update
- [ ] CSV export from Admin Orders
- [ ] Email confirmations (orders/signup)
### P2
- [ ] PWA manifest + service worker
- [ ] Product image gallery (multiple images)
- [ ] Inventory stock management
- [ ] Wishlist (separate from cart)
- [ ] Order tracking
### P3
- [ ] Product reviews
- [ ] SEO meta tags per product
- [ ] OAuth Google login
- [ ] Multi-currency
- [ ] Discount codes
- [ ] Related products recommendations
