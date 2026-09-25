# Plotify Bangladesh 🇧🇩

A modern real estate marketplace web application for Bangladesh (inspired by `buyproperty.store`), built with **Next.js (App Router)**, **Tailwind CSS**, **Lucide Icons**, and **Supabase**.

---

## 🌟 Key Features

1. **Bangladesh Real Estate Localization**:
   - **BDT Currency Format**: Automatically displays prices in **Lakh (লাখ)** and **Crore (কোটি)**, e.g. `৳ 3.75 Crore` or `৳ 65 Lakh`.
   - **Land Measurements**: Supports **Sq Ft**, **Katha (কাঠা)**, **Bigha (বিঘা)**, and **Decimal (শতাংশ)** with built-in conversion utilities (`1 Katha ≈ 720 Sq Ft`).
   - **Location Hierarchy**: Dhaka areas (Gulshan, Banani, Uttara, Bashundhara R/A, Purbachal Smart City, Dhanmondi, Mirpur) and major divisions (Chattogram, Sylhet, Rajshahi, etc.).
   - **Utility & Legal Transparency**: RAJUK Approval verification, Titas Gas pipeline status, DESCO/DPDC prepaid electricity, Dhaka WASA connection, generator backup, and parking.

2. **Full Page Structure**:
   - **Home Page (`/`)**: Hero section with quick buy/rent search, property categories, verified featured properties, location highlights, trust pillars, and seller CTA.
   - **Search & Filter Page (`/properties`)**: Filter by Purpose (Buy/Rent), Type (Apartments, Plots, Commercial), Location, Price range (BDT), Bedrooms, and Bangladesh-specific features.
   - **Property Details Page (`/properties/[id]`)**: Full image gallery, specs breakdown, per-sqft / per-katha price calculations, utility checklist, direct seller phone call, and 1-click WhatsApp chat.
   - **Add Property Dashboard (`/dashboard/add-property`)**: Multi-section form to post new listings with instant Supabase database synchronization.
   - **Seller Dashboard (`/dashboard`)**: Track listing views, leads, portfolio value, and manage property catalog.

---

## 🚀 Getting Started

### 1. Install Dependencies
Dependencies are already configured and installed:
```bash
npm install
```

### 2. Configure Supabase

1. Copy `.env.example` to `.env.local` if you haven't already:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
2. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to the **SQL Editor**.
3. Copy and run the script in [`supabase/schema.sql`](./supabase/schema.sql) to create the `properties`, `property_inquiries` tables, enums, RLS policies, and search indexes.

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Plotify/
├── .env.example                     # Supabase environment variables template
├── .env.local                       # Local environment variables
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration with @/* path alias
├── tailwind.config.ts               # Tailwind CSS theme & brand colors
├── postcss.config.mjs               # PostCSS configuration
├── next.config.mjs                  # Next.js configuration
├── supabase/
│   └── schema.sql                   # Full PostgreSQL schema & RLS policies
└── src/
    ├── app/
    │   ├── layout.tsx               # Root layout with Navbar & Footer
    │   ├── page.tsx                 # Home page
    │   ├── globals.css              # Global styles & Tailwind directives
    │   ├── properties/
    │   │   ├── page.tsx             # Search & filter page
    │   │   ├── properties-client.tsx# Interactive search client
    │   │   └── [id]/
    │   │       └── page.tsx         # Property details page
    │   └── dashboard/
    │       ├── page.tsx             # Seller & agent dashboard
    │       └── add-property/
    │           └── page.tsx         # Add property form
    ├── components/
    │   ├── navbar.tsx               # Header with Bangladesh brand identity
    │   ├── footer.tsx               # Footer with Dhaka HQ and area links
    │   ├── property-card.tsx        # Reusable property card with BDT price
    │   └── search-bar.tsx           # Hero search bar with filters
    └── lib/
        ├── types.ts                 # TypeScript data contracts
        ├── utils.ts                 # BDT formatting & area unit conversion
        ├── supabase/
        │   ├── client.ts            # Supabase browser client
        │   ├── server.ts            # Supabase server client (cookies)
        │   └── middleware.ts        # Auth session refresher
        └── data/
            └── mock-properties.ts   # Curated Bangladesh real estate mock data
```
