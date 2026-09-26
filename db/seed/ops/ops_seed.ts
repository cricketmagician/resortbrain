// db/seed/ops/ops_seed.ts
// Operations seed content: staff in every role, rooms, floors, plans, and active stays

export const OPS_STAFF_SEED = [
  // Hotel 1 Staff (Grand Azure Resort)
  {
    id: 'user-001',
    hotel_id: 'hotel-001',
    email: 'chef.marco@azure.com',
    fullName: 'Chef Marco Bellini',
    role: 'kitchen_chef',
  },
  {
    id: 'user-002',
    hotel_id: 'hotel-001',
    email: 'priya.desk@azure.com',
    fullName: 'Priya Sharma',
    role: 'front_desk',
  },
  {
    id: 'user-003',
    hotel_id: 'hotel-001',
    email: 'rajesh.clean@azure.com',
    fullName: 'Rajesh Kumar',
    role: 'housekeeping',
  },
  {
    id: 'user-004',
    hotel_id: 'hotel-001',
    email: 'vikram.gm@azure.com',
    fullName: 'Vikram Oberoi (GM)',
    role: 'hotel_manager',
  },

  // Hotel 2 Staff (The Heritage Palace)
  {
    id: 'user-005',
    hotel_id: 'hotel-002',
    email: 'chef.sen@heritage.com',
    fullName: 'Chef Sameer Sen',
    role: 'kitchen_chef',
  },
  {
    id: 'user-006',
    hotel_id: 'hotel-002',
    email: 'alok.gm@heritage.com',
    fullName: 'Alok Nath (GM)',
    role: 'hotel_manager',
  },

  // Platform Admin
  {
    id: 'user-000',
    hotel_id: 'hotel-001',
    email: 'admin@resortbrain.com',
    fullName: 'System SuperAdmin',
    role: 'platform_admin',
  },
];

export const OPS_ROOMS_SEED = [
  // Hotel 1 Rooms
  {
    id: 'room-101',
    hotel_id: 'hotel-001',
    room_number: 'Villa 101',
    room_type: 'Oceanfront Pool Villa',
    status: 'occupied',
    qr_code_token: 'QR_AZURE_101',
  },
  {
    id: 'room-102',
    hotel_id: 'hotel-001',
    room_number: 'Suite 204',
    room_type: 'Royal Panorama Suite',
    status: 'occupied',
    qr_code_token: 'QR_AZURE_204',
  },
  {
    id: 'room-103',
    hotel_id: 'hotel-001',
    room_number: 'Room 304',
    room_type: 'Deluxe Garden Sanctuary',
    status: 'occupied',
    qr_code_token: 'QR_AZURE_304',
  },
  {
    id: 'room-104',
    hotel_id: 'hotel-001',
    room_number: 'Villa 105',
    room_type: 'Cliffside Sunset Villa',
    status: 'available',
    qr_code_token: 'QR_AZURE_105',
  },

  // Hotel 2 Rooms
  {
    id: 'room-201',
    hotel_id: 'hotel-002',
    room_number: 'Maharaja Suite 1',
    room_type: 'Heritage Palace Suite',
    status: 'occupied',
    qr_code_token: 'QR_HERITAGE_1',
  },
];

export const OPS_STAYS_SEED = [
  {
    id: 'stay-001',
    hotel_id: 'hotel-001',
    room_id: 'room-103',
    room_number: 'Room 304',
    guest_id: 'guest-001',
    guest_name: 'Dr. Siddharth Verma',
    status: 'active',
    stay_token: 'stay_token_live_demo_room_304',
    check_in: new Date(Date.now() - 86400000).toISOString(),
    check_out: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
  {
    id: 'stay-002',
    hotel_id: 'hotel-002',
    room_id: 'room-201',
    room_number: 'Maharaja Suite 1',
    guest_id: 'guest-002',
    guest_name: 'Lord Arthur Sterling',
    status: 'active',
    stay_token: 'stay_token_heritage_maharaja',
    check_in: new Date(Date.now() - 43200000).toISOString(),
    check_out: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
];
