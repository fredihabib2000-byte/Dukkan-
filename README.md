# 🛒 Dukkan — Grocery Delivery Platform

A multi-tenant grocery delivery platform. Store owners manage their inventory and orders through a web dashboard; customers browse stores and order delivery through the mobile app.

---

## Project Structure

```
dukkan/
├── customer-app/     React Native (Expo) — iOS & Android customer app
├── merchant-web/     Next.js — Merchant web dashboard
└── .github/
    └── workflows/    CI/CD (Vercel + EAS)
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Customer App | React Native + Expo Router |
| Merchant Dashboard | Next.js 14 + Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL + Auth + Realtime) |
| Mobile Builds | EAS (Expo Application Services) |
| Merchant Hosting | Vercel |
| State Management | Zustand (mobile cart) |

---

## Quick Start

### 1. Prerequisites

```bash
npm install -g expo-cli eas-cli
```

### 2. Customer App (mobile)

```bash
cd customer-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

### 3. Merchant Dashboard (web)

```bash
cd merchant-web
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Deployment

### Merchant Dashboard → Vercel

```bash
cd merchant-web
npx vercel --prod
```

Set these environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Customer App → App Store + Play Store

**Step 1:** Create an Expo account at expo.dev and log in:
```bash
eas login
```

**Step 2:** Configure your app:
- Update `customer-app/app.json` → `ios.bundleIdentifier` and `android.package`
- Update `customer-app/eas.json` → add your Apple ID and Team ID

**Step 3:** Build for both platforms:
```bash
cd customer-app
eas build --platform all
```

**Step 4:** Submit to stores:
```bash
eas submit --platform ios      # requires Apple Developer account ($99/year)
eas submit --platform android  # requires Google Play Console account ($25 one-time)
```

---

## Onboarding a New Store Owner

1. Create a Supabase Auth user for the merchant (or have them sign up)
2. Insert a row into `stores` with their info
3. Insert a row into `store_staff` linking their `user_id` to the `store_id` with `role = 'owner'`
4. Send them the merchant dashboard URL
5. They log in and start adding products

---

## Supabase Setup

**Project URL:** `https://dbkrbrgnqzlreigkfjig.supabase.co`

### Tables

| Table | Description |
|-------|-------------|
| `stores` | Supermarket tenants |
| `profiles` | Customer profiles (auto-created on signup) |
| `store_staff` | Merchant users linked to stores |
| `categories` | Product aisles |
| `products` | Store inventory |
| `promotions` | Banner deals |
| `customer_addresses` | Delivery addresses |
| `orders` | Customer orders |
| `order_items` | Products in each order |
| `cart_items` | Server-side cart |
| `reviews` | Store ratings |

---

## GitHub Actions Secrets Required

For CI/CD to work, add these in your GitHub repo → Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `EXPO_TOKEN` | EAS token from expo.dev |

---

## Roadmap

- [ ] Push notifications (Expo Push + Supabase Edge Functions)
- [ ] Google Maps delivery tracking
- [ ] Stripe payment integration
- [ ] Loyalty/rewards system
- [ ] Merchant mobile app (React Native)
- [ ] Multi-language support (Arabic / English / French)
- [ ] Driver app for delivery
