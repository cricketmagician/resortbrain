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
  // Hotel 1 Rooms (Grand Azure Resort)
  {
    id: 'room-101',
    hotel_id: 'hotel-001',
    room_number: 'Room 101',
    room_type: 'Oceanfront Pool Villa',
    status: 'occupied',
    qr_code_token: 'QR_GRAND-AZURE_101',
  },
  {
    id: 'room-102',
    hotel_id: 'hotel-001',
    room_number: 'Room 102',
    room_type: 'Royal Suite',
    status: 'occupied',
    qr_code_token: 'QR_GRAND-AZURE_102',
  },
  {
    id: 'room-204',
    hotel_id: 'hotel-001',
    room_number: 'Room 204',
    room_type: 'Garden Villa',
    status: 'occupied',
    qr_code_token: 'QR_GRAND-AZURE_204',
  },
  {
    id: 'room-304',
    hotel_id: 'hotel-001',
    room_number: 'Room 304',
    room_type: 'Deluxe Suite',
    status: 'occupied',
    qr_code_token: 'QR_GRAND-AZURE_304',
  },
  {
    id: 'room-105',
    hotel_id: 'hotel-001',
    room_number: 'Room 105',
    room_type: 'Cliffside Sunset Villa',
    status: 'available',
    qr_code_token: 'QR_GRAND-AZURE_105',
  },

  // Hotel 2 Rooms (The Heritage Palace)
  {
    id: 'room-201',
    hotel_id: 'hotel-002',
    room_number: 'Maharaja Suite 1',
    room_type: 'Heritage Palace Suite',
    status: 'occupied',
    qr_code_token: 'QR_HERITAGE-PALACE_1',
  },
  {
    id: 'room-202',
    hotel_id: 'hotel-002',
    room_number: 'Royal Haveli 2',
    room_type: 'Courtyard Haveli',
    status: 'available',
    qr_code_token: 'QR_HERITAGE-PALACE_2',
  },
];

export const OPS_STAYS_SEED = [
  {
    id: 'stay-101',
    hotel_id: 'hotel-001',
    room_id: 'room-101',
    room_number: 'Room 101',
    guest_id: 'guest-101',
    guest_name: 'Kabir Mehta',
    status: 'active',
    stay_token: 'stay_token_azure_101',
    checkin_pin: '1014',
    check_in: new Date(Date.now() - 86400000).toISOString(),
    check_out: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
  {
    id: 'stay-102',
    hotel_id: 'hotel-001',
    room_id: 'room-102',
    room_number: 'Room 102',
    guest_id: 'guest-102',
    guest_name: 'Ananya Sen',
    status: 'active',
    stay_token: 'stay_token_azure_102',
    checkin_pin: '1028',
    check_in: new Date(Date.now() - 43200000).toISOString(),
    check_out: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
  {
    id: 'stay-204',
    hotel_id: 'hotel-001',
    room_id: 'room-204',
    room_number: 'Room 204',
    guest_id: 'guest-204',
    guest_name: 'Rohan Kapoor',
    status: 'active',
    stay_token: 'stay_token_azure_204',
    checkin_pin: '2045',
    check_in: new Date(Date.now() - 21600000).toISOString(),
    check_out: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
  {
    id: 'stay-001',
    hotel_id: 'hotel-001',
    room_id: 'room-304',
    room_number: 'Room 304',
    guest_id: 'guest-001',
    guest_name: 'Dr. Siddharth Verma',
    status: 'active',
    stay_token: 'stay_token_live_demo_room_304',
    checkin_pin: '4829',
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
    checkin_pin: '7192',
    check_in: new Date(Date.now() - 43200000).toISOString(),
    check_out: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
];
