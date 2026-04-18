# Clothix — Luxury E-commerce Setup Guide

## Project Structure

```
clothix/
├── src/
│   ├── components/
│   │   ├── ProductCard.jsx     # Storefront product card with size selector + WhatsApp CTA
│   │   └── ProductForm.jsx     # Admin modal: upload image, fill details, save
│   ├── hooks/
│   │   └── useAuth.js          # Auth context (login/logout state)
│   ├── lib/
│   │   ├── supabase.js         # DB + Storage helpers (fetch/create/update/delete/upload)
│   │   └── whatsapp.js         # handleBuyNow() + formatPrice()
│   ├── pages/
│   │   ├── Store.jsx           # Public storefront grid
│   │   ├── Login.jsx           # Admin login page
│   │   └── Admin.jsx           # Private dashboard (CRUD + image upload)
│   ├── App.jsx                 # Router + auth guard
│   ├── main.jsx
│   └── index.css
├── supabase_setup.sql          # Run once in Supabase SQL Editor
├── .env.example                # Copy → .env.local and fill in your keys
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Step 1 — Supabase Setup

### 1a. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Pick a name (e.g. `clothix`) and a strong database password
3. Choose the region closest to your users

### 1b. Run the SQL schema
1. In your Supabase dashboard → **SQL Editor** → New Query
2. Paste the entire contents of `supabase_setup.sql`
3. Click **Run**

This creates:
- `products` table with all columns + RLS policies
- `cloth-images` storage bucket (public read, authenticated write)
- Optional seed data with 4 sample products

### 1c. Create your admin user
1. Supabase Dashboard → **Authentication** → Users → **Invite User**
2. Enter your email and set a password
3. This is the account you'll use to log into `/admin`

### 1d. Get your API keys
1. Supabase Dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

---

## Step 2 — Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL, anon key, and WhatsApp number

# 3. Start dev server
npm run dev

# App runs at http://localhost:5173
# Admin at   http://localhost:5173/admin
```

---

## Step 3 — Deploy to Vercel

### 3a. Push to GitHub
```bash
git init
git add .
git commit -m "Initial Clothix commit"
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/clothix.git
git push -u origin main
```

### 3b. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework Preset: **Vite** (auto-detected)
4. Add Environment Variables (same as your `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_NUMBER`
5. Click **Deploy** — done!

---

## How the Admin Works

| Action | How |
|--------|-----|
| **Add product** | `/admin` → Add Product → fill form → Upload Image → Save |
| **Edit product** | Click Edit on any row → change fields → Save Changes |
| **Delete product** | Click Delete → confirm → product + image removed |
| **Image upload** | Click the image box in the form → selects file → uploads to Supabase Storage → saves public URL to DB automatically |

---

## How the WhatsApp Order Works

1. Customer browses `/` (storefront)
2. Selects a size
3. Clicks **Order on WhatsApp**
4. WhatsApp opens (app or web) with this message pre-filled:

```
Hi Clothix! I'd like to order: *Silk Noir Blazer* in size *M*. Price: *₹28,900*. Please confirm availability. 🛍️
```

To change your WhatsApp number, update `VITE_WHATSAPP_NUMBER` in `.env.local` and in Vercel environment variables.

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Product storefront |
| `/login` | Public | Admin login |
| `/admin` | Private (auth required) | Product management dashboard |

---

## Adding a Payment Gateway Later

When your client is ready for online payments, drop in Razorpay or Stripe:

1. Create a Supabase Edge Function for the payment intent
2. Add an `orders` table to track purchases
3. Replace the WhatsApp button with a checkout flow

The product/admin infrastructure you have now is already production-ready for that upgrade.

---

## .gitignore

Make sure `.env.local` is in your `.gitignore`:

```
node_modules/
dist/
.env.local
.env*.local
```
