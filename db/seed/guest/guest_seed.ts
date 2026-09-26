// db/seed/guest/guest_seed.ts
// Guest and commerce seed content: branding, menus, prices, photos, and room QR codes

export const GUEST_HOTELS_SEED = [
  {
    id: 'hotel-001',
    slug: 'grand-azure',
    name: 'Grand Azure Resort & Spa',
    tagline: 'Luxury Coastal Sanctuary & Private Villas',
    logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80',
    currency: 'INR',
    tax_rate_percent: 18.0,
    service_charge_percent: 5.0,
    status: 'active',
  },
  {
    id: 'hotel-002',
    slug: 'heritage-palace',
    name: 'The Heritage Palace & Haveli',
    tagline: 'Regal Rajasthan Hospitality & Royal Suites',
    logo_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=120&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80',
    currency: 'INR',
    tax_rate_percent: 18.0,
    service_charge_percent: 5.0,
    status: 'active',
  },
];

export const GUEST_MENU_SEED = [
  // Hotel 1 Menu
  {
    id: 'item-001',
    hotel_id: 'hotel-001',
    category: 'All-Day Gourmet Dining',
    name: 'Artisan Avocado Sourdough Tartine',
    description: 'Crushed Hass avocado, organic microgreens, heirloom cherry tomatoes, cold-pressed olive drizzle.',
    price_paise: 55000, // ₹550.00
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
    is_veg: true,
    allergen_tags: ['Gluten'],
    is_available: true,
  },
  {
    id: 'item-002',
    hotel_id: 'hotel-001',
    category: 'All-Day Gourmet Dining',
    name: 'Wood-Fired Truffle & Wild Mushroom Pizza',
    description: 'Hand-stretched sourdough crust, wild forest porcini, buffalo mozzarella, black truffle oil.',
    price_paise: 89000, // ₹890.00
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
    is_veg: true,
    allergen_tags: ['Dairy', 'Gluten'],
    is_available: true,
  },
  {
    id: 'item-003',
    hotel_id: 'hotel-001',
    category: 'Signature Grills',
    name: 'Coastal Grilled King Salmon',
    description: 'Herb-crusted Atlantic salmon fillet, asparagus spears, saffron-infused lemon butter emulsion.',
    price_paise: 125000, // ₹1,250.00
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=80',
    is_veg: false,
    allergen_tags: ['Fish', 'Dairy'],
    is_available: true,
  },
  {
    id: 'item-004',
    hotel_id: 'hotel-001',
    category: 'Beverages & Mixology',
    name: 'Fresh Royal Coconut Water',
    description: 'Chilled tender coconut water served in shell with chia seeds and mint sprig.',
    price_paise: 25000, // ₹250.00
    image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80',
    is_veg: true,
    allergen_tags: [],
    is_available: true,
  },
  {
    id: 'item-005',
    hotel_id: 'hotel-001',
    category: 'Desserts',
    name: 'Belgian Dark Chocolate Fondant',
    description: '70% Valrhona dark chocolate lava cake, Madagascan vanilla bean gelato.',
    price_paise: 45000, // ₹450.00
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
    is_veg: false,
    allergen_tags: ['Dairy', 'Gluten', 'Eggs'],
    is_available: true,
  },

  // Hotel 2 Menu
  {
    id: 'item-201',
    hotel_id: 'hotel-002',
    category: 'Royal Heritage Feast',
    name: 'Dal Baati Churma Thali',
    description: 'Traditional slow-cooked lentils, ghee-soaked baatis, spiced churma with royal accompaniments.',
    price_paise: 75000, // ₹750.00
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
    is_veg: true,
    allergen_tags: ['Dairy', 'Gluten'],
    is_available: true,
  },
  {
    id: 'item-202',
    hotel_id: 'hotel-002',
    category: 'Royal Heritage Feast',
    name: 'Kesar Pista Saffron Kulfi',
    description: 'Rich reduced milk kulfi infused with Kashmiri saffron and crushed pistachios.',
    price_paise: 35000, // ₹350.00
    image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
    is_veg: true,
    allergen_tags: ['Dairy', 'Nuts'],
    is_available: true,
  },
];
