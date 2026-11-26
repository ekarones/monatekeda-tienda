# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: **tourists**, both foreign and domestic (Peruvians travelling), shopping for Peruvian crafts and keepsakes. Many meet the brand in a physical branch first: product labels carry QR codes that open the product page on their phone, often while standing in the shop. Others browse later to find something they saw or to order before or after the trip.

The job: find an authentic, good-quality piece of Peru to take home or give as a gift, understand what it is and what it costs, and order it with little friction.

## Product Purpose

The public online storefront of **Monatekeda**. It lets visitors browse the catalogue, see price and availability, choose variants (size, colour…), build a cart and send the order by WhatsApp. Success means a visitor finds a piece they trust and sends the order.

## Positioning

Monatekeda sells **handmade** pieces with **identifiable regional origin** (e.g. Puno, Lima) in **premium materials** (alpaca, silver, ceramics), not generic mass-produced souvenirs.

Monatekeda also **restores silver objects** (confirmed by the owner, 2026-11-15). Scope, prices and turnaround have not been provided; the home page invites visitors to send a photo over WhatsApp.

Owner-supplied figures shown on the home page: +10 years in the market, +3000 products, 24 partner family workshops.

## Operating Context

- Physical branches exist; printed labels with QR codes lead to `/qr/:code` → product page. Much traffic is mobile, in-store.
- Ordering is completed over WhatsApp (no online checkout or payment yet; Culqi integration is on the backend roadmap).
- Catalogue comes from the public API `/api/store` (tenant `monatekeda`): ~290 products, categories such as Joyería, Platería, Peluches (baby alpaca), Cerámica, Textiles & ropa, Souvenirs, Hogar & mesa, Carteras & bolsos. Tags currently mark origin (Lima, Puno).

## Capabilities and Constraints

- Catalogue browsing, search, category/tag/price filters, product detail with variations, QR lookup, local cart, WhatsApp order.
- Stock is respected: out-of-stock products show "Agotado" and cannot be added to the cart (owner decision, 2026-11-26, reverting the 2026-11-25 "everything available" mode, which `SELL_WITHOUT_STOCK` in `src/api/store.ts` can switch back on). In the API, stock is only a boolean and 462 of 596 products are marked out of stock. ~1 in 6 products has no photo; most have no short description. Product copy comes from the API in Spanish only.
- Rate limit 120 req/min per IP. No customer accounts yet.
- Language: **Spanish only** for now (confirmed), despite foreign tourists being a primary audience.
- Store name, tagline, WhatsApp number and social links (Instagram, Facebook, TikTok) live in `public/config.js` (editable on the server without rebuilding) until a `/api/store/info` endpoint exists. The WhatsApp number and the social links are still empty; WhatsApp actions fall back to the Contacto page and social icons render without links.
- "Top productos" uses a temporary selection (highest-priced, in-stock, with photo) until the API provides a ranking endpoint.

## Brand Commitments

- Name: **Monatekeda**.
- Logo: `public/logo.png` (256×256 PNG, transparent): a red-orange geometric heart built from Andean stepped (escalonado) forms, with a small diamond at the bottom and two holes at the top like a pendant. It must be used as provided.

## Evidence on Hand

- Logo (`public/logo.png`).
- Product photos via the API (WebP, with ~300px thumbnails).
- No photos of shops, workshops or artisans; no testimonials, press or artisan names. Do not fabricate artisans, stories, reviews or certifications.

## Product Principles

1. Trust first: make handmade, origin and material legible; never overstate.
2. Phone in hand, in the shop: the QR → product → WhatsApp path must be fast and clear on mobile.
3. Honest availability: out-of-stock is shown plainly but must not make the catalogue feel empty.
4. Spanish only, written simply enough for visitors who read Spanish as a second language.

## Accessibility & Inclusion

Plain, simple Spanish for non-native readers; strong legibility on phones in bright shop or outdoor light.
