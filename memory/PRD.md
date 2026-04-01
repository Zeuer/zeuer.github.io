# Zeuer E-Commerce Platform - PRD

## Problem Statement
Transform the existing zeuer.github.io static HTML site into a professional, scalable e-commerce platform comparable to Nike/Adidas quality. The brand is "Zeuer" - a Mexican streetwear/sportswear brand with tagline "Técnico. Táctico. Lógico."

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + Radix UI (shadcn/ui)
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver)
- **Database**: MongoDB
- **Payment**: Stripe (via emergentintegrations library)
- **Auth**: JWT with httpOnly cookies + bcrypt password hashing

## User Personas
1. **Customer**: Browse products, add to cart, checkout with Stripe, view order history
2. **Admin**: Manage orders, view analytics, manage products, track users

## Core Requirements (Static)
- Spanish language UI ("Zeuer" brand identity)
- Dark theme (#0A0A0A background, #ff3c3c accent)
- Font system: Unbounded (headings), Manrope (body), IBM Plex Mono (labels/specs)
- Mobile-first responsive design
- Secure JWT auth with brute force protection

## What's Been Implemented (April 1, 2026)

### Backend (FastAPI)
- JWT Authentication (register, login, logout, me, refresh, forgot-password, reset-password)
- Admin seeding with role-based access
- Brute force login protection
- Product catalog API with filtering (category, search, size, price)
- Shopping cart API (add, update, remove, auto-calculation with 16% IVA)
- Stripe checkout integration (create session, poll status, webhook)
- Order management (create after payment, history)
- Admin dashboard API (revenue, orders, users, analytics)
- Admin order status management
- Admin product management
- Analytics event tracking (views, add-to-cart, purchases)
- Newsletter subscription
- MongoDB indexes for performance

### Frontend (React)
- Homepage: Hero with logo/tagline, marquee banner, featured products, drops section, brand story, newsletter
- Shop page: Product grid with category/size filters, search
- Product detail: Image, sizes, colors, stock indicator, quantity selector, add-to-cart
- Auth: Login/Register form, forgot password flow
- Cart sidebar (Sheet component) with quantity controls
- Checkout page with Stripe redirect
- Payment success page with polling
- User profile with address management
- Order history page
- Admin panel: Dashboard (revenue, orders, users, products, analytics), order management with status updates, user list, analytics charts
- Responsive mobile-first design with hamburger menu
- Toast-ready design system

### Products Seeded (6)
1. Kit Irapuato '67 - $449 MXN (Jerseys)
2. Zeuer x DWNC - $599 MXN (Collaborations)
3. Zeuer GB Concept - $649 MXN (Concepts)
4. Zeuer Stealth Tee - $349 MXN (Basics)
5. Zeuer Track Pants - $549 MXN (Bottoms)
6. Zeuer Logo Cap - $299 MXN (Accessories)

## Prioritized Backlog

### P0 (Critical - Done)
- [x] Authentication system
- [x] Product catalog with filtering
- [x] Shopping cart
- [x] Stripe checkout
- [x] Admin panel
- [x] Responsive design

### P1 (High - Next)
- [ ] Email confirmations (order, signup) via SendGrid/Resend
- [ ] PWA manifest + service worker
- [ ] Product image gallery (multiple images)
- [ ] Inventory management (stock decrement on purchase)
- [ ] Wishlist (separate from cart)

### P2 (Medium)
- [ ] Dark/Light mode toggle
- [ ] Order tracking with shipping updates
- [ ] Product reviews/ratings
- [ ] Social sharing
- [ ] SEO meta tags per product page
- [ ] Admin: export orders CSV

### P3 (Low/Future)
- [ ] OAuth Google login
- [ ] Multi-currency support
- [ ] Discount codes/coupons
- [ ] Size guide
- [ ] Related products recommendations
- [ ] Blog/content section

## Next Tasks
1. Email confirmations for orders and signups
2. PWA setup for mobile-first experience
3. Product gallery with multiple images
4. Inventory stock management
5. Wishlist feature
