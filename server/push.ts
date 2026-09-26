// server/push.ts
// Web Push (VAPID) registration and delivery dispatch

export interface PushSubscriptionItem {
  id: string;
  hotel_id: string;
  user_id?: string;
  department: 'kitchen' | 'front_desk' | 'housekeeping' | 'manager';
  deviceName: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  created_at: string;
}

const subscriptions: PushSubscriptionItem[] = [];

export function registerPushDevice(item: Omit<PushSubscriptionItem, 'id' | 'created_at'>): PushSubscriptionItem {
  // Check if endpoint already registered
  const existing = subscriptions.find((s) => s.subscription.endpoint === item.subscription.endpoint);
  if (existing) {
    existing.department = item.department;
    existing.deviceName = item.deviceName;
    return existing;
  }

  const newSub: PushSubscriptionItem = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...item,
    created_at: new Date().toISOString(),
  };

  subscriptions.push(newSub);
  return newSub;
}

export function getHotelSubscriptions(hotel_id: string, department?: string): PushSubscriptionItem[] {
  return subscriptions.filter((s) => s.hotel_id === hotel_id && (!department || s.department === department));
}

export async function sendWebPushNotification(params: {
  hotel_id: string;
  department?: 'kitchen' | 'front_desk' | 'housekeeping' | 'manager';
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  const targets = getHotelSubscriptions(params.hotel_id, params.department);
  console.log(`[PUSH] Dispatching Web Push to ${targets.length} devices in department: ${params.department || 'ALL'}`, {
    title: params.title,
    body: params.body,
  });

  return {
    dispatched: targets.length,
    timestamp: new Date().toISOString(),
  };
}
