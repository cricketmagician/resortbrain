# 07 · Guest seed content (both hotels)

M2's three seed areas are **hotel branding**, **menus and prices**, and **photos and room QR codes**. Everything
lives in `db/seed/guest/guest_seed.ts` (@m2 @m1). M1's runner and `server/db.ts` read this file, so every change
has to be **additive and backwards-compatible**:

- Keep every existing export name: `GUEST_HOTELS_SEED` and `GUEST_MENU_SEED`.
- Keep every existing field and id. M1's demo data references `hotel-001`, `hotel-002`, `item-001` and `item-004`.
- New fields are optional extras. `server/db.ts` spreads these objects, and `listPublicMenu` passes item fields
  straight through.
- Money is integer **paise**. Times are 24 h local strings. Hotel time zones are IANA names.
- Room and stay data belong to M3 (`db/seed/ops`). M2 reads them for QR codes but never edits them.

## 1. Hotel branding (extend each `GUEST_HOTELS_SEED` entry)

| Field (new, snake_case to match the file) | Grand Azure Resort & Spa (`hotel-001`, `grand-azure`) | The Heritage Palace & Haveli (`hotel-002`, `heritage-palace`) |
|---|---|---|
| `short_name` | Grand Azure | Heritage Palace |
| `accent` | `#5EC4D6` (lagoon teal) | `#E9A23B` (saffron) |
| `time_zone` | `Asia/Kolkata` | `Asia/Kolkata` |
| `contact.phone` | `+91 832 555 0101` (sample) | `+91 291 555 0202` (sample) |
| `contact.email` | `concierge@grandazure.example` | `concierge@heritagepalace.example` |
| `contact.address` | Candolim Beach Road, North Goa, Goa 403515 | Palace Road, Jodhpur, Rajasthan 342006 |
| `contact.gstin` | `30AAACG0000A1Z5` (sample) | `08AAACH0000A1Z5` (sample) |
| `info.wifi_name` | `GrandAzure-Guest` | `HeritagePalace-Guest` |
| `info.checkout_time` | 11:00 | 12:00 |
| `info.breakfast_hours` | 07:00–10:30 · Azure Terrace | 07:30–10:30 · Durbar Hall |
| `info.pool_hours` | 07:00–21:00 · Infinity pool | 08:00–20:00 · Courtyard pool |
| `info.delivery_estimate` | usually 25–35 min | usually 30–40 min |
| `category_order` | All-Day Gourmet Dining, Signature Grills, Indian Classics, Beverages & Mixology, Desserts | Royal Heritage Feast, From the Tandoor, Palace Beverages, Mithai & Desserts |

Use `.example` email domains and "sample" phone numbers and GSTINs, never a real business's details. On the
invoice, the sample GSTIN prints with a small "Sample" suffix in test mode.

**Request presets** (`request_presets`), shared by both hotels unless a hotel overrides them:

| Category | Presets (slug: label) |
|----------|-----------------------|
| housekeeping | `towels`: Extra towels · `cleaning`: Room cleaning · `turndown`: Turndown service · `linen`: Fresh bed linen |
| amenities | `toiletries`: Toiletries kit · `pillows`: Extra pillows · `iron`: Iron and board · `water`: Bottled water |
| front_desk | `late-checkout`: Late check-out · `taxi`: Book a taxi · `luggage`: Help with luggage · `wake-up`: Wake-up call |
| maintenance | `ac`: AC not cooling · `tv-wifi`: TV or Wi-Fi help · `plumbing`: Plumbing issue · `lights`: Lights not working |

(Heritage Palace overrides `amenities.water` with "Copper jug of water" as a local touch.)

## 2. Menus and prices (extend `GUEST_MENU_SEED`)

Keep the existing seven items exactly (ids, names, prices), with one exception: `item-202` (kulfi) moves to the
"Mithai & Desserts" category. Add a `featured: true` flag where marked ★. Allergen tags use the existing
vocabulary plus `Shellfish` and `Sesame`. Veg follows the Indian convention, so items containing egg are
non-veg.

### Grand Azure Resort & Spa (`hotel-001`): 18 items

| id | Category | Name | ₹ | paise | Veg | Allergens | ★ |
|----|----------|------|---|-------|-----|-----------|---|
| item-001 | All-Day Gourmet Dining | Artisan Avocado Sourdough Tartine *(existing)* | 550 | 55000 | ✓ | Gluten | |
| item-002 | All-Day Gourmet Dining | Wood-Fired Truffle & Wild Mushroom Pizza *(existing)* | 890 | 89000 | ✓ | Dairy, Gluten | ★ |
| item-006 | All-Day Gourmet Dining | Azure Club Sandwich (roast chicken, fried egg, smoked bacon, hand-cut fries) | 650 | 65000 | ✗ | Gluten, Eggs | |
| item-007 | All-Day Gourmet Dining | Kerala Prawn Moilee with Lace Appam | 1150 | 115000 | ✗ | Shellfish | ★ |
| item-008 | All-Day Gourmet Dining | Burrata, Heirloom Tomato & Basil Oil | 720 | 72000 | ✓ | Dairy | |
| item-003 | Signature Grills | Coastal Grilled King Salmon *(existing)* | 1250 | 125000 | ✗ | Fish, Dairy | ★ |
| item-009 | Signature Grills | Tandoori Lobster Tail, Garlic Butter | 2450 | 245000 | ✗ | Shellfish, Dairy | ★ |
| item-010 | Signature Grills | Charcoal Paneer Tikka, Mint Chutney | 690 | 69000 | ✓ | Dairy | |
| item-011 | Indian Classics | Butter Chicken & Garlic Naan | 890 | 89000 | ✗ | Dairy, Gluten | |
| item-012 | Indian Classics | Dal Makhani & Jeera Rice | 620 | 62000 | ✓ | Dairy | |
| item-013 | Indian Classics | Hyderabadi Vegetable Dum Biryani | 680 | 68000 | ✓ | Dairy, Nuts | |
| item-004 | Beverages & Mixology | Fresh Royal Coconut Water *(existing)* | 250 | 25000 | ✓ | — | |
| item-014 | Beverages & Mixology | Cold Brew with Coconut Cream | 320 | 32000 | ✓ | — | |
| item-015 | Beverages & Mixology | Watermelon & Mint Cooler | 280 | 28000 | ✓ | — | |
| item-016 | Beverages & Mixology | Masala Chai Pot for Two | 220 | 22000 | ✓ | Dairy | |
| item-005 | Desserts | Belgian Dark Chocolate Fondant *(existing)* | 450 | 45000 | ✗ | Dairy, Gluten, Eggs | ★ |
| item-017 | Desserts | Alphonso Mango Kulfi | 380 | 38000 | ✓ | Dairy, Nuts | |
| item-018 | Desserts | Espresso Tiramisu Jar | 520 | 52000 | ✗ | Dairy, Gluten, Eggs | |

### The Heritage Palace & Haveli (`hotel-002`): 13 items

| id | Category | Name | ₹ | paise | Veg | Allergens | ★ |
|----|----------|------|---|-------|-----|-----------|---|
| item-201 | Royal Heritage Feast | Dal Baati Churma Thali *(existing)* | 750 | 75000 | ✓ | Dairy, Gluten | ★ |
| item-203 | Royal Heritage Feast | Jodhpuri Laal Maas with Bajra Roti | 1190 | 119000 | ✗ | — | ★ |
| item-204 | Royal Heritage Feast | Gatte ki Sabzi with Missi Roti | 640 | 64000 | ✓ | Dairy, Gluten | |
| item-205 | Royal Heritage Feast | Ker Sangri with Makki Roti | 590 | 59000 | ✓ | — | |
| item-206 | From the Tandoor | Mutton Seekh Kebab, Onion Rings | 990 | 99000 | ✗ | Dairy | ★ |
| item-207 | From the Tandoor | Malai Paneer Tikka | 720 | 72000 | ✓ | Dairy, Nuts | |
| item-208 | From the Tandoor | Stuffed Tandoori Aloo | 560 | 56000 | ✓ | Dairy | |
| item-209 | Palace Beverages | Kesariya Thandai | 320 | 32000 | ✓ | Dairy, Nuts | ★ |
| item-210 | Palace Beverages | Rose Sharbat with Basil Seeds | 240 | 24000 | ✓ | — | |
| item-211 | Palace Beverages | Spiced Masala Chaas | 180 | 18000 | ✓ | Dairy | |
| item-202 | Mithai & Desserts | Kesar Pista Saffron Kulfi *(existing, category moved)* | 350 | 35000 | ✓ | Dairy, Nuts | |
| item-212 | Mithai & Desserts | Ghevar with Saffron Rabri | 420 | 42000 | ✓ | Dairy, Gluten | ★ |
| item-213 | Mithai & Desserts | Moong Dal Halwa | 380 | 38000 | ✓ | Dairy, Nuts | |

Write a sensory one-sentence description for each new item, 90 to 140 characters, in the same register as the
existing ones: ingredients first, then technique. For example: *"Slow-cooked Mathania chilli mutton, smoked with
cloves and ghee, served with hand-patted millet roti."*

## 3. Photos

**Sandbox limitation:** the implementation sandbox blocks `images.unsplash.com` (egress policy), so image URLs
can't be verified or rendered there. The plan for that:

1. **Keep every existing `image_url`** (and the hotel `logo_url` / `banner_url`). The teammate who created the
   seed chose them.
2. **New items ship without `image_url` by default.** `MenuItemCard` and `ItemDetail` render the designed
   **plate tile** instead: a category gradient (from the token palette, deterministic per category), a centred
   lucide icon for the category (Sandwich, Beef, Soup, Coffee, CakeSlice, Salad, Fish, IceCreamCone, CupSoda,
   Flame for the tandoor), and the dish initial in Playfair. It has to look intentional, not broken.
3. `scripts/verify-seed-images.mjs` HEAD-checks every `image_url`, `logo_url` and `banner_url` in the guest seed
   and exits 1 on anything that isn't 200. **Run it on a machine or Vercel preview with open internet.** The human
   M2 then adds verified Unsplash URLs for the new items (format:
   `https://images.unsplash.com/photo-<id>?w=500&auto=format&fit=crop&q=80`).
4. Both hotels currently share one banner (`photo-1566073771259-…`). Log it in `docs/m2/qa-log.md` so the human
   M2 can pick a distinct Heritage banner (a palace courtyard) once they can verify it.

## 4. Room QR codes

- **What they encode:** `{NEXT_PUBLIC_SITE_URL}/q/{room.qr_code_token}` (for example
  `https://resortbrain.vercel.app/q/QR_AZURE_304`). The tokens come from `db/seed/ops/ops_seed.ts` (M3). Don't
  copy them into the guest seed.
- **Print sheet** `/print/qr/[hotel]` (gated by `RB_ENABLE_QR_SHEET=true`, and `notFound()` otherwise):
  - A4, two tent cards per page.
  - Each card has the hotel crest and name (Playfair), "In-room dining & service", a 52 mm QR (`qrcode` SVG,
    error correction `M`, 2-module quiet zone), three icon lines (Order food · Request anything · Pay your bill),
    the room number in large tabular type, and "No app needed — just scan with your camera".
  - It uses the print tokens (black on white).
  - Only rooms from the ops seed for that hotel are shown. Vacant rooms still get a card, because their QR simply
    shows the "isn't active" screen until check-in.
- **Demo QR** on the landing page: `NEXT_PUBLIC_DEMO_QR_TOKEN` (default `QR_AZURE_304`, Room 304 with the active
  stay for Dr. Siddharth Verma).
- **Venue day** (playbook §11, step 8): print the sheet for both hotels, and test each code with an iPhone and an
  Android camera from the printed paper.

## 5. Seed acceptance

- [ ] `npm run typecheck` passes with M1's `server/db.ts` unchanged (the additive fields don't break inference).
- [ ] Both menus render fully in mock and api modes. Categories follow `category_order`. Chef's picks show the ★
      items.
- [ ] Every price is an integer in paise. The existing seven items are byte-for-byte unchanged apart from
      `item-202`'s category and the added `featured` flags.
- [ ] Items without a photo render the plate tile, which looks deliberate in both themes.
- [ ] `/print/qr/grand-azure` prints four cards (Villa 101, Suite 204, Room 304, Villa 105) with scannable codes
      when the flag is on, and returns 404 when it's off.
